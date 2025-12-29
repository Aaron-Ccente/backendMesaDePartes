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

// helper para formatear hora / fecha corta (ej. "25/11/2025 14:30" o solo "14:30")
handlebars.registerHelper('formatTime', (date) => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    // Formato: dd/mm/yyyy HH:MM (si quieres solo hora cambia las opciones)
    const datePart = d.toLocaleDateString('es-ES');
    const timePart = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  } catch (err) {
    return '-';
  }
});

// opcional: helper corto solo hora si la plantilla lo usa
handlebars.registerHelper('formatHour', (date) => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return '-';
  }
});

handlebars.registerHelper('inc', function(value, options) {
    return parseInt(value) + 1;
});

// Helper para index base custom (ej. empezar en 2)
handlebars.registerHelper('inc', (value, base) => {
  return parseInt(value) + (typeof base === 'number' ? base : 1);
});

export class DocumentBuilderService {

  static async _loadAssets() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const assetsDir = path.join(__dirname, '..', 'assets');

    const loadAndEncode = async (fileName) => {
      try {
        const imagePath = path.join(assetsDir, fileName);
        const imageBuffer = await fs.readFile(imagePath);
        return `data:image/png;base64,${imageBuffer.toString('base64')}`;
      } catch (error) {
        console.warn(`[DocBuilder] Advertencia: No se pudo cargar el asset '${fileName}'. Se usará un placeholder.`);
        return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 transparent pixel
      }
    };

    return {
      escudoUrl: await loadAndEncode('escudo.png'),
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

  static async generarCaratula(id_oficio, id_usuario, extraData = {}) {
    let browser = null;
    const connection = await db.promise().getConnection();
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      // 1. Cargar assets
      const assets = await this._loadAssets();

      // 2. Obtener datos del caso
      const dataConsolidacion = await ProcedimientoService.getDatosConsolidacion(id_oficio);
      const { oficio } = dataConsolidacion;

      // 3. Obtener datos del firmante (Usuario actual)
      const [signerRows] = await connection.query(
        `SELECT 
                u.nombre_completo, 
                u.CIP, 
                g.nombre as grado,
                s.nombre as seccion,
                p.dni
             FROM usuario u
             LEFT JOIN usuario_grado ug ON u.id_usuario = ug.id_usuario
             LEFT JOIN grado g ON ug.id_grado = g.id_grado
             LEFT JOIN usuario_seccion us ON u.id_usuario = us.id_usuario
             LEFT JOIN seccion s ON us.id_seccion = s.id_seccion
             LEFT JOIN perito p ON u.id_usuario = p.id_usuario
             WHERE u.id_usuario = ?`,
        [id_usuario]
      );
      const signer = signerRows[0] || {};

      // 4. Preparar datos para la plantilla
      const formatDate = (date) => {
        if (!date) return 'No especificada';
        const d = new Date(date);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return `Huancayo, ${d.toLocaleDateString('es-ES', options)}`;
      };

      const templateData = {
        ...assets,
        lugarFecha: extraData.lugarFecha || formatDate(new Date()),
        numOficio: extraData.numOficio || oficio.numero_oficio,

        // Membrete
        membreteComando: extraData.membreteComando || 'IV MACRO REGION POLICIAL JUNIN',
        membreteDireccion: extraData.membreteDireccion || 'REGPOL-JUNIN',
        membreteRegion: extraData.membreteRegion || 'DIVINCRI-HYO/OFICRI',

        // Destinatario
        destCargo: extraData.destCargo || `SEÑOR ${oficio.grado_destinatario || 'JEFE'}`,
        destNombre: extraData.destNombre || (oficio.unidad_solicitante || 'UNIDAD SOLICITANTE'),
        destPuesto: extraData.destPuesto || (oficio.region_fiscalia || 'HUANCAYO'),

        // Asunto y Referencia
        asuntoBase: extraData.asuntoBase || 'REMITO DICTAMEN PERICIAL DE ',
        asuntoRemite: extraData.asuntoRemite || (oficio.tipos_de_examen || []).join(' Y '),
        referencia: extraData.referencia || `Oficio N° ${oficio.numero_oficio} - ${oficio.unidad_solicitante}`,

        // Cuerpo
        cuerpoP1_1: extraData.cuerpoP1_1 || 'Tengo el honor de dirigirme a Ud., en atención al documento de la referencia, remitiendo adjunto al presente el ',
        cuerpoP1_2: extraData.cuerpoP1_2 || ('DICTAMEN PERICIAL DE ' + (oficio.tipos_de_examen || []).join(' Y ')),
        cuerpoP1_3: extraData.cuerpoP1_3 || ', practicado en la muestra de ',
        cuerpoP1_4: extraData.cuerpoP1_4 || (oficio.examinado_incriminado || 'PERSONA NO IDENTIFICADA'),
        cuerpoP1_5: extraData.cuerpoP1_5 || '; solicitado por su Despacho, para los fines del caso.',

        // Firmante
        regNum: extraData.regNum || oficio.id_oficio,
        regIniciales: extraData.regIniciales || `${(signer.grado || '').substring(0, 3)} - ${(signer.nombre_completo || '').split(' ').map(n => n[0]).join('')}`.toUpperCase(),
        firmanteQS: extraData.firmanteQS || (signer.grado ? `${signer.grado} PNP` : 'PERITO PNP'),
        firmanteNombre: extraData.firmanteNombre || signer.nombre_completo,
        firmanteCargo: extraData.firmanteCargo || 'PERITO QUIMICO FORENSE',
        firmanteDependencia: extraData.firmanteDependencia || 'OFICRI-PNP-HYO'
      };

      // 5. Compilar y renderizar HTML
      console.log('[DocBuilder] Compilando template Caratula...');
      const templatePath = this._getTemplatePath('caratula');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      const html = template(templateData);

      // 6. Generar PDF (Usando setContent como en el método build)
      console.log('[DocBuilder] Iniciando Puppeteer para Caratula...');
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();

      console.log('[DocBuilder] Seteando contenido HTML...');
      await page.setContent(html, { waitUntil: 'networkidle0' });

      console.log('[DocBuilder] Generando buffer PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, // Márgenes controlados por CSS
      });
      console.log(`[DocBuilder] PDF Caratula generado. Tamaño: ${pdfBuffer.length} bytes`);

      return { pdfBuffer, type: 'pdf' };

    } catch (error) {
      console.error(`[DocBuilder] Error generando la carátula:`, error);
      throw error;
    } finally {
      if (connection) connection.release();
      if (browser) await browser.close();
    }
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
      const metodosConsolidados = []; // Ahora será un array directo

