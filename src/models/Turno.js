import db from "../database/db.js";

export class Turnos{
    static async findAll(){
    try {
      const [rows] = await db.promise().query(
        'SELECT id_turno, nombre FROM turno'
      );
      return rows;
    } catch (error) {
      throw error;
    }
    }
}