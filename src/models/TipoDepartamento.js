import db from "../database/db.js";

export class TipoDepartamento{
    static async findAll(){
    try {
      const [rows] = await db.promise().query(
        'SELECT id_tipo_departamento, nombre_departamento, descripcion FROM tipo_departamento ORDER BY id_tipo_departamento'
      );
      return rows;
    } catch (error) {
      throw error;
    }
    }
}