import db from "../database/db.js";

export class TipoDepartamento {
  static async findAll() {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_tipo_departamento, nombre_departamento, descripcion FROM tipo_departamento ORDER BY id_tipo_departamento"
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id_tipo_departamento) {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_tipo_departamento, nombre_departamento, descripcion FROM tipo_departamento WHERE id_tipo_departamento = ?",
        [id_tipo_departamento]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async searchByName(nombre_departamento) {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_tipo_departamento FROM tipo_departamento WHERE nombre_departamento = ?",
        [nombre_departamento]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create({ nombre_departamento, descripcion }) {
    try {
      if (!nombre_departamento) {
        return { success: false, message: "nombre_departamento es requerido" };
      }

      const existing = await this.searchByName(nombre_departamento);
      if (existing.length > 0) {
        return { success: false, message: "Ya existe el tipo de departamento ingresado." };
      }

      const [result] = await db.promise().query(
        "INSERT INTO tipo_departamento (nombre_departamento, descripcion) VALUES (?, ?)",
        [nombre_departamento, descripcion || null]
      );

      return { success: true, message: "Tipo de departamento creado correctamente", id: result.insertId };
    } catch (error) {
      throw error;
    }
  }

  static async update(id_tipo_departamento, { nombre_departamento, descripcion }) {
    try {
      const existing = await this.findById(id_tipo_departamento);
      if (!existing) {
        return { success: false, message: "Tipo de departamento no encontrado" };
      }

      // comprobar duplicado en otro registro
      const [dups] = await db.promise().query(
        "SELECT id_tipo_departamento FROM tipo_departamento WHERE nombre_departamento = ? AND id_tipo_departamento <> ?",
        [nombre_departamento, id_tipo_departamento]
      );
      if (dups.length > 0) {
        return { success: false, message: "Ya existe el tipo de departamento ingresado." };
      }

      await db.promise().query(
        "UPDATE tipo_departamento SET nombre_departamento = ?, descripcion = ? WHERE id_tipo_departamento = ?",
        [nombre_departamento || existing.nombre_departamento, descripcion ?? existing.descripcion, id_tipo_departamento]
      );

      return { success: true, message: "Tipo de departamento actualizado correctamente" };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id_tipo_departamento) {
    try {
      const existing = await this.findById(id_tipo_departamento);
      if (!existing) {
        return { success: false, message: "Tipo de departamento no encontrado" };
      }

      await db.promise().query("DELETE FROM tipo_departamento WHERE id_tipo_departamento = ?", [
        id_tipo_departamento,
      ]);

      return { success: true, message: "Tipo de departamento eliminado correctamente" };
    } catch (error) {
      throw error;
    }
  }
}