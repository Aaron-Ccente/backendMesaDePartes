import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { Oficio } from '../models/Oficio.js';
import { fileURLToPath } from 'url';

// --- Helpers de Handlebars ---
handlebars.registerHelper('json', (context) => JSON.stringify(context, null, 2));

// Helper para formatear fecha a lo grande: "Huancayo, 18 de Noviembre del 2025"
handlebars.registerHelper('formatLongDate', (date) => {
  if (!date) return '';
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateString = d.toLocaleDateString('es-ES', options);
  return `Huancayo, ${dateString}`;
});

// Helper para formatear hora
handlebars.registerHelper('formatTime', (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
});

// Helper para incrementar índice (para listas 1-based)
handlebars.registerHelper('inc', (value) => {
  return parseInt(value) + 1;
});

const TIPOS_DROGA_LABELS = {
  cocaina: 'Alcaloide de cocaína',
  marihuana: 'Cannabinoides (Marihuana)',
  benzodiacepinas: 'Benzodiacepinas',
  fenotiacinas: 'Fenotiacinas',
  barbituricos: 'Barbitúricos',
  sarro_ungueal: 'Sarro Ungueal',
  anfetaminas: 'Anfetaminas',
  organofosforados: 'Compuestos Organofosforados',
  carbamicos: 'Compuestos Carbámicos',
};

export class DocumentBuilderService {

  static async _loadAssets() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const assetsDir = path.join(__dirname, '..', 'assets');

    const loadImage = async (fileName, placeholder) => {
      try {
        const imagePath = path.join(assetsDir, fileName);
        const imageBuffer = await fs.readFile(imagePath);
        return `data:image/png;base64,${imageBuffer.toString('base64')}`;
      } catch (error) {
        if (placeholder) {
          const placeholderPath = path.join(assetsDir, placeholder);
          const placeholderBuffer = await fs.readFile(placeholderPath);
          return `data:image/png;base64,${placeholderBuffer.toString('base64')}`;
        }
        return '';
      }
    };

    const [escudo, sello, firma] = await Promise.all([
      loadImage('escudo.png'),
      loadImage('sello.png', 'escudo.png'),
      loadImage('firma.png', 'escudo.png'),
    ]);

    return { escudo, sello, firma };
  }

  static _processExamResults(muestras) {
    const examenes = {};
    if (!muestras || muestras.length === 0) return [];

    // Inicializar todos los tipos de droga
    for (const key in TIPOS_DROGA_LABELS) {
      examenes[key] = {
        label: TIPOS_DROGA_LABELS[key],
        positivos: [],
      };
    }

    // Recorrer las muestras para encontrar positivos
    muestras.forEach((muestra, index) => {
      for (const key in muestra.resultados) {
        // Ignorar claves que no son drogas (ej. dosaje_etilico) o no están en el mapa
        if (!examenes[key]) continue;

        if (muestra.resultados[key] === 'POSITIVO') {
          examenes[key].positivos.push(`M${index + 1}`);
        }
      }
    });

    // Formatear el resultado final
    return Object.values(examenes).map(examen => {
      let resultado;
      if (examen.positivos.length > 0) {
        resultado = `POSITIVO en (${examen.positivos.join(', ')})`;
      } else {
        resultado = 'NEGATIVO';
      }
      return { label: examen.label, resultado };
    });
  }

  static _generateDynamicConclusion(muestras, examinado) {
    if (!muestras || muestras.length === 0) return 'No se analizaron muestras.';

    const positivos = {};
    muestras.forEach((muestra, index) => {
      Object.entries(muestra.resultados).forEach(([drogaKey, resultado]) => {
        if (resultado === 'POSITIVO') {
          if (!positivos[drogaKey]) {
            positivos[drogaKey] = [];
          }
          positivos[drogaKey].push(`M${index + 1}`);
        }
      });
    });

    const drogasPositivas = Object.keys(positivos);

    if (drogasPositivas.length === 0) {
      return `La(s) muestra(s) analizada(s) de la persona: "${examinado}", dieron resultado NEGATIVO para las drogas investigadas.`;
    }

    const conclusionText = drogasPositivas.map(drogaKey => {
      const drogaLabel = TIPOS_DROGA_LABELS[drogaKey] || drogaKey;
      const muestrasAfectadas = positivos[drogaKey].join(', ');
      return `${drogaLabel.toUpperCase()} en (${muestrasAfectadas})`;
    }).join(', ');

    return `La(s) muestra(s) analizada(s) de la persona: "${examinado}", dieron resultado POSITIVO para ${conclusionText}.`;
  }

  static async generateConsolidatedReportHtml(data) {
    const coverTemplatePath = this._getTemplatePath('lab/dictamen_consolidado_cover');
    const coverTemplateContent = await fs.readFile(coverTemplatePath, 'utf-8');
    const coverTemplate = handlebars.compile(coverTemplateContent);
    const coverHtml = coverTemplate(data);

    const anexoTemplatePath = this._getTemplatePath('lab/anexo_informe_pericial');
    const anexoTemplateContent = await fs.readFile(anexoTemplatePath, 'utf-8');
    const anexoTemplate = handlebars.compile(anexoTemplateContent);

    let anexosHtml = '';
    if (data.anexos) {
      for (const anexo of data.anexos) {
        anexosHtml += `<div class="page-break"></div>`;
        anexosHtml += anexoTemplate(anexo);
      }
    }

    return coverHtml + anexosHtml;
  }

  static async build(templateName, id_oficio, extraData = {}) {
    let browser = null;
    try {
      const [oficioResult, assets] = await Promise.all([
        Oficio.findDetalleById(id_oficio),
        this._loadAssets()
      ]);

      if (!oficioResult.success) throw new Error('Oficio no encontrado.');

      const peritoData = { ...oficioResult.data, ...extraData.perito };
      const muestras = extraData.muestrasAnalizadas || [];

      const examenesProcesados = this._processExamResults(muestras);
      const conclusionDinamica = this._generateDynamicConclusion(muestras, oficioResult.data.examinado_incriminado);

      const data = {
        ...extraData, // Spread extraData to be available at root (for dictamen_consolidado)
        oficio: {
          ...oficioResult.data,
          objeto_pericia: extraData.metadata?.objeto_pericia || 'No especificado.',
          metodo_utilizado: extraData.metadata?.metodo_utilizado || 'No especificado.',
          muestras_registradas: muestras.map((m, index) => ({ ...m, index: index + 1 })),
          examenes_procesados: examenesProcesados,
          conclusion_dinamica: conclusionDinamica,
          muestras_agotadas: extraData.muestrasAgotadas,
          anio_actual: new Date().getFullYear(),
        },
        perito: peritoData,
        imagenes: assets,
      };

      let html;
      if (templateName === 'lab/dictamen_consolidado') {
        html = await this.generateConsolidatedReportHtml(data);
      } else {
        const templatePath = this._getTemplatePath(templateName);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const template = handlebars.compile(templateContent);
        html = template(data);
      }
      
      const membretePath = this._getTemplatePath('partials/membrete');
      const membreteContent = await fs.readFile(membretePath, 'utf-8');
      handlebars.registerPartial('partials/membrete', membreteContent);
      
      const anexoPath = this._getTemplatePath('lab/anexo_informe_pericial');
      const anexoContent = await fs.readFile(anexoPath, 'utf-8');
      handlebars.registerPartial('lab/anexo_informe_pericial', anexoContent);


      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '25mm', bottom: '20mm', left: '25mm' },
      });

      return { pdfBuffer, type: 'pdf' };

    } catch (error) {
      console.error(`[DocBuilder] Error generando el documento con plantilla ${templateName}:`, error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  static _getTemplatePath(templateName) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatesDir = path.join(__dirname, '..', 'templates');

    const resolvedPath = path.join(templatesDir, `${templateName}.hbs`);

    if (!resolvedPath.startsWith(templatesDir)) {
      throw new Error('Intento de acceso a una ruta de plantilla no válida.');
    }

    return resolvedPath;
  }
}
