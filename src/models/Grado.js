import db from "../database/db.js";

export class Grados {
  static async findAll() {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_grado, nombre FROM grado ORDER BY id_grado"
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id_grado) {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_grado, nombre FROM grado WHERE id_grado = ?",
        [id_grado]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByName(nombre) {
    try {
      const [rows] = await db.promise().query(
        "SELECT id_grado FROM grado WHERE nombre = ?",
        [nombre]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create({ nombre }) {
    try {
      if (!nombre) return { success: false, message: "nombre es requerido" };

      const existing = await this.findByName(nombre);
      if (existing.length > 0) {
        return { success: false, message: "El grado ya existe" };
      }

      const [result] = await db.promise().query(
        "INSERT INTO grado (nombre) VALUES (?)",
        [nombre]
      );

      return { success: true, message: "Grado creado correctamente", id: result.insertId };
    } catch (error) {
      throw error;
    }
  }

  static async update(id_grado, nombre) {
    try {
      const existing = await this.findById(id_grado);
      if (!existing) return { success: false, message: "Grado no encontrado" };

      const [dups] = await db.promise().query(
        "SELECT id_grado FROM grado WHERE nombre = ? AND id_grado <> ?",
        [nombre, id_grado]
      );
      if (dups.length > 0) return { success: false, message: "Ya existe un grado con ese nombre" };

      await db.promise().query(
        "UPDATE grado SET nombre = ? WHERE id_grado = ?",
        [nombre || existing.nombre, id_grado]
      );

      return { success: true, message: "Grado actualizado correctamente" };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id_grado) {
    try {
      const existing = await this.findById(id_grado);
      if (!existing) return { success: false, message: "Grado no encontrado" };

      await db.promise().query("DELETE FROM grado WHERE id_grado = ?", [id_grado]);

      return { success: true, message: "Grado eliminado correctamente" };
    } catch (error) {
      throw error;
    }
  }
}