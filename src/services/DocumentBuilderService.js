import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { Oficio } from '../models/Oficio.js';
import { fileURLToPath } from 'url';
import db from '../database/db.js';
import { ProcedimientoService } from './ProcedimientoService.js';
import { ConfiguracionService } from './ConfiguracionService.js';

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
    try {
      // Pasamos el id_usuario en extraData para que buildHTML sepa quién firma
      const mergedExtraData = { ...extraData, id_usuario };
      
      const html = await this.buildHTML('caratula', id_oficio, mergedExtraData);

      // 6. Generar PDF
      console.log('[DocBuilder] Iniciando Puppeteer para Caratula...');
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();

      console.log('[DocBuilder] Seteando contenido HTML...');
      await page.setContent(html, { waitUntil: 'networkidle0' });

      console.log('[DocBuilder] Generando buffer PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, 
      });
      console.log(`[DocBuilder] PDF Caratula generado. Tamaño: ${pdfBuffer.length} bytes`);

      return { pdfBuffer, type: 'pdf' };

    } catch (error) {
      console.error(`[DocBuilder] Error generando la carátula:`, error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  static async buildHTML(templateName, id_oficio, extraData = {}) {
    const connection = await db.promise().getConnection();
    try {
      // 1. Cargar assets, configuración y registrar parciales
      const [assets, config] = await Promise.all([
        this._loadAssets(),
        ConfiguracionService.getPublicConfig()
      ]);

      const membretePath = this._getTemplatePath('partials/membrete');
      const membreteContent = await fs.readFile(membretePath, 'utf-8');
      handlebars.registerPartial('partials/membrete', membreteContent);

      // 2. Obtener datos base
      const dataConsolidacion = await ProcedimientoService.getDatosConsolidacion(id_oficio);
      const { oficio, resultados_previos, metadata, muestras, recolector_muestra } = dataConsolidacion;
      
      let templateData = {};

      // --- LOGICA ESPECIFICA POR PLANTILLA ---
      if (templateName === 'caratula') {
          // Obtener datos del firmante (quien solicita la carátula o el asignado)
          const idUsuarioFirmante = extraData.id_usuario || oficio.id_usuario_perito_asignado;
          
          const [signerRows] = await connection.query(
            `SELECT u.nombre_completo, u.CIP, g.nombre as grado
             FROM usuario u
             LEFT JOIN usuario_grado ug ON u.id_usuario = ug.id_usuario
             LEFT JOIN grado g ON ug.id_grado = g.id_grado
             WHERE u.id_usuario = ?`,
            [idUsuarioFirmante]
          );
          const signer = signerRows[0] || {};

          const formatDate = (date) => {
            if (!date) return 'No especificada';
            try {
                const d = new Date(date);
                // Formato: 10 DIC 2025
                return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
            } catch (e) {
                return date;
            }
          };
          
          // Mapeo de datos para Carátula (Config Global < DB Oficio < ExtraData Flat < ExtraData Nested)
          // Se prioriza extraData.caratula.prop (si existe) -> extraData.prop (flat) -> DB/Config
          const getVal = (key, fallback) => {
              return extraData.caratula?.[key] || extraData[key] || fallback;
          };

          templateData = {
            ...assets,
            config,
            lugarFecha: getVal('lugarFecha', formatDate(new Date())),
            numOficio: getVal('numOficio', oficio.numero_oficio),
            
            membreteComando: getVal('membreteComando', config.MEMBRETE_COMANDO),
            membreteDireccion: getVal('membreteDireccion', config.MEMBRETE_DIRECCION),
            membreteRegion: getVal('membreteRegion', config.MEMBRETE_REGION),
            anioLema: config.ANIO_LEMA, 
            
            destCargo: getVal('destCargo', `SEÑOR ${oficio.grado_destinatario || 'JEFE'}`),
            destNombre: getVal('destNombre', (oficio.unidad_solicitante || 'UNIDAD SOLICITANTE')),
            destPuesto: getVal('destPuesto', (oficio.region_fiscalia || 'HUANCAYO')),
            
            asuntoBase: getVal('asuntoBase', 'REMITO DICTAMEN PERICIAL DE '),
            asuntoRemite: getVal('asuntoRemite', (oficio.tipos_de_examen || []).join(' Y ')),
            referencia: getVal('referencia', `Oficio N° ${oficio.numero_oficio} - ${oficio.unidad_solicitante}`),
            
            cuerpoP1_1: getVal('cuerpoP1_1', 'Tengo el honor de dirigirme a Ud., en atención al documento de la referencia, remitiendo adjunto al presente el '),
            cuerpoP1_2: getVal('cuerpoP1_2', ('DICTAMEN PERICIAL DE ' + (oficio.tipos_de_examen || []).join(' Y '))),
            cuerpoP1_3: getVal('cuerpoP1_3', ', practicado en la muestra de '),
            cuerpoP1_4: getVal('cuerpoP1_4', (oficio.examinado_incriminado || 'PERSONA NO IDENTIFICADA')),
            cuerpoP1_5: getVal('cuerpoP1_5', '; solicitado por su Despacho, para los fines del caso.'),
            
            regNum: getVal('regNum', oficio.id_oficio),
            regIniciales: getVal('regIniciales', `${(signer.grado || '').substring(0, 3)} - ${(signer.nombre_completo || '').split(' ').map(n => n[0]).join('')}`.toUpperCase()),
            
            firmanteQS: getVal('firmanteQS', (signer.grado ? `${signer.grado} PNP` : 'PERITO PNP')),
            firmanteNombre: getVal('firmanteNombre', signer.nombre_completo),
            firmanteCargo: getVal('firmanteCargo', config.FIRMANTE_CARGO_DEF || 'PERITO QUIMICO FORENSE'),
            firmanteDependencia: getVal('firmanteDependencia', config.FIRMANTE_DEP_DEF || 'OFICRI-PNP-HYO')
          };

      } else { 
          // --- LOGICA POR DEFECTO (REPORTE / INFORME) ---
          
          // Preparar datos del INFORME
          const examenesConsolidados = {};
          const metodosConsolidados = []; 

          const examenMetodoMapDefault = {
            'Sarro Ungueal': { nombre: 'Análisis de Sarro Ungueal', metodo: 'Químico - colorimétrico' },
            'Toxicológico': { nombre: 'Análisis Toxicológico', metodo: 'Cromatografía en capa fina, Inmunoensayo' },
            'Dosaje Etílico': { nombre: 'Análisis de Dosaje Etílico', metodo: 'Espectrofotometría – UV VIS' }
          };

          if (extraData.informe?.metodos && Array.isArray(extraData.informe.metodos)) {
              extraData.informe.metodos.forEach(m => metodosConsolidados.push(m));
          } else {
              resultados_previos.forEach(res => {
                const info = examenMetodoMapDefault[res.tipo_resultado] || { nombre: res.tipo_resultado, metodo: 'No especificado' };
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

          const formatDate = (date) => {
            if (!date) return 'No especificada';
            try {
                const d = new Date(date);
                // Formato: 10 DIC 2025
                return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
            } catch (e) {
                return date;
            }
          };
          const finalOficioData = { ...oficio, ...extraData.informe };
          finalOficioData.fecha_incidente_formateada = formatDate(finalOficioData.fecha_incidente);
          finalOficioData.fecha_toma_muestra_formateada = formatDate(finalOficioData.fecha_toma_muestra);
          finalOficioData.fecha_oficio_formateada = formatDate(finalOficioData.fecha_documento);
          
          finalOficioData.sufijo_numero_oficio = extraData.informe?.sufijo_numero_oficio || config.SUFIJO_OFICIO || 'IV-MACREPOL-JUN-DIVINCRI/OFICRI.';

          templateData = {
            config, 
            oficio: finalOficioData,
            perito: { 
              grado: oficio.grado_perito,
              nombre_completo: oficio.nombre_perito_actual || oficio.perito_asignado,
              dni_perito: oficio.dni_perito,
              cip: oficio.cip_perito,
              cqfp: oficio.cqfp,
              titulo_profesional: extraData.perito?.titulo_profesional || config.FIRMANTE_CARGO_DEF || 'Perito Químico Farmacéutico',
              ...extraData.perito 
            },
            imagenes: assets,
            informe: informeData
          };
      }

      // 5. Compilar y renderizar HTML
      const templatePath = this._getTemplatePath(templateName);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      return template(templateData);

    } catch (error) {
      console.error(`[DocBuilder] Error generando HTML con plantilla ${templateName}:`, error);
      throw error;
    } finally {
        if(connection) connection.release();
    }
  }

  static async build(templateName, id_oficio, extraData = {}) {
    let browser = null;
    try {
      const html = await this.buildHTML(templateName, id_oficio, extraData);

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
      // 1. Cargar assets y configuración
      const [assets, config] = await Promise.all([
        this._loadAssets(),
        ConfiguracionService.getPublicConfig()
      ]);

      const membretePath = this._getTemplatePath('partials/membrete');
      const membreteContent = await fs.readFile(membretePath, 'utf-8');
      handlebars.registerPartial('partials/membrete', membreteContent);

      // 2. Obtener datos
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

      // 3. Preparar datos
      const data = {
        config,
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