import db from '../database/db.js';
import { Oficio } from '../models/Oficio.js';

export class ProcedimientoService {
  /**
   * Obtiene todos los datos necesarios para la vista de consolidación de un oficio.
   * @param {number} id_oficio - El ID del oficio a consultar.
   * @returns {Promise<object>} Un objeto con los detalles del oficio, resultados previos y metadatos.
   */
  static async getDatosConsolidacion(id_oficio) {
    const connection = await db.promise().getConnection();
    try {
      // 1. Obtener detalles completos del oficio (incluye exámenes)
      const oficioDetalleRes = await Oficio.findDetalleById(id_oficio, connection);
      if (!oficioDetalleRes.success) {
        throw new Error('Oficio no encontrado.');
      }

      // 2. Obtener todos los resultados de los análisis
      const [resultadosPerito] = await connection.query(
        `SELECT 
          orp.tipo_resultado,
          orp.resultados,
          u.nombre_completo as perito_nombre,
          g.nombre as perito_grado,
          s.nombre as seccion_nombre,
          orp.id_perito_responsable
         FROM oficio_resultados_perito orp
         JOIN usuario u ON orp.id_perito_responsable = u.id_usuario
         LEFT JOIN usuario_grado ug ON u.id_usuario = ug.id_usuario
         LEFT JOIN grado g ON ug.id_grado = g.id_grado
         JOIN usuario_seccion us ON u.id_usuario = us.id_usuario
         JOIN seccion s ON us.id_seccion = s.id_seccion
         WHERE orp.id_oficio = ?
         ORDER BY FIELD(s.nombre, 'Toma de Muestra', 'Laboratorio', 'Instrumentalizacion'), orp.fecha_creacion ASC`,
        [id_oficio]
      );
      
      // 3. Obtener los metadatos de los informes (objeto y método)
      const [metadataRows] = await connection.query(
        'SELECT * FROM oficio_resultados_metadata WHERE id_oficio = ?',
        [id_oficio]
      );
      const metadata = metadataRows[0] || {};
      
      // 4. Obtener todas las muestras y sus detalles
      const [muestras] = await connection.query('SELECT * FROM muestras WHERE id_oficio = ?', [id_oficio]);

      // 5. Obtener el recolector de la muestra
      const recolector = await this._getRecolectorMuestra(id_oficio, connection);

      return {
        oficio: oficioDetalleRes.data,
        resultados_previos: resultadosPerito.map(r => ({
          ...r,
          resultados: typeof r.resultados === 'string' ? JSON.parse(r.resultados) : r.resultados
        })),
        metadata,
        muestras,
        recolector_muestra: recolector
      };

    } catch (error) {
      console.error('Error en ProcedimientoService.getDatosConsolidacion:', error);
      throw error; // Re-lanzar para que el llamador lo maneje
    } finally {
      if (connection) connection.release();
    }
  }

  static async _getRecolectorMuestra(idOficio, connection) {
    // 1. Intento principal: Buscar el perito que finalizó la extracción.
    let [rows] = await connection.execute(
      `SELECT u.nombre_completo 
       FROM seguimiento_oficio s
       JOIN usuario u ON s.id_usuario = u.id_usuario
       WHERE s.id_oficio = ? AND s.estado_nuevo = 'EXTRACCION_FINALIZADA'
       ORDER BY s.fecha_seguimiento ASC
       LIMIT 1`,
      [idOficio]
    );

    if (rows.length > 0) {
      return rows[0].nombre_completo;
    }

    // 2. Fallback: Si no hay extractor, buscar el primer perito que registró un resultado.
    [rows] = await connection.execute(
      `SELECT u.nombre_completo
       FROM oficio_resultados_perito orp
       JOIN usuario u ON orp.id_perito_responsable = u.id_usuario
       WHERE orp.id_oficio = ?
       ORDER BY orp.fecha_creacion ASC
       LIMIT 1`,
      [idOficio]
    );

    return rows.length > 0 ? rows[0].nombre_completo : null;
  }

  /**
   * Registra la consolidación final y cierra el caso.
   * @param {number} id_oficio - ID del oficio
   * @param {number} id_usuario - ID del usuario perito
   * @param {object} data - Datos de consolidación
   * @param {string} data.conclusiones - Conclusiones del dictamen
   * @param {string} [data.observaciones] - Observaciones finales
   * @param {boolean} [data.cerrar_caso] - Si se debe cerrar el caso
   */
  static async registrarConsolidacion(id_oficio, id_usuario, { conclusiones, observaciones, cerrar_caso }) {
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validar permisos (el usuario debe ser el asignado o tener rol adecuado - simplificado - el middleware ya filtra el acceso básico o eso esperamos xd)

      
      // 2. Guardar el dictamen final (conclusiones y observaciones)
      await connection.query(
        `INSERT INTO oficio_resultados_metadata (id_oficio, conclusiones_finales, observaciones_finales)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE conclusiones_finales = VALUES(conclusiones_finales), observaciones_finales = VALUES(observaciones_finales)`,
        [id_oficio, conclusiones, observaciones || null]
      );

      let message = 'Consolidación guardada exitosamente.';

      // 3. Cerrar el caso si se solicita
      if (cerrar_caso) {
        // Verificar si ya estaba cerrado para no duplicar eventos innecesarios
        const [rows] = await connection.query('SELECT estado_nuevo FROM seguimiento_oficio WHERE id_oficio = ? ORDER BY id_seguimiento DESC LIMIT 1', [id_oficio]);
        const ultimoEstado = rows.length > 0 ? rows[0].estado_nuevo : '';

        if (ultimoEstado !== 'DICTAMEN_EMITIDO') {
             await Oficio.updateEstado(id_oficio, 'DICTAMEN EMITIDO', connection);

             await Oficio.addSeguimiento({
               id_oficio,
               id_usuario,
               estado_nuevo: 'DICTAMEN_EMITIDO', // Estandarizado con guion bajo
               observaciones: 'Se ha emitido el Dictamen Pericial Final y cerrado el caso.'
             }, connection);
             message = 'Consolidación registrada y caso cerrado exitosamente.';
        } else {
             message = 'Consolidación actualizada (el caso ya estaba cerrado).';
        }
      }

      await connection.commit();
      return { success: true, message };

    } catch (error) {
      await connection.rollback();
      console.error('Error en ProcedimientoService.registrarConsolidacion:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
