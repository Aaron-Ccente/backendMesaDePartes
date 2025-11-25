import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { Oficio } from '../models/Oficio.js';
import { fileURLToPath } from 'url';
import db from '../database/db.js';
import { ProcedimientoService } from './ProcedimientoService.js';

// --- Handlebars Helpers ---
handlebars.registerHelper('formatLongDate', (date) => {
  if (!date) return 'No especificada';
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateString = d.toLocaleDateString('es-ES', options);
  return `Huancayo, ${dateString}`;
});

export class DocumentBuilderService {

  static async _loadAssets() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const assetsDir = path.join(__dirname, '..', 'assets');
    const imagePath = path.join(assetsDir, 'escudo.png');
    const imageBuffer = await fs.readFile(imagePath);
    return {
        escudo: `data:image/png;base64,${imageBuffer.toString('base64')}`
    };
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

  static async build(templateName, id_oficio, extraData = {}) {
    let browser = null;
    try {
      // 1. Cargar assets y registrar parciales
      const assets = await this._loadAssets();
      const membretePath = this._getTemplatePath('partials/membrete');
      const membreteContent = await fs.readFile(membretePath, 'utf-8');
      handlebars.registerPartial('partials/membrete', membreteContent);
      
      // 2. Obtener todos los datos crudos necesarios
      const dataConsolidacion = await ProcedimientoService.getDatosConsolidacion(id_oficio);
      const { oficio, resultados_previos, metadata, muestras, recolector_muestra } = dataConsolidacion;

      // 3. Preparar datos del INFORME (lógica de consolidación)
      const examenesConsolidados = {};
      const metodosConsolidados = {};
      const examenMetodoMap = {
        'Sarro Ungueal': { nombre: 'Análisis de Sarro Ungueal', metodo: 'Químico - colorimétrico' },
        'Toxicológico': { nombre: 'Análisis Toxicológico', metodo: 'Cromatografía en capa fina, Inmunoensayo' },
        'Dosaje Etílico': { nombre: 'Análisis de Dosaje Etílico', metodo: 'Espectrofotometría – UV VIS' }
      };

      resultados_previos.forEach(res => {
        const examenInfo = examenMetodoMap[res.tipo_resultado] || { nombre: res.tipo_resultado, metodo: 'No especificado' };
        if (!examenesConsolidados[res.tipo_resultado]) {
          examenesConsolidados[res.tipo_resultado] = { nombre: examenInfo.nombre, resultados: [] };
          metodosConsolidados[res.tipo_resultado] = { examen: res.tipo_resultado, metodo: examenInfo.metodo };
        }
        muestras.forEach((muestra, index) => {
          const idMuestra = muestra.id_muestra;
          const codigoMuestra = `M${index + 1}`;
          if (res.resultados && res.resultados[idMuestra]) {
            for (const analito in res.resultados[idMuestra]) {
              if (analito !== 'descripcion_detallada' && analito !== 'no_aplicable') {
                let resultadoFormateado = res.resultados[idMuestra][analito];
                let analitoFormateado = analito === 'resultado_sarro_ungueal' ? 'Sarro Ungueal' : analito.charAt(0).toUpperCase() + analito.slice(1).replace(/_/g, ' ');
                resultadoFormateado = `: ${resultadoFormateado} en (${codigoMuestra})`;
                if (analito === 'resultado_sarro_ungueal') {
                   resultadoFormateado = `: ${res.resultados[idMuestra][analito]}`;
                }
                examenesConsolidados[res.tipo_resultado].resultados.push({ analito: analitoFormateado, resultado: resultadoFormateado });
              }
            }
          }
        });
      });

      const informeData = {
        objeto_pericia: extraData.informe?.objeto_pericia || metadata.objeto_pericia,
        conclusion_principal: extraData.informe?.conclusion_principal,
        recolector_muestra: extraData.informe?.recolector_muestra || recolector_muestra,
        muestras: muestras.map((m, index) => ({
            codigo: `M${index + 1}`,
            descripcion_completa: `UN (01) ${m.tipo_muestra || 'frasco'} ${m.cantidad ? `conteniendo ${m.cantidad}` : ''} de ${m.descripcion || 'muestra sin descripción'}`
        })),
        examenes: Object.values(examenesConsolidados),
        metodos: Object.values(metodosConsolidados),
      };

      // 4. Unir todos los datos para la plantilla final
      const formatDate = (date) => date ? new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'No especificada';
      const finalOficioData = { ...oficio, ...extraData.informe };
      finalOficioData.fecha_incidente_formateada = formatDate(finalOficioData.fecha_incidente);
      finalOficioData.fecha_toma_muestra_formateada = formatDate(finalOficioData.fecha_toma_muestra);
      finalOficioData.fecha_oficio_formateada = formatDate(finalOficioData.fecha_documento);

      const data = {
        oficio: finalOficioData,
        perito: { ...oficio.perito_asignado, ...extraData.perito },
        imagenes: assets,
        informe: informeData
      };

      // 5. Compilar y renderizar HTML
      const templatePath = this._getTemplatePath(templateName);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      const html = template(data);

      // 6. Generar PDF
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
      if (browser) await browser.close();
    }
  }
}
