import db from '../database/db.js';

export class Muestra {
  // Método para crear una nueva muestra
  // La lógica de generación de código se añadirá aquí en la Fase 2
  static async create(data, connection) {
    const conn = connection || db.promise();
    const [result] = await conn.query('INSERT INTO muestras SET ?', [data]);
    return result.insertId;
  }

  // Método para eliminar todas las muestras por ID de oficio
  static async deleteByOficioId(id_oficio, connection) {
    const conn = connection || db.promise();
    await conn.query('DELETE FROM muestras WHERE id_oficio = ?', [id_oficio]);
  }

  // Método para encontrar muestras por ID de oficio
  static async findByOficioId(id_oficio) {
    const [rows] = await db.promise().query('SELECT * FROM muestras WHERE id_oficio = ?', [id_oficio]);
    return rows;
  }

  // Contar muestras de un tipo para un oficio específico
  static async countByType(id_oficio, tipo_muestra) {
    const [rows] = await db.promise().query(
      'SELECT COUNT(*) as count FROM muestras WHERE id_oficio = ? AND tipo_muestra = ?',
      [id_oficio, tipo_muestra]
    );
    return rows[0].count;
  }
}
