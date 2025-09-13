import db from "../database/db.js";


export class Grados{
    static async findAll(){
    try {
      const [rows] = await db.promise().query(
        'SELECT id_grado, nombre FROM grado ORDER BY id_grado'
      );
      return rows;
    } catch (error) {
      throw error;
    }
    }
}