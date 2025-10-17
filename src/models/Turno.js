import db from "../database/db.js";

export class Turnos {
  static async findAll() {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_turno, nombre FROM turno ORDER BY id_turno"
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id_turno) {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_turno, nombre FROM turno WHERE id_turno = ?",
        [id_turno]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async create({ nombre }) {
    try {
      if (!nombre) return { success: false, message: "nombre es requerido" };

      // evitar duplicados exactos
      const [exists] = await db.promise().query(
        "SELECT id_turno FROM turno WHERE nombre = ?",
        [nombre]
      );
      if (exists.length > 0) {
        return { success: false, message: "El turno ya existe" };
      }

      const [result] = await db.promise().query(
        "INSERT INTO turno (nombre) VALUES (?)",
        [nombre]
      );

      return { success: true, message: "Turno creado correctamente", id: result.insertId };
    } catch (error) {
      throw error;
    }
  }

  static async update(id_turno, nombre) {
    try {
      const existing = await this.findById(id_turno);
      if (!existing) return { success: false, message: "Turno no encontrado" };

      // comprobar duplicado en otro registro
      const [dups] = await db.promise().query(
        "SELECT id_turno FROM turno WHERE nombre = ? AND id_turno <> ?",
        [nombre, id_turno]
      );
      if (dups.length > 0) return { success: false, message: "Ya existe un turno con ese nombre" };

      await db.promise().query(
        "UPDATE turno SET nombre = ? WHERE id_turno = ?",
        [nombre || existing.nombre, id_turno]
      );

      return { success: true, message: "Turno actualizado correctamente" };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id_turno) {
    try {
      const existing = await this.findById(id_turno);
      if (!existing) return { success: false, message: "Turno no encontrado" };

      await db.promise().query("DELETE FROM turno WHERE id_turno = ?", [id_turno]);

      return { success: true, message: "Turno eliminado correctamente" };
    } catch (error) {
      throw error;
    }
  }
}