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

const TIPOS_DROGA_LABELS = {
  cocaina: 'Alcaloide de cocaína',
  marihuana: 'Cannabinoides (Marihuana)',
  benzodiacepinas: 'Benzodiacepinas',
  fenotiacinas: 'Fenotiacinas',
  barbituricos: 'Barbitúricos',
  sarro_ungueal: 'Sarro Ungueal',
};

export class DocumentBuilderService {

  static async _loadAssets() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const assetsDir = path.join(__dirname, '..', 'assets');
    
    const logoPath = path.join(assetsDir, 'escudo.png');
    const logoBuffer = await fs.readFile(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    
    return { logoBase64 };
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
        oficio: {
          ...oficioResult.data,
          objeto_pericia: extraData.metadata?.objeto_pericia || 'No especificado.',
          metodo_utilizado: extraData.metadata?.metodo_utilizado || 'No especificado.',
          muestras_registradas: muestras.map((m, index) => ({...m, index: index + 1})),
          examenes_procesados: examenesProcesados,
          conclusion_dinamica: conclusionDinamica,
          muestras_agotadas: extraData.muestrasAgotadas,
          anio_actual: new Date().getFullYear(),
        },
        perito: peritoData,
        assets: assets,
      };
      
      const templatePath = this._getTemplatePath(templateName);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      const membretePath = this._getTemplatePath('partials/membrete');
      const membreteContent = await fs.readFile(membretePath, 'utf-8');
      handlebars.registerPartial('partials/membrete', membreteContent);

      const template = handlebars.compile(templateContent);
      const html = template(data);

      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '25mm', bottom: '20mm', left: '25mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="font-size: 8pt; text-align: center; width: 100%; padding: 0 1cm;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
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
