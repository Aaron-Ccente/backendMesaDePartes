import db from "../database/db.js";

export class Especialidad {
  static async findAll() {
    try {
      const [rows] = await db.promise().query(
        'SELECT id_especialidad, nombre FROM especialidad'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}