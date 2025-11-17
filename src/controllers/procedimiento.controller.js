import { Oficio } from '../models/Oficio.js';
import db from '../database/db.js';

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
}
