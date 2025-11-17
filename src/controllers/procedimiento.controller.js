import { Oficio } from '../models/Oficio.js';
import db from '../database/db.js';
import { WorkflowService } from '../services/workflowService.js';

export class ProcedimientoController {
  /**
   * Registra el resultado de una extracción (exitosa o fallida) y las muestras asociadas.
   */
  static async registrarExtraccion(req, res) {
    const { id: id_oficio } = req.params;
    const { id_usuario } = req.user;
    const { fue_exitosa, observaciones, muestras } = req.body;

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Validar que el oficio pertenece al perito
      const oficio = await Oficio.findById(id_oficio);
      if (!oficio.success || oficio.data.id_usuario_perito_asignado !== id_usuario) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      if (fue_exitosa) {
        // Si la extracción fue exitosa, guardar las muestras
        if (!Array.isArray(muestras) || muestras.length === 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Se requiere al menos una muestra para una extracción exitosa.' });
        }

        for (const muestra of muestras) {
          await connection.query(
            'INSERT INTO muestras (id_oficio, descripcion, cantidad) VALUES (?, ?, ?)',
            [id_oficio, muestra.descripcion, muestra.cantidad]
          );
        }

        // Añadir seguimiento de éxito
        await Oficio.addSeguimiento({
          id_oficio,
          id_usuario,
          estado_nuevo: 'EXTRACCIÓN REALIZADA',
        }, connection);

      } else {
        // Si la extracción fue fallida, solo registrar el seguimiento con las observaciones
        await Oficio.addSeguimiento({
          id_oficio,
          id_usuario,
          estado_nuevo: 'EXTRACCIÓN FALLIDA',
          observaciones: observaciones || 'No se especificaron observaciones.'
        }, connection);
      }

      await connection.commit();
      res.status(201).json({ success: true, message: 'Procedimiento de extracción registrado exitosamente.' });

    } catch (error) {
      await connection.rollback();
      console.error('Error al registrar extracción:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor al registrar la extracción.' });
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
