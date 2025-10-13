import db from "../database/db.js";

export class Prioridad {
    static async findAll() {
    try {
      const [rows] = await db.promise().query(
        'SELECT id_prioridad, nombre_prioridad FROM tipos_prioridad ORDER BY id_prioridad'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}