      // Mapeo default por si no viene del frontend
      const examenMetodoMapDefault = {
        'Sarro Ungueal': { nombre: 'Análisis de Sarro Ungueal', metodo: 'Químico - colorimétrico' },
        'Toxicológico': { nombre: 'Análisis Toxicológico', metodo: 'Cromatografía en capa fina, Inmunoensayo' },
        'Dosaje Etílico': { nombre: 'Análisis de Dosaje Etílico', metodo: 'Espectrofotometría – UV VIS' }
      };

      // Si vienen métodos personalizados del frontend, usarlos. Si no, generarlos.
      if (extraData.informe?.metodos && Array.isArray(extraData.informe.metodos)) {
          // Asumimos que el frontend envía [{examen: 'Nombre', metodo: 'Descripcion'}, ...]
          extraData.informe.metodos.forEach(m => metodosConsolidados.push(m));
      } else {
          // Lógica fallback antigua
          resultados_previos.forEach(res => {
            const info = examenMetodoMapDefault[res.tipo_resultado] || { nombre: res.tipo_resultado, metodo: 'No especificado' };
            // Evitar duplicados si hay múltiples resultados del mismo tipo
            if (!metodosConsolidados.find(m => m.examen === res.tipo_resultado)) {
                metodosConsolidados.push({ examen: res.tipo_resultado, metodo: info.metodo });
            }
          });
      }

