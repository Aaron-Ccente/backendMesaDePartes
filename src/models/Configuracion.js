import db from '../database/db.js';

export class Configuracion {
  static async findAll() {
    try {
      const [rows] = await db.promise().query('SELECT * FROM configuracion_sistema');
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error en Configuracion.findAll:', error);
      return { success: false, message: 'Error al obtener configuraciones' };
    }
  }

  static async updateBatch(configs) {
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      for (const config of configs) {
        await connection.query(
          'UPDATE configuracion_sistema SET valor = ? WHERE clave = ?',
          [config.valor, config.clave]
        );
      }

      await connection.commit();
      return { success: true, message: 'Configuraciones actualizadas correctamente' };
    } catch (error) {
      await connection.rollback();
      console.error('Error en Configuracion.updateBatch:', error);
      return { success: false, message: 'Error al actualizar configuraciones' };
    } finally {
      connection.release();
    }
  }
}
