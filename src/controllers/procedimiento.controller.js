import { Oficio } from '../models/Oficio.js';
import { Muestra } from '../models/Muestra.js';
import { MuestraService } from '../services/MuestraService.js';
import db from '../database/db.js';
import { WorkflowService } from '../services/workflowService.js';

export class ProcedimientoController {
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
          const codigoMuestra = await MuestraService.generarCodigoMuestra(id_oficio, muestra.tipo_muestra);
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
        
        // Lógica de sincronización para las observaciones
        const systemMessage = `Se guardaron ${codigosGenerados.length} muestras con los códigos: ${codigosGenerados.join(', ')}.`;
        const separator = '\n\nObservaciones del perito:\n';
        let userObservaciones = observaciones || '';

        if (userObservaciones.includes(separator)) {
          userObservaciones = userObservaciones.split(separator)[1] || '';
        }

        finalObservaciones = userObservaciones ? `${systemMessage}${separator}${userObservaciones}` : systemMessage;

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
        const codigosGenerados = [];
        for (const muestra of muestras) {
          const codigoMuestra = await MuestraService.generarCodigoMuestra(id_oficio, muestra.tipo_muestra);
          await Muestra.create({
            id_oficio,
            tipo_muestra: muestra.tipo_muestra,
            descripcion: muestra.descripcion,
            cantidad: muestra.cantidad,
            codigo_muestra: codigoMuestra,
            esta_lacrado: true,
          }, connection);
          codigosGenerados.push(codigoMuestra);
        }
        
        // 5. Formatear observaciones para incluir información del sistema
        const systemMessage = `FASE 1/2: Extracción completada. Se generaron ${codigosGenerados.length} muestras con los códigos: ${codigosGenerados.join(', ')}. El caso está listo para la fase de análisis.`;
        finalObservaciones = observaciones ? `${systemMessage}\n\nObservaciones del perito:\n${observaciones}` : systemMessage;

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

  static async getDatosAnalisisTM(req, res) {
    const { id: id_oficio } = req.params;
    const connection = await db.promise().getConnection();
    try {
      // Consultas para obtener todos los datos guardados del análisis
      const [actas] = await connection.query('SELECT * FROM actas_apertura WHERE id_oficio = ? ORDER BY fecha_apertura DESC LIMIT 1', [id_oficio]);
      const [metadata] = await connection.query('SELECT * FROM oficio_resultados_metadata WHERE id_oficio = ? LIMIT 1', [id_oficio]);
      const [muestras] = await connection.query('SELECT * FROM muestras WHERE id_oficio = ?', [id_oficio]);

      // Si no hay acta, asumimos que el procedimiento no se ha iniciado
      if (actas.length === 0) {
        return res.status(200).json({ success: true, data: null });
      }

      // Procesar y formatear los datos para el frontend
      const aperturaData = {
        descripcion_paquete: actas[0].descripcion_paquete,
        observaciones: actas[0].observaciones,
      };

      const metadataData = metadata.length > 0 ? {
        objeto_pericia: metadata[0].objeto_pericia,
        metodo_utilizado: metadata[0].metodo_utilizado,
        observaciones_finales: metadata[0].observaciones_finales,
      } : null;
      
      const muestrasAnalizadas = muestras.map(m => {
        let resultados = {};
        if (m.resultado_analisis) {
          try {
            // Si ya es un objeto, lo usamos, si es string, lo parseamos
            resultados = typeof m.resultado_analisis === 'object' ? m.resultado_analisis : JSON.parse(m.resultado_analisis);
          } catch (e) {
            console.warn(`Resultado de muestra ${m.id_muestra} no es un JSON válido.`, m.resultado_analisis);
            // Si falla el parseo, se deja como objeto vacío para no romper el front
          }
        }
        return {
          id: m.id_muestra,
          codigo_muestra: m.codigo_muestra,
          tipo_muestra: m.tipo_muestra,
          descripcion_detallada: m.descripcion_detallada,
          resultados,
        };
      });
      
      // Leer el valor booleano directamente de la tabla de metadatos
      const muestrasAgotadas = metadata.length > 0 ? !!metadata[0].muestras_agotadas : false;

      res.status(200).json({
        success: true,
        data: {
          aperturaData,
          metadata: metadataData,
          muestrasAnalizadas,
          muestrasAgotadas
        }
      });

    } catch (error) {
      console.error('Error en getDatosAnalisisTM:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
      connection.release();
    }
  }

  /**
   * Registra el resultado de un análisis de muestras recibidas.
   */
  static async registrarAnalisis(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const { apertura_data, muestras_analizadas, metadata, muestras_agotadas } = req.body;

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validar que el oficio pertenece al perito
      const oficio = await Oficio.findById(id_oficio);
      if (!oficio.success || oficio.data.id_usuario_perito_asignado !== id_usuario) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      // 2. Guardar el acta de apertura
      if (!apertura_data || !apertura_data.descripcion_paquete) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Los datos del acta de apertura son requeridos.' });
      }
      // Usar INSERT ... ON DUPLICATE KEY UPDATE para evitar errores en re-edición
      await connection.query(
        `INSERT INTO actas_apertura (id_oficio, id_perito, descripcion_paquete, observaciones)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           id_perito = VALUES(id_perito),
           descripcion_paquete = VALUES(descripcion_paquete),
           observaciones = VALUES(observaciones)`,
        [id_oficio, id_usuario, apertura_data.descripcion_paquete, apertura_data.observaciones]
      );


      // 3. Guardar los metadatos del informe, incluyendo muestras_agotadas y observaciones_finales
      if (metadata) {
        await connection.query(
          `INSERT INTO oficio_resultados_metadata (id_oficio, objeto_pericia, metodo_utilizado, muestras_agotadas, observaciones_finales)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             objeto_pericia = VALUES(objeto_pericia),
             metodo_utilizado = VALUES(metodo_utilizado),
             muestras_agotadas = VALUES(muestras_agotadas),
             observaciones_finales = VALUES(observaciones_finales)`,
          [id_oficio, metadata.objeto_pericia, metadata.metodo_utilizado, muestras_agotadas, metadata.observaciones_finales]
        );
      }

      // 4. Procesar y actualizar las muestras con sus resultados
      if (!Array.isArray(muestras_analizadas) || muestras_analizadas.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Se requiere al menos una muestra analizada.' });
      }

      for (const muestra of muestras_analizadas) {
        if (!muestra.codigo_muestra || !muestra.resultados) {
            throw new Error('Cada muestra analizada debe tener un código y un resultado.');
        }

        const resultadoParaBD = typeof muestra.resultados === 'object'
          ? JSON.stringify(muestra.resultados)
          : muestra.resultados;

        const [updateResult] = await connection.query(
          'UPDATE muestras SET resultado_analisis = ?, descripcion_detallada = ? WHERE codigo_muestra = ? AND id_oficio = ?',
          [resultadoParaBD, muestra.descripcion_detallada, muestra.codigo_muestra, id_oficio]
        );

        if (updateResult.affectedRows === 0) {
          // Si la muestra no existía (ej. se añadió manualmente en el form), la insertamos.
          await connection.query(
            'INSERT INTO muestras (id_oficio, codigo_muestra, tipo_muestra, descripcion_detallada, resultado_analisis, cantidad) VALUES (?, ?, ?, ?, ?, ?)',
            [id_oficio, muestra.codigo_muestra, muestra.tipo_muestra || 'Desconocido', muestra.descripcion_detallada, resultadoParaBD, muestra.cantidad || 'N/A']
          );
        }
      }

      // 5. Registrar el resultado en oficio_resultados_perito para el WorkflowService
      const [peritoData] = await connection.query(
        `SELECT s.nombre as nombre_seccion 
         FROM usuario_seccion us 
         JOIN seccion s ON us.id_seccion = s.id_seccion 
         WHERE us.id_usuario = ?`,
        [id_usuario]
      );

      let tipoResultado = 'RESULTADO_GENERICO';
      let estadoNuevo = 'ANALISIS_FINALIZADO';
      if (peritoData.length > 0) {
        const seccion = peritoData[0].nombre_seccion.toUpperCase();
        if (seccion === 'TOMA DE MUESTRA') {
          tipoResultado = 'Sarro Ungueal';
          estadoNuevo = 'ANALISIS_TM_FINALIZADO';
        } else if (seccion === 'LABORATORIO') {
          tipoResultado = 'Toxicológico';
          estadoNuevo = 'ANALISIS_LAB_FINALIZADO';
        } else if (seccion === 'INSTRUMENTALIZACION') {
          tipoResultado = 'Dosaje Etílico';
          estadoNuevo = 'ANALISIS_INST_FINALIZADO';
        }
      }

      const resultadosConsolidados = {};
      muestras_analizadas.forEach(m => {
        let val = m.resultados;
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try { val = JSON.parse(val); } catch (e) { }
        }
        resultadosConsolidados[m.codigo_muestra] = val;
      });

      await Oficio.addResultado({
        id_oficio,
        id_perito_responsable: id_usuario,
        tipo_resultado: tipoResultado,
        resultados: resultadosConsolidados
      }, connection);

      // 6. Añadir seguimiento de éxito al oficio
      let obsFinal = `Se registraron los resultados de ${muestras_analizadas.length} muestra(s).`;
      if(muestras_agotadas) {
        obsFinal += ' Las muestras se agotaron durante el análisis.'
      }

      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: estadoNuevo,
        observaciones: obsFinal
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

    try {
      const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

      if (!siguientePaso || !siguientePaso.section_name) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo determinar la sección de destino para la derivación.'
        });
      }
      
      // Determinar el nuevo estado basado en la tarea
      let nuevo_estado;
      if (siguientePaso.next_step === 'CONSOLIDATE') {
        nuevo_estado = 'PENDIENTE_CONSOLIDACION';
      } else {
        nuevo_estado = `DERIVADO A: ${siguientePaso.section_name.toUpperCase()}`;
      }

      // Reasignar el oficio y establecer el estado específico
      await Oficio.reasignarPerito(
        id_oficio,
        id_nuevo_perito,
        id_perito_actual,
        nuevo_estado
      );

      res.status(200).json({
        success: true,
        message: `Caso derivado exitosamente.`
      });

    } catch (error) {
      console.error('Error al derivar el caso:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor al derivar el caso.' });
    }
  }
  /**
   * Obtiene todos los resultados registrados para un oficio (para consolidación).
   */
  static async obtenerResultadosCompletos(req, res) {
    const { id: id_oficio } = req.params;

    try {
      const connection = await db.promise().getConnection();

      // Obtener resultados de oficio_resultados_perito con información del perito
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

      // Formatear los resultados para el frontend
      const resultados = resultadosPerito.map(r => {
        let resultadosObj = {};

        // Intentar parsear resultados si es JSON
        if (typeof r.resultados === 'string') {
          try {
            resultadosObj = JSON.parse(r.resultados);
          } catch (e) {
            // Si no es JSON, asumir que es un valor simple
            resultadosObj = { resultado: r.resultados };
          }
        } else if (typeof r.resultados === 'object') {
          resultadosObj = r.resultados;
        }

        return {
          tipo_procedimiento: r.tipo_resultado || r.seccion_nombre || 'Análisis',
          perito_nombre: r.grado_perito ? `${r.grado_perito} ${r.nombre_completo}` : r.nombre_completo,
          perito_cip: r.perito_cip,
          perito_dni: r.perito_dni,
          perito_cqfp: r.perito_cqfp,
          perito_grado: r.grado_perito,
          fecha_creacion: r.fecha_creacion,
          resultados: resultadosObj
        };
      });

      res.status(200).json({
        success: true,
        data: resultados
      });

    } catch (error) {
      console.error('Error en obtenerResultadosCompletos:', error);
      res.status(500).json({ success: false, message: 'Error interno al obtener resultados.' });
    }
  }

  /**
   * Registra la consolidación final y cierra el caso.
   */
  static async registrarConsolidacion(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const { conclusiones, observaciones, cerrar_caso } = req.body;

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // 1. Guardar el dictamen final (podríamos crear una tabla 'dictamenes' o usar 'oficio_resultados_metadata')
      // Usamos 'oficio_resultados_metadata' actualizando o insertando
      await connection.query(
        `INSERT INTO oficio_resultados_metadata (id_oficio, conclusiones_finales, observaciones_finales)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE conclusiones_finales = VALUES(conclusiones_finales), observaciones_finales = VALUES(observaciones_finales)`,
        [id_oficio, conclusiones, observaciones]
      );

      // 2. Generar el documento PDF final y guardarlo (opcional, o se genera al vuelo)
      // Aquí asumimos que se genera al vuelo cuando se solicita, pero marcamos el hito.

      // 3. Cerrar el caso si se solicita
      if (cerrar_caso) {
        await Oficio.updateEstado(id_oficio, 'DICTAMEN EMITIDO', connection);

        await Oficio.addSeguimiento({
          id_oficio,
          id_usuario,
          estado_nuevo: 'DICTAMEN EMITIDO',
          observaciones: 'Se ha emitido el Dictamen Pericial Final y cerrado el caso.'
        }, connection);
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Consolidación registrada y dictamen emitido exitosamente.'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error en registrarConsolidacion:', error);
      res.status(500).json({ success: false, message: 'Error interno al registrar la consolidación.' });
    } finally {
      connection.release();
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