      resultados_previos.forEach(res => {
        const examenInfo = examenMetodoMapDefault[res.tipo_resultado] || { nombre: res.tipo_resultado, metodo: 'No especificado' };
        if (!examenesConsolidados[res.tipo_resultado]) {
          examenesConsolidados[res.tipo_resultado] = { nombre: examenInfo.nombre, resultados: [] };
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
      
      // Preparar descripciones de muestras (priorizar editadas)
      const muestrasFinales = muestras.map((m, index) => {
          const editedMuestra = extraData.informe?.muestras?.find(em => em.id_muestra === m.id_muestra) || {};
          return {
              codigo: `M${index + 1}`,
              descripcion_completa: `UN (01) ${m.tipo_muestra || 'frasco'} ${m.cantidad ? `conteniendo ${m.cantidad}` : ''} de ${editedMuestra.descripcion || m.descripcion || 'muestra sin descripción'}`
          };
      });

      const informeData = {
        objeto_pericia: extraData.informe?.objeto_pericia || metadata.objeto_pericia,
        conclusion_principal: extraData.informe?.conclusion_principal,
        conclusiones_secundarias: extraData.informe?.conclusiones_secundarias || ['Muestras agotadas en los análisis.'],
        recolector_muestra: extraData.informe?.recolector_muestra || recolector_muestra,
        muestras: muestrasFinales,
        examenes: Object.values(examenesConsolidados),
        metodos: metodosConsolidados,
      };

      // 4. Unir todos los datos para la plantilla final
      const formatDate = (date) => date ? new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'No especificada';
      const finalOficioData = { ...oficio, ...extraData.informe };
      finalOficioData.fecha_incidente_formateada = formatDate(finalOficioData.fecha_incidente);
      finalOficioData.fecha_toma_muestra_formateada = formatDate(finalOficioData.fecha_toma_muestra);
      finalOficioData.fecha_oficio_formateada = formatDate(finalOficioData.fecha_documento);
      
      // Sufijo del número de oficio (Editable)
      finalOficioData.sufijo_numero_oficio = extraData.informe?.sufijo_numero_oficio || 'IV-MACREPOL-JUN-DIVINCRI/OFICRI.';

      const data = {
        oficio: finalOficioData,
        perito: { 
          grado: oficio.grado_perito,
          nombre_completo: oficio.nombre_perito_actual || oficio.perito_asignado,
          dni_perito: oficio.dni_perito,
          cip: oficio.cip_perito,
          cqfp: oficio.cqfp,
          titulo_profesional: extraData.perito?.titulo_profesional || 'Perito Químico Farmacéutico',
          ...extraData.perito 
        },
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

  static async generarInformeNoExtraccion(id_oficio, id_usuario) {
    let browser = null;
    const connection = await db.promise().getConnection();
    try {
      // 1. Cargar assets y registrar parciales
      const assets = await this._loadAssets();
      const membretePath = this._getTemplatePath('partials/membrete');
      const membreteContent = await fs.readFile(membretePath, 'utf-8');
      handlebars.registerPartial('partials/membrete', membreteContent);

      // 2. Obtener datos del caso y del perito
      const [oficioRows] = await connection.query(
        `SELECT o.*,
                GROUP_CONCAT(te.nombre SEPARATOR ', ') AS tipos_de_examen,
                MAX(s.observaciones) as motivo_no_extraccion
         FROM oficio o
         LEFT JOIN oficio_examen oe ON o.id_oficio = oe.id_oficio
         LEFT JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen
         LEFT JOIN (
            SELECT id_oficio, observaciones
            FROM seguimiento_oficio
            WHERE id_oficio = ? AND estado_nuevo = 'EXTRACCION_FALLIDA'
            ORDER BY fecha_seguimiento DESC LIMIT 1
         ) s ON o.id_oficio = s.id_oficio
         WHERE o.id_oficio = ?
         GROUP BY o.id_oficio`,
        [id_oficio, id_oficio]
      );

      if (oficioRows.length === 0) {
        throw new Error('Oficio no encontrado.');
      }
      const oficio = oficioRows[0];

      const [peritoRows] = await connection.query(
        `SELECT u.nombre_completo, g.nombre as grado_perito
         FROM usuario u
         LEFT JOIN usuario_grado ug ON u.id_usuario = ug.id_usuario
         LEFT JOIN grado g ON ug.id_grado = g.id_grado
         WHERE u.id_usuario = ?`,
        [id_usuario]
      );
      const perito = peritoRows[0] || { nombre_completo: 'Desconocido', grado_perito: 'Perito' };

      // 3. Preparar datos para la plantilla
      const data = {
        oficio: {
            ...oficio,
            numero_informe_pericial: oficio.numero_oficio,
            anio_actual: new Date().getFullYear(),
        },
        perito,
        observaciones: oficio.motivo_no_extraccion || 'No se especificaron motivos.',
        ...assets
      };

      // 4. Compilar y renderizar HTML
      const templatePath = this._getTemplatePath('tm/informe_no_extraccion');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      const html = template(data);

      // 5. Generar PDF
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '25mm', right: '25mm', bottom: '25mm', left: '25mm' },
      });

      return { pdfBuffer, type: 'pdf' };

    } catch (error) {
      console.error('[DocBuilder] Error generando informe de no extracción:', error);
      throw error;
    } finally {
      if (connection) connection.release();
      if (browser) await browser.close();
    }
  }
}
