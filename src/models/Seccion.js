import db from "../database/db.js";

export class Section {
  static async findSectionByIdTypeDepartament(id_tipo_departamento) {
    try {
      const [rows] = await db
        .promise()
        .query(
          "SELECT * FROM seccion AS a INNER JOIN tipo_departamento_seccion AS b ON a.id_seccion = b.id_seccion WHERE b.id_tipo_departamento = ?",[id_tipo_departamento]
        );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}
