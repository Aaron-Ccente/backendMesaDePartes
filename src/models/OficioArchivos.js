// backend/src/models/OficioArchivos.js
import db from '../database/db.js';

/**
 * Modelo para gestionar los archivos adjuntos de un oficio (ej. PDF final firmado),
 * interactuando con la tabla `oficio_archivos`.
 */
export class OficioArchivos {

  /**
   * Crea un nuevo registro de archivo para un oficio.
   * @param {object} data - Datos del archivo
   * @param {number} data.id_oficio - ID del oficio principal
   * @param {string} [data.id_archivo_google_drive] - (Opcional) El ID devuelto por Google Drive
   * @param {string} [data.ruta_archivo_local] - (Opcional) La ruta en el servidor local
   * @param {string} data.nombre_archivo - El nombre del archivo
   * @param {string} data.tipo_archivo - 'EVIDENCIA_INICIAL', 'DOCUMENTO_FINAL_FIRMADO', 'OTRO'
   * @param {number} data.subido_por - ID del usuario (Mesa de Partes) que sube el archivo
   * @param {string} [data.datos_receptor] - (Opcional) JSON string con datos de quién recibe
   * @param {import("mysql2/promise").Connection} [connection] - (Opcional) Conexión de BD para transacciones
   */
  static async create(data, connection = null) {
    const {
      id_oficio,
      id_archivo_google_drive = null,
      ruta_archivo_local = null,
      nombre_archivo,
      tipo_archivo = 'OTRO',
      subido_por,
      datos_receptor = null
    } = data;

    if (!id_oficio || (!id_archivo_google_drive && !ruta_archivo_local) || !nombre_archivo || !subido_por) {
      throw new Error('id_oficio, (id_archivo_google_drive o ruta_archivo_local), nombre_archivo y subido_por son requeridos');
    }

    // Usar la conexión de la transacción si se pasa, o el pool por defecto
    const dbConn = connection || db.promise();

    try {
      const query = `
        INSERT INTO oficio_archivos (
          id_oficio,
          id_archivo_google_drive,
          ruta_archivo_local,
          nombre_archivo,
          tipo_archivo,
          subido_por,
          datos_receptor
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await dbConn.query(query, [
        id_oficio,
        id_archivo_google_drive,
        ruta_archivo_local,
        nombre_archivo,
        tipo_archivo,
        subido_por,
        datos_receptor
      ]);

      return {
        success: true,
        id: result.insertId,
        message: 'Archivo registrado exitosamente'
      };

    } catch (error) {
      console.error('Error en OficioArchivos.create:', error);
      // Si estamos en una transacción, propagamos el error para el rollback
      if (connection) throw error; 
      
      return { 
        success: false, 
        message: 'Error al registrar el archivo en la BD' 
      };
    }
  }

  /**
   * Busca todos los archivos asociados a un ID de oficio.
   * @param {number} id_oficio - ID del oficio principal
   */
  static async findByOficioId(id_oficio) {
    if (!id_oficio) {
      throw new Error('El id_oficio es requerido');
    }

    try {
      const query = `
        SELECT 
          a.id_archivo,
          a.id_oficio,
          a.id_archivo_google_drive,
          a.ruta_archivo_local,
          a.nombre_archivo,
          a.tipo_archivo,
          a.fecha_subida,
          u.nombre_completo as nombre_usuario_subida,
          a.datos_receptor
        FROM oficio_archivos a
        JOIN usuario u ON a.subido_por = u.id_usuario
        WHERE a.id_oficio = ?
        ORDER BY a.fecha_subida DESC;
      `;

      const [rows] = await db.promise().query(query, [id_oficio]);

      // Parsear 'datos_receptor' si existe
      const archivos = rows.map(row => {
        try {
          if (row.datos_receptor) {
            row.datos_receptor = JSON.parse(row.datos_receptor);
          }
        } catch (e) {
          row.datos_receptor = { error: "Formato JSON inválido." };
        }
        return row;
      });

      return { success: true, data: archivos };

    } catch (error) {
      console.error('Error en OficioArchivos.findByOficioId:', error);
      throw error;
    }
  }
  /**
   * Busca un registro de archivo específico por su ID.
   * @param {number} id_archivo - ID del archivo (de la tabla oficio_archivos)
   */
  static async findById(id_archivo) {
    if (!id_archivo) {
      throw new Error('El id_archivo es requerido');
    }

    try {
      const query = `
        SELECT 
          a.id_archivo,
          a.id_oficio,
          a.id_archivo_google_drive,
          a.ruta_archivo_local,
          a.nombre_archivo
        FROM oficio_archivos a
        WHERE a.id_archivo = ?;
      `;

      const [rows] = await db.promise().query(query, [id_archivo]);

      if (rows.length === 0) {
        return { success: false, message: 'Archivo no encontrado' };
      }

      return { success: true, data: rows[0] };

    } catch (error) {
      console.error('Error en OficioArchivos.findById:', error);
      throw error;
    }
  }
}

