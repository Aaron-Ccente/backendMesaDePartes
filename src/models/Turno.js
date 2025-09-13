import db from "../database/db.js";

export class Turnos{
    static async findAll(){
    try {
      const [rows] = await db.promise().query(
        'SELECT id_turno, nombre FROM turno ORDER BY id_turno'
      );
      return rows;
    } catch (error) {
      throw error;
    }
    }
}