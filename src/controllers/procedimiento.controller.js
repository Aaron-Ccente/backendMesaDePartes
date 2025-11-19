import { Oficio } from '../models/Oficio.js';
import { Muestra } from '../models/Muestra.js';
import { MuestraService } from '../services/MuestraService.js';
import db from '../database/db.js';
import { WorkflowService } from '../services/workflowService.js';

export class ProcedimientoController {
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

      if (fue_exitosa) {
        // 2. Si la extracción fue exitosa, procesar y guardar las muestras
        if (!Array.isArray(muestras) || muestras.length === 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Se requiere al menos una muestra para una extracción exitosa.' });
        }

        const codigosGenerados = [];

        for (const muestra of muestras) {
          // 2.1. Generar el código único para la muestra
          const codigoMuestra = await MuestraService.generarCodigoMuestra(id_oficio, muestra.tipo_muestra);

          const nuevaMuestra = {
            id_oficio,
            tipo_muestra: muestra.tipo_muestra,
            descripcion: muestra.descripcion, // Descripción adicional opcional
            cantidad: muestra.cantidad,
            codigo_muestra: codigoMuestra,
            esta_lacrado: true, // El lacrado es implícito en el proceso de extracción exitosa
          };

          // 2.2. Guardar la nueva muestra
          const id_muestra = await Muestra.create(nuevaMuestra, connection);
          codigosGenerados.push(codigoMuestra);

          // 2.3. Crear el evento inicial en la cadena de custodia
          await connection.query('INSERT INTO cadena_de_custodia SET ?', [{
            id_muestra,
            id_perito_entrega: id_usuario, // El perito que extrae es el primer custodio
            proposito: 'CREACIÓN Y EXTRACCIÓN',
            observaciones: 'Inicio de la cadena de custodia.'
          }]);
        }

        // 2.4. Añadir seguimiento de éxito al oficio
        await Oficio.addSeguimiento({
          id_oficio,
          id_usuario,
          estado_nuevo: 'EXTRACCIÓN REALIZADA',
          observaciones: `Se generaron ${codigosGenerados.length} muestras con los códigos: ${codigosGenerados.join(', ')}`
        }, connection);

        await connection.commit();
        res.status(201).json({
          success: true,
          message: 'Procedimiento de extracción registrado exitosamente.',
          data: { codigos_generados: codigosGenerados }
        });

      } else {
        // 3. Si la extracción fue fallida, solo registrar el seguimiento
        await Oficio.addSeguimiento({
          id_oficio,
          id_usuario,
          estado_nuevo: 'EXTRACCIÓN FALLIDA',
          observaciones: observaciones || 'No se especificaron observaciones.'
        }, connection);

        await connection.commit();
        res.status(201).json({ success: true, message: 'Procedimiento de extracción fallida registrado exitosamente.' });
      }

    } catch (error) {
      await connection.rollback();
      console.error('Error al registrar extracción:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor al registrar la extracción.' });
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
    const { apertura_data, muestras_analizadas, metadata } = req.body;

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
      await connection.query('INSERT INTO actas_apertura SET ?', [{
        id_oficio,
        id_perito: id_usuario,
        descripcion_paquete: apertura_data.descripcion_paquete,
        observaciones: apertura_data.observaciones,
      }]);

      // 3. Guardar los metadatos del informe
      if (metadata) {
        await connection.query('INSERT INTO oficio_resultados_metadata SET ?', [{
          id_oficio,
          objeto_pericia: metadata.objeto_pericia,
          metodo_utilizado: metadata.metodo_utilizado,
        }]);
      }

      // 4. Procesar y actualizar las muestras con sus resultados
      if (!Array.isArray(muestras_analizadas) || muestras_analizadas.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Se requiere al menos una muestra analizada.' });
      }

      for (const muestra of muestras_analizadas) {
        if (!muestra.codigo_muestra || !muestra.resultado_analisis) {
          // Para LAB, resultado_analisis puede ser un objeto (resultados: {cocaina: 'POSITIVO', ...})
          // Si viene como 'resultados' dentro del objeto muestra, lo usamos.
          if (muestra.resultados && typeof muestra.resultados === 'object') {
            muestra.resultado_analisis = JSON.stringify(muestra.resultados);
          } else {
            throw new Error('Cada muestra analizada debe tener un código y un resultado.');
          }
        }

        // Asegurarse de que resultado_analisis sea string para la BD
        const resultadoParaBD = typeof muestra.resultado_analisis === 'object'
          ? JSON.stringify(muestra.resultado_analisis)
          : muestra.resultado_analisis;

        // Actualizar el resultado y la descripción detallada en la tabla de muestras
        const [updateResult] = await connection.query(
          'UPDATE muestras SET resultado_analisis = ?, descripcion_detallada = ? WHERE codigo_muestra = ? AND id_oficio = ?',
          [resultadoParaBD, muestra.descripcion_detallada, muestra.codigo_muestra, id_oficio]
        );

        if (updateResult.affectedRows === 0) {
          // Si no existe por código (ej. nueva muestra en LAB), intentar insertarla
          // Esto es necesario si LAB agrega muestras que no venían de TM
          const [insertResult] = await connection.query(
            'INSERT INTO muestras (id_oficio, codigo_muestra, tipo_muestra, descripcion_detallada, resultado_analisis, cantidad) VALUES (?, ?, ?, ?, ?, ?)',
            [id_oficio, muestra.codigo_muestra, muestra.tipo_muestra || 'Desconocido', muestra.descripcion_detallada, resultadoParaBD, 1]
          );
        }
      }

      // 5. Registrar el resultado en oficio_resultados_perito para el WorkflowService
      // Determinar el tipo de resultado basado en la sección del perito
      const [peritoData] = await connection.query(
        `SELECT s.nombre as nombre_seccion 
         FROM usuario_seccion us 
         JOIN seccion s ON us.id_seccion = s.id_seccion 
         WHERE us.id_usuario = ?`,
        [id_usuario]
      );

      let tipoResultado = 'RESULTADO_GENERICO';
      if (peritoData.length > 0) {
        const seccion = peritoData[0].nombre_seccion.toUpperCase();
        if (seccion === 'TOMA DE MUESTRA') tipoResultado = 'Sarro Ungueal';
        else if (seccion === 'LABORATORIO') tipoResultado = 'Toxicológico';
        else if (seccion === 'INSTRUMENTALIZACION') tipoResultado = 'Dosaje Etílico';
      }

      // Recopilar todos los resultados en un solo objeto
      const resultadosConsolidados = {};
      muestras_analizadas.forEach(m => {
        let val = m.resultado_analisis;
        // Intentar parsear si es JSON (caso LAB)
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
      });

      // 6. Añadir seguimiento de éxito al oficio
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario,
        estado_nuevo: 'ANÁLISIS REALIZADO',
        observaciones: `Se registraron los resultados de ${muestras_analizadas.length} muestra(s).`
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
    const { id_nuevo_perito } = req.body; // El perito es seleccionado en el frontend

    if (!id_nuevo_perito) {
      return res.status(400).json({ success: false, message: 'Se requiere el ID del nuevo perito.' });
    }

    try {
      // Aunque el perito se selecciona en el front, usamos el service para validar la sección de destino
      const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

      if (!siguientePaso || !siguientePaso.section_name) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo determinar la sección de destino para la derivación.'
        });
      }

      // Reasignar el oficio al perito seleccionado por el usuario
      await Oficio.reasignarPerito(
        id_oficio,
        id_nuevo_perito,
        id_perito_actual,
        siguientePaso.section_name // Usamos el nombre de la sección calculado por el servicio
      );

      res.status(200).json({
        success: true,
        message: `Caso derivado exitosamente a la sección ${siguientePaso.section_name}.`
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
}
