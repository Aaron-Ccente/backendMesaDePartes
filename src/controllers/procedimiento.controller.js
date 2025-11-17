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
    const { apertura_data, muestras_analizadas } = req.body;

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

      // 3. Procesar y actualizar las muestras con sus resultados
      if (!Array.isArray(muestras_analizadas) || muestras_analizadas.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Se requiere al menos una muestra analizada.' });
      }

      for (const muestra of muestras_analizadas) {
        if (!muestra.codigo_muestra || !muestra.resultado_analisis) {
          throw new Error('Cada muestra analizada debe tener un código y un resultado.');
        }
        // Actualizar el resultado en la tabla de muestras
        const [updateResult] = await connection.query(
          'UPDATE muestras SET resultado_analisis = ? WHERE codigo_muestra = ? AND id_oficio = ?',
          [muestra.resultado_analisis, muestra.codigo_muestra, id_oficio]
        );

        if (updateResult.affectedRows === 0) {
          throw new Error(`La muestra con el código ${muestra.codigo_muestra} no fue encontrada o no pertenece a este oficio.`);
        }
      }

      // 4. Añadir seguimiento de éxito al oficio
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
}
