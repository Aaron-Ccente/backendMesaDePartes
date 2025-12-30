import { Oficio } from '../models/Oficio.js';
import { Muestra } from '../models/Muestra.js';
import { MuestraService } from '../services/MuestraService.js';
import db from '../database/db.js';
import { WorkflowService } from '../services/workflowService.js';
import { ProcedimientoService } from '../services/ProcedimientoService.js';
import { DocumentBuilderService } from '../services/DocumentBuilderService.js';
import path from 'path';

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

export class ProcedimientoController {

  static async generarCaratula(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    try {
      const { pdfBuffer } = await DocumentBuilderService.generarCaratula(id_oficio, id_usuario, req.body);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=caratula.pdf');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error al generar la carátula:', error);
      res.status(500).json({ success: false, message: 'Error interno al generar la carátula.' });
    }
  }

  static async generarInformeNoExtraccion(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    try {
      const { pdfBuffer } = await DocumentBuilderService.generarInformeNoExtraccion(id_oficio, id_usuario);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=informe_no_extraccion.pdf');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error al generar informe de no extracción:', error);
      res.status(500).json({ success: false, message: 'Error interno al generar el informe.' });
    }
  }

  static async uploadInformeFirmado(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo.' });
    }

    // Construir una ruta relativa para almacenar en la BD
    const relativePath = path.join('uploads', 'informes_firmados', req.file.filename).replace(/\\/g, '/');

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Guardar la ruta en la metadata
      await connection.query(
        `INSERT INTO oficio_resultados_metadata (id_oficio, informe_pericial_firmado_path)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE informe_pericial_firmado_path = VALUES(informe_pericial_firmado_path)`,
        [id_oficio, relativePath]
      );

      // Cambiar estado del caso
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: 'LISTO_PARA_RECOJO',
        observaciones: 'El perito ha subido el informe firmado digitalmente.'
      }, connection);

      await connection.commit();
      res.status(200).json({ success: true, message: 'Informe firmado subido y caso actualizado.', filePath: relativePath });
    } catch (error) {
      await connection.rollback();
      console.error('Error en uploadInformeFirmado:', error);
      res.status(500).json({ success: false, message: 'Error interno al procesar el archivo.' });
    } finally {
      connection.release();
    }
  }

  static async uploadDocumentosFinales(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No se han subido archivos.' });
    }

    const relativePaths = req.files.map(file =>
      path.join('uploads', 'documentos_finales', file.filename).replace(/\\/g, '/')
    );
    const pathsJson = JSON.stringify(relativePaths);

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO oficio_resultados_metadata (id_oficio, documentos_finales_escaneados_path)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE documentos_finales_escaneados_path = VALUES(documentos_finales_escaneados_path)`,
        [id_oficio, pathsJson]
      );

      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: 'ENTREGADO_Y_ARCHIVADO',
        observaciones: 'Mesa de Partes ha subido los documentos escaneados post-entrega.'
      }, connection);

      await connection.commit();
      res.status(200).json({ success: true, message: 'Documentos finales archivados exitosamente.', files: relativePaths });
    } catch (error) {
      await connection.rollback();
      console.error('Error en uploadDocumentosFinales:', error);
      res.status(500).json({ success: false, message: 'Error interno al archivar los documentos.' });
    } finally {
      connection.release();
    }
  }

  static async getDatosExtraccion(req, res) {
    const { id: id_oficio } = req.params;
    try {
      const muestras = await Muestra.findByOficioId(id_oficio);
      const seguimiento = await Oficio.getSeguimientoDeProcedimiento(id_oficio, [
        'EXTRACCION_FINALIZADA',
        'PENDIENTE_ANALISIS_TM',
        'EXTRACCION_FALLIDA'
      ]);

      // Si no hay datos, es un procedimiento nuevo. Devolver éxito con data nula.
      if (muestras.length === 0 && !seguimiento) {
        return res.status(200).json({ success: true, data: null });
      }

      const fueExitosa = seguimiento ? seguimiento.estado_nuevo !== 'EXTRACCION_FALLIDA' : true;

      res.status(200).json({
        success: true,
        data: {
          muestras,
          observaciones: seguimiento ? seguimiento.observaciones : '',
          fue_exitosa: fueExitosa
        }
      });
    } catch (error) {
      console.error('Error en getDatosExtraccion:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  }

  /**
   * Registra el resultado de una extracción de muestra, generando códigos únicos
   * y el evento inicial de la cadena de custodia.
   */
  static async registrarExtraccion(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const { fue_exitosa, observaciones, muestras } = req.body;

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validar que el oficio pertenece al perito
      const oficio = await Oficio.findById(id_oficio);
      if (!oficio.success || oficio.data.id_usuario_perito_asignado !== id_usuario) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      // 2. Sincronizar Muestras (Borrar y Re-insertar)
      await Muestra.deleteByOficioId(id_oficio, connection);

      const examenesRequeridos = await Oficio.getExamenesRequeridos(id_oficio);
      const requiereAnalisisTM = examenesRequeridos.some(ex => ex.toUpperCase().includes('SARRO UNGUEAL'));
      let estadoNuevo = '';
      let finalObservaciones = observaciones || null;

      if (fue_exitosa) {
        if (!Array.isArray(muestras) || muestras.length === 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Se requiere al menos una muestra para una extracción exitosa.' });
        }

        const codigosGenerados = [];
        // 3. Insertar las nuevas muestras.
        for (const muestra of muestras) {
          const codigoMuestra = await MuestraService.generarCodigoMuestra(id_oficio, connection);
          const nuevaMuestra = {
            id_oficio,
            tipo_muestra: muestra.tipo_muestra,
            descripcion: muestra.descripcion,
            cantidad: muestra.cantidad,
            codigo_muestra: codigoMuestra,
            esta_lacrado: true,
          };
          await Muestra.create(nuevaMuestra, connection);
          codigosGenerados.push(codigoMuestra);
        }

        estadoNuevo = requiereAnalisisTM ? 'PENDIENTE_ANALISIS_TM' : 'EXTRACCION_FINALIZADA';
        finalObservaciones = observaciones || null;

      } else {
        estadoNuevo = 'EXTRACCION_FALLIDA';
        finalObservaciones = observaciones || 'No se especificaron observaciones.';
      }

      // 4. Añadir el registro de seguimiento
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: estadoNuevo,
        observaciones: finalObservaciones
      }, connection);

      await connection.commit();
      res.status(201).json({
        success: true,
        message: 'Procedimiento de extracción guardado exitosamente.',
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error al registrar extracción:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor al registrar la extracción.' });
    } finally {
      connection.release();
    }
  }

  static async finalizarExtraccionInterna(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const { fue_exitosa, observaciones, muestras } = req.body;

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validar que el oficio pertenece al perito
      const oficio = await Oficio.findById(id_oficio);
      if (!oficio.success || oficio.data.id_usuario_perito_asignado !== id_usuario) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Acceso denegado. El oficio no le pertenece.' });
      }

      // 2. Limpiar muestras anteriores para evitar duplicados en caso de re-envío
      await Muestra.deleteByOficioId(id_oficio, connection);

      let estadoNuevo = '';
      let finalObservaciones = observaciones || null;

      if (fue_exitosa) {
        if (!Array.isArray(muestras) || muestras.length === 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Para una extracción exitosa se requiere al menos una muestra.' });
        }

        // 3. Estado específico para este flujo
        estadoNuevo = 'PENDIENTE_ANALISIS_TM';

        // 4. Insertar las nuevas muestras
        for (const muestra of muestras) {
          const codigoMuestra = await MuestraService.generarCodigoMuestra(id_oficio, connection);
          await Muestra.create({
            id_oficio,
            tipo_muestra: muestra.tipo_muestra,
            descripcion: muestra.descripcion,
            cantidad: muestra.cantidad,
            codigo_muestra: codigoMuestra,
            esta_lacrado: true,
          }, connection);
        }

        finalObservaciones = observaciones || null;

      } else {
        // Si la extracción no fue exitosa en este flujo, se marca como fallida
        estadoNuevo = 'EXTRACCION_FALLIDA';
        finalObservaciones = observaciones || 'No se especificaron observaciones para la extracción fallida.';
      }

      // 6. Añadir el registro de seguimiento con el estado correspondiente
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: estadoNuevo,
        observaciones: finalObservaciones
      }, connection);

      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Fase de extracción finalizada. El caso ha sido actualizado para análisis.',
        next_status: estadoNuevo
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error en finalizarExtraccionInterna:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
      connection.release();
    }
  }

  static async getDatosAnalisis(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario, seccion_nombre: seccion_usuario } = req.user;

    const connection = await db.promise().getConnection();
    try {
      let tipoResultadoActual;
      const seccion_normalizada = normalizeString(seccion_usuario);

      if (seccion_normalizada === 'TOMA DE MUESTRA') tipoResultadoActual = 'Sarro Ungueal';
      else if (seccion_normalizada === 'LABORATORIO') tipoResultadoActual = 'Toxicológico';
      else if (seccion_normalizada === 'INSTRUMENTALIZACION') tipoResultadoActual = 'Dosaje Etílico';
      else return res.status(400).json({ success: false, message: 'Sección de usuario no reconocida.' });

      // Usar el nuevo servicio para determinar el contexto
      const { esPrimerPeritoDelFlujo, permiteEditarMuestras } = await WorkflowService.determinarContextoAnalisis(id_oficio, id_usuario);

      const [actas] = await connection.query('SELECT * FROM actas_apertura WHERE id_oficio = ?', [id_oficio]);
      const [metadata] = await connection.query('SELECT * FROM oficio_resultados_metadata WHERE id_oficio = ?', [id_oficio]);
      const [muestras] = await connection.query('SELECT * FROM muestras WHERE id_oficio = ?', [id_oficio]);
      const [todosLosResultados] = await connection.query('SELECT * FROM oficio_resultados_perito WHERE id_oficio = ?', [id_oficio]);

      const tieneResultadosGuardados = todosLosResultados.length > 0;

      const resultadosAnteriores = [];
      let resultadosParaEditar = {};

      todosLosResultados.forEach(res_perito => {
        const resultadosParseados = typeof res_perito.resultados === 'string'
          ? JSON.parse(res_perito.resultados)
          : res_perito.resultados;

        if (res_perito.tipo_resultado === tipoResultadoActual) {
          resultadosParaEditar = resultadosParseados;
        } else {
          resultadosAnteriores.push({
            tipo_resultado: res_perito.tipo_resultado,
            resultados: resultadosParseados,
          });
        }
      });

      const aperturaData = actas.length > 0 ? { descripcion_paquete: actas[0].descripcion_paquete, observaciones: actas[0].observaciones } : null;
      const metadataData = metadata.length > 0 ? { objeto_pericia: metadata[0].objeto_pericia, metodo_utilizado: metadata[0].metodo_utilizado, observaciones_finales: metadata[0].observaciones_finales } : null;

      const muestrasAnalizadas = muestras.map(m => ({
        id: m.id_muestra,
        codigo_muestra: m.codigo_muestra,
        tipo_muestra: m.tipo_muestra,
        descripcion: m.descripcion,
        resultados: resultadosParaEditar[m.id_muestra] || {},
        descripcion_detallada: resultadosParaEditar[m.id_muestra]?.descripcion_detallada || m.descripcion_detallada || '',
      }));

      const muestrasAgotadas = metadata.length > 0 ? !!metadata[0].muestras_agotadas : false;

      res.status(200).json({
        success: true,
        data: {
          aperturaData,
          metadata: metadataData,
          muestrasAnalizadas,
          resultadosAnteriores,
          muestrasAgotadas,
          tieneResultadosGuardados,
          esPrimerPeritoDelFlujo, // Enviar el flag claro al frontend
          permiteEditarMuestras,
        }
      });

    } catch (error) {
      console.error('Error en getDatosAnalisis:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
      connection.release();
    }
  }

  static async registrarAnalisis(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const { isCreationMode, apertura_data, muestras, metadata, muestras_agotadas } = req.body;

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      const oficio = await Oficio.findById(id_oficio, connection);
      if (!oficio.success || oficio.data.id_usuario_perito_asignado !== id_usuario) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const { esPrimerPeritoDelFlujo } = await WorkflowService.determinarContextoAnalisis(id_oficio, id_usuario);

      if (esPrimerPeritoDelFlujo) {
        if (!apertura_data || !apertura_data.descripcion_paquete) {
          throw new Error('Debe describir el estado del paquete recibido, ya que es el primer perito en analizar una muestra remitida.');
        }
        await connection.query(
          `INSERT INTO actas_apertura (id_oficio, id_perito, descripcion_paquete, observaciones) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE id_perito = VALUES(id_perito), descripcion_paquete = VALUES(descripcion_paquete), observaciones = VALUES(observaciones)`,
          [id_oficio, id_usuario, apertura_data.descripcion_paquete, apertura_data.observaciones]
        );
      }

      let tipoResultado, estadoNuevo;
      const seccion_normalizada = normalizeString(req.user.seccion_nombre);
      switch (seccion_normalizada) {
        case 'TOMA DE MUESTRA':
          tipoResultado = 'Sarro Ungueal';
          estadoNuevo = 'ANALISIS_TM_FINALIZADO';
          break;
        case 'LABORATORIO':
          tipoResultado = 'Toxicológico';
          estadoNuevo = 'ANALISIS_LAB_FINALIZADO';
          break;
        case 'INSTRUMENTALIZACION':
          tipoResultado = 'Dosaje Etílico';
          estadoNuevo = 'ANALISIS_INST_FINALIZADO';
          break;
        default:
          throw new Error('Sección de usuario no reconocida.');
      }

      if (metadata) {
        await connection.query(
          `INSERT INTO oficio_resultados_metadata (id_oficio, objeto_pericia, metodo_utilizado, muestras_agotadas, observaciones_finales) VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE objeto_pericia = VALUES(objeto_pericia), metodo_utilizado = VALUES(metodo_utilizado), muestras_agotadas = VALUES(muestras_agotadas), observaciones_finales = VALUES(observaciones_finales)`,
          [id_oficio, metadata.objeto_pericia, metadata.metodo_utilizado, !!muestras_agotadas, metadata.observaciones_finales]
        );
      }

      const resultadosParaGuardar = {};
      const idMap = new Map(); // Mapea IDs temporales del frontend a IDs reales de la DB

      for (const muestra of muestras) {
        let muestraId;
        if (muestra.isNew) {
          // Es una muestra nueva, hay que crearla
          if (!muestra.tipo_muestra || !muestra.descripcion) {
            throw new Error('Las muestras nuevas deben tener tipo y descripción.');
          }
          const codigoMuestra = await MuestraService.generarCodigoMuestra(id_oficio, connection);
          const nuevoIdMuestra = await Muestra.create({
            id_oficio,
            tipo_muestra: muestra.tipo_muestra,
            descripcion: muestra.descripcion,
            codigo_muestra: codigoMuestra,
            esta_lacrado: false,
          }, connection);

          idMap.set(muestra.id, nuevoIdMuestra);
          muestraId = nuevoIdMuestra;
        } else {
          // Es una muestra existente
          muestraId = muestra.id;
        }

        // Siempre actualizar descripción detallada si se proporciona
        if (muestra.descripcion_detallada) {
          await Muestra.updateDetalle(muestraId, muestra.descripcion_detallada, connection);
        }

        // Solo procesar resultados si la muestra no está marcada como "no aplicable"
        if (!muestra.resultados?.no_aplicable) {
          resultadosParaGuardar[muestraId] = {
            descripcion_detallada: muestra.descripcion_detallada || '',
            ...muestra.resultados,
          };
        }
      }

      if (Object.keys(resultadosParaGuardar).length > 0) {
        await connection.query(
          `INSERT INTO oficio_resultados_perito (id_oficio, id_perito_responsable, tipo_resultado, resultados) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE resultados = VALUES(resultados)`,
          [id_oficio, id_usuario, tipoResultado, JSON.stringify(resultadosParaGuardar)]
        );
      }

      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: estadoNuevo,
        observaciones: `Análisis de ${tipoResultado} finalizado.`
      }, connection);

      await connection.commit();
      res.status(201).json({ success: true, message: 'Análisis registrado exitosamente.' });

    } catch (error) {
      await connection.rollback();
      console.error('Error al registrar el análisis:', error);
      res.status(500).json({ success: false, message: error.message || 'Error interno del servidor al registrar el análisis.' });
    } finally {
      connection.release();
    }
  }

  static async obtenerSiguientePaso(req, res) {
    const { id: id_oficio } = req.params;

    try {
      const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

      if (!siguientePaso || !siguientePaso.peritos_disponibles) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo determinar un siguiente paso o no hay peritos en la sección de destino.'
        });
      }

      // Devolvemos la información necesaria para el modal del frontend
      res.status(200).json({
        success: true,
        data: {
          section_name: siguientePaso.section_name,
          peritos_disponibles: siguientePaso.peritos_disponibles,
        }
      });

    } catch (error) {
      console.error('Error en obtenerSiguientePaso:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  }

  /**
   * Deriva un caso al siguiente perito según la lógica de negocio.
   */
  static async derivarCaso(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario: id_perito_actual } = req.user;
    const { id_nuevo_perito } = req.body;

    if (!id_nuevo_perito) {
      return res.status(400).json({ success: false, message: 'Se requiere el ID del nuevo perito.' });
    }

    const connection = await db.promise().getConnection();
    try {
      const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

      if (!siguientePaso || !siguientePaso.section_name) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo determinar la sección de destino para la derivación.'
        });
      }

      let nuevo_estado;
      if (siguientePaso.next_step === 'CONSOLIDATE') {
        nuevo_estado = 'PENDIENTE_CONSOLIDACION';
      } else {
        nuevo_estado = `DERIVADO A: ${siguientePaso.section_name.toUpperCase()}`;
      }

      await Oficio.reasignarPerito(
        id_oficio,
        id_nuevo_perito,
        id_perito_actual,
        nuevo_estado,
        connection
      );

      await connection.commit();
      res.status(200).json({
        success: true,
        message: `Caso derivado exitosamente.`
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error al derivar el caso:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor al derivar el caso.' });
    } finally {
      connection.release();
    }
  }
  /**
   * Obtiene todos los resultados registrados para un oficio (para consolidación).
   */
  static async obtenerResultadosCompletos(req, res) {
    const { id: id_oficio } = req.params;

    try {
      const connection = await db.promise().getConnection();

      const [resultadosPerito] = await connection.query(
        `SELECT 
          orp.id_resultado,
          orp.tipo_resultado,
          orp.resultados,
          orp.fecha_creacion,
          u.nombre_completo,
          u.CIP as perito_cip,
          p.dni as perito_dni,
          u.cqfp as perito_cqfp,
          g.nombre as grado_perito,
          s.nombre as seccion_nombre
         FROM oficio_resultados_perito orp
         JOIN usuario u ON orp.id_perito_responsable = u.id_usuario
         LEFT JOIN perito p ON u.id_usuario = p.id_usuario
         LEFT JOIN usuario_grado ug ON u.id_usuario = ug.id_usuario
         LEFT JOIN grado g ON ug.id_grado = g.id_grado
         LEFT JOIN usuario_seccion us ON u.id_usuario = us.id_usuario
         LEFT JOIN seccion s ON us.id_seccion = s.id_seccion
         WHERE orp.id_oficio = ?
         GROUP BY 
          orp.id_resultado,
          u.id_usuario,
          p.id_perito,
          g.id_grado,
          s.id_seccion
         ORDER BY orp.fecha_creacion ASC`,
        [id_oficio]
      );

      connection.release();

      const resultadosFormateados = resultadosPerito.map(r => {
        let resultadosObj = {};
        if (typeof r.resultados === 'string') {
          try {
            resultadosObj = JSON.parse(r.resultados);
          } catch (e) {
            resultadosObj = { resultado: r.resultados };
          }
        } else if (r.resultados) {
          resultadosObj = r.resultados;
        }

        // Filtrar aquí los resultados de muestras marcadas como "no_aplicable"
        const resultadosFiltrados = {};
        for (const idMuestra in resultadosObj) {
          if (resultadosObj.hasOwnProperty(idMuestra)) {
            const resultadoMuestra = resultadosObj[idMuestra];
            if (!resultadoMuestra.no_aplicable) {
              resultadosFiltrados[idMuestra] = resultadoMuestra;
            }
          }
        }

        // Si después de filtrar no queda ningún resultado, no incluir este procedimiento.
        if (Object.keys(resultadosFiltrados).length === 0) {
          return null;
        }

        return {
          tipo_procedimiento: r.tipo_resultado || r.seccion_nombre || 'Análisis',
          perito_nombre: r.grado_perito ? `${r.grado_perito} ${r.nombre_completo}` : r.nombre_completo,
          perito_cip: r.perito_cip,
          perito_dni: r.perito_dni,
          perito_cqfp: r.perito_cqfp,
          perito_grado: r.grado_perito,
          fecha_creacion: r.fecha_creacion,
          resultados: resultadosFiltrados,
        };
      }).filter(Boolean); // Eliminar los nulos

      res.status(200).json({
        success: true,
        data: resultadosFormateados,
      });

    } catch (error) {
      console.error('Error en obtenerResultadosCompletos:', error);
      res.status(500).json({ success: false, message: 'Error interno al obtener resultados.' });
    }
  }

  static async getDatosConsolidacion(req, res) {
    const { id: id_oficio } = req.params;
    try {
      const data = await ProcedimientoService.getDatosConsolidacion(id_oficio);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error en getDatosConsolidacion (controller):', error);
      res.status(500).json({ success: false, message: error.message || 'Error interno al obtener los datos para la consolidación.' });
    }
  }

  /**
   * Registra la consolidación final y cierra el caso.
   */
  static async registrarConsolidacion(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    
    // Validar entrada
    const validation = Validators.validateConsolidacion(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    try {
      const result = await ProcedimientoService.registrarConsolidacion(id_oficio, id_usuario, req.body);
      res.status(200).json(result); // Usamos 200 OK para actualizaciones/creaciones exitosas
    } catch (error) {
      console.error('Error en registrarConsolidacion (controller):', error);
      res.status(500).json({ success: false, message: error.message || 'Error interno al registrar la consolidación.' });
    }
  }

  /**
   * Genera una vista previa HTML del dictamen final.
   */
  static async previewConsolidacion(req, res) {
    const { id: id_oficio } = req.params;
    const { template = 'reporte' } = req.body; // Default: reporte
    
    const { conclusiones } = req.body;

    try {
      let extraData = {};

      if (template === 'caratula') {
          extraData = {
              caratula: req.body.caratula, // Datos del form de carátula
              id_usuario: req.user.id_usuario // Para firmante
          };
      } else {
          const sourceInforme = req.body.informe || {};
          
          extraData = {
              informe: {
                ...sourceInforme,
                // Fallbacks para compatibilidad si se envían datos planos en la raíz
                conclusion_principal: sourceInforme.conclusion_principal || req.body.conclusiones,
                conclusiones_secundarias: sourceInforme.conclusiones_secundarias || (req.body.observaciones ? [req.body.observaciones] : []), 
                // Si el body plano tiene otros campos que queremos pasar (legacy)
                ...(!req.body.informe ? req.body : {}) 
              },
              perito: req.body.perito // Pasamos datos del perito explícitamente
          };
      }

      const html = await DocumentBuilderService.buildHTML(template, id_oficio, extraData);
      
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);

    } catch (error) {
      console.error('Error en previewConsolidacion:', error);
      res.status(500).send('Error generando la vista previa.');
    }
  }

  // --- Métodos para flujos con formularios placeholder ---

  static async registrarAnalisisPlaceholder(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const { tipo_analisis } = req.body; // 'INST' o 'LAB'

    if (!['INST', 'LAB'].includes(tipo_analisis)) {
      return res.status(400).json({ success: false, message: 'Tipo de análisis no válido.' });
    }

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      const estado_nuevo = `ANALISIS_${tipo_analisis}_FINALIZADO`;
      const tipo_resultado = tipo_analisis === 'INST' ? 'Dosaje Etílico' : 'Toxicológico';

      // Guardar un resultado genérico para el workflow
      await Oficio.addResultado({
        id_oficio,
        id_perito_responsable: id_usuario,
        tipo_resultado,
        resultados: { placeholder: true, message: 'Análisis completado desde flujo placeholder.' }
      }, connection);

      // Añadir seguimiento
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo,
        observaciones: 'Análisis finalizado (placeholder).'
      }, connection);

      await connection.commit();
      res.status(200).json({ success: true, message: 'Análisis (placeholder) registrado.' });
    } catch (error) {
      await connection.rollback();
      console.error(`Error en registrarAnalisisPlaceholder (${tipo_analisis}):`, error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
      connection.release();
    }
  }

  static async registrarConsolidacionPlaceholder(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Añadir seguimiento
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: 'CONSOLIDACION_FINALIZADA',
        observaciones: 'Consolidación finalizada (placeholder).'
      }, connection);

      await connection.commit();
      res.status(200).json({ success: true, message: 'Consolidación (placeholder) registrada.' });
    } catch (error) {
      await connection.rollback();
      console.error('Error en registrarConsolidacionPlaceholder:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
      connection.release();
    }
  }

  static async finalizarParaMP(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Añadir seguimiento final
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: 'DICTAMEN_EMITIDO',
        observaciones: 'El dictamen ha sido emitido y el caso está cerrado.'
      }, connection);

      await connection.commit();
      res.status(200).json({ success: true, message: 'Caso finalizado y enviado a Mesa de Partes.' });
    } catch (error) {
      await connection.rollback();
      console.error('Error en finalizarParaMP:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
      connection.release();
    }
  }
}
