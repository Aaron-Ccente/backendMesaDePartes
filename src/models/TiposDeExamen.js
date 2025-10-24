import db from "../database/db.js";

export class TiposDeExamen {
  static async findAll() {
  try {
    const [rows] = await db
      .promise()
      .query(
        `SELECT 
           td.id_tipo_departamento,
           td.nombre_departamento,
           td.descripcion AS descripcion_departamento,
           COUNT(DISTINCT t.id_tipo_de_examen) AS total_examenes
         FROM tipo_departamento td
         LEFT JOIN tipo_de_examen_departamento tx ON td.id_tipo_departamento = tx.id_tipo_departamento
         LEFT JOIN tipo_de_examen t ON tx.id_tipo_de_examen = t.id_tipo_de_examen
         GROUP BY td.id_tipo_departamento
         ORDER BY td.id_tipo_departamento`
      );

    // Para cada departamento
    const departamentosConExamenes = await Promise.all(
      rows.map(async (departamento) => {
        const [examenes] = await db
          .promise()
          .query(
            `SELECT 
               t.id_tipo_de_examen,
               t.nombre,
               t.descripcion
             FROM tipo_de_examen t
             INNER JOIN tipo_de_examen_departamento tx ON t.id_tipo_de_examen = tx.id_tipo_de_examen
             WHERE tx.id_tipo_departamento = ?
             ORDER BY t.id_tipo_de_examen`,
            [departamento.id_tipo_departamento]
          );

        return {
          id_tipo_departamento: departamento.id_tipo_departamento,
          nombre_departamento: departamento.nombre_departamento,
          total_examenes: departamento.total_examenes,
          examenes: examenes
        };
      })
    );

      return departamentosConExamenes;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id_tipo_de_examen) {
    try {
      const [rows] = await db
        .promise()
        .query(
          `SELECT 
             t.id_tipo_de_examen, t.nombre, t.descripcion,
             GROUP_CONCAT(td.id_tipo_departamento) AS departamento_ids,
             GROUP_CONCAT(td.nombre_departamento) AS departamentos
           FROM tipo_de_examen t
           LEFT JOIN tipo_de_examen_departamento tx ON t.id_tipo_de_examen = tx.id_tipo_de_examen
           LEFT JOIN tipo_departamento td ON tx.id_tipo_departamento = td.id_tipo_departamento
           WHERE t.id_tipo_de_examen = ?
           GROUP BY t.id_tipo_de_examen`,
          [id_tipo_de_examen]
        );

      if (!rows.length) return null;
      const r = rows[0];
      return {
        id_tipo_de_examen: r.id_tipo_de_examen,
        nombre: r.nombre,
        descripcion: r.descripcion,
        departamento_ids: r.departamento_ids ? r.departamento_ids.split(",").map((v) => Number(v)) : [],
        departamentos: r.departamentos ? r.departamentos.split(",") : []
      };
    } catch (error) {
      throw error;
    }
  }

  static async findByName(nombre) {
    try {
      const [rows] = await db
        .promise()
        .query("SELECT id_tipo_de_examen FROM tipo_de_examen WHERE nombre = ?", [nombre]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create({ nombre, descripcion, tipo_departamento_ids = [] }) {
    try {
      if (!nombre) return { success: false, message: "nombre es requerido" };

      const existing = await this.findByName(nombre);
      if (existing.length > 0) return { success: false, message: "El tipo de examen ya existe" };

      const [result] = await db
        .promise()
        .query("INSERT INTO tipo_de_examen (nombre, descripcion) VALUES (?, ?)", [
          nombre,
          descripcion || null
        ]);

      const id = result.insertId;

      if (Array.isArray(tipo_departamento_ids) && tipo_departamento_ids.length > 0) {
        const values = tipo_departamento_ids.map((depId) => [id, depId]);
        await db
          .promise()
          .query(
            "INSERT INTO tipo_de_examen_departamento (id_tipo_de_examen, id_tipo_departamento) VALUES ?",
            [values]
          );
      }

      return { success: true, message: "Tipo de examen creado correctamente", id };
    } catch (error) {
      throw error;
    }
  }

  static async update(id_tipo_de_examen, { nombre, descripcion, tipo_departamento_ids = null }) {
    try {
      const existing = await this.findById(id_tipo_de_examen);
      if (!existing) return { success: false, message: "Tipo de examen no encontrado" };

      if (nombre && nombre !== existing.nombre) {
        const [dups] = await db
          .promise()
          .query("SELECT id_tipo_de_examen FROM tipo_de_examen WHERE nombre = ? AND id_tipo_de_examen <> ?", [
            nombre,
            id_tipo_de_examen
          ]);
        if (dups.length > 0) return { success: false, message: "Ya existe un tipo de examen con ese nombre" };
      }

      await db
        .promise()
        .query("UPDATE tipo_de_examen SET nombre = ?, descripcion = ? WHERE id_tipo_de_examen = ?", [
          nombre || existing.nombre,
          descripcion ?? existing.descripcion,
          id_tipo_de_examen
        ]);
      if (tipo_departamento_ids !== null) {
        await db
          .promise()
          .query("DELETE FROM tipo_de_examen_departamento WHERE id_tipo_de_examen = ?", [id_tipo_de_examen]);

        if (Array.isArray(tipo_departamento_ids) && tipo_departamento_ids.length > 0) {
          const values = tipo_departamento_ids.map((depId) => [id_tipo_de_examen, depId]);
          await db
            .promise()
            .query(
              "INSERT INTO tipo_de_examen_departamento (id_tipo_de_examen, id_tipo_departamento) VALUES ?",
              [values]
            );
        }
      }

      return { success: true, message: "Tipo de examen actualizado correctamente" };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id_tipo_de_examen) {
    try {
      const existing = await this.findById(id_tipo_de_examen);
      if (!existing) return { success: false, message: "Tipo de examen no encontrado" };
      await db
        .promise()
        .query("DELETE FROM tipo_de_examen_departamento WHERE id_tipo_de_examen = ?", [id_tipo_de_examen]);

      await db.promise().query("DELETE FROM tipo_de_examen WHERE id_tipo_de_examen = ?", [id_tipo_de_examen]);

      return { success: true, message: "Tipo de examen eliminado correctamente" };
    } catch (error) {
      throw error;
    }
  }

  static async findByDepartamentoId(id_tipo_departamento) {
    try {
      const [rows] = await db
        .promise()
        .query(
          `SELECT DISTINCT t.id_tipo_de_examen, t.nombre, t.descripcion
           FROM tipo_de_examen t
           JOIN tipo_de_examen_departamento tx ON t.id_tipo_de_examen = tx.id_tipo_de_examen
           WHERE tx.id_tipo_departamento = ?
           ORDER BY t.id_tipo_de_examen`,
          [id_tipo_departamento]
        );

      return rows;
    } catch (error) {
      throw error;
    }
  }
}