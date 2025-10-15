import db from "../database/db.js";

export class Prioridad {
    static async findAll() {
    try {
      const [rows] = await db.promise().query(
        'SELECT id_prioridad, nombre_prioridad FROM tipos_prioridad ORDER BY id_prioridad'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

 static async create(nombre_prioridad) {
  try {
    const findPriority = await this.searchPriority(nombre_prioridad);
    
    if (findPriority.success === false) {
      return findPriority;
    }

    await db.promise().query(
      'INSERT INTO tipos_prioridad (nombre_prioridad) VALUES (?)',
      [nombre_prioridad]
    );

    return { success: true, message: "Prioridad creada correctamente" };

  } catch (error) {
    console.error("Error al crear prioridad:", error);
    throw error;
  }
}

static async searchPriority(nombre_prioridad) {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM tipos_prioridad WHERE nombre_prioridad = ?',
      [nombre_prioridad]
    );

    if (rows.length > 0) {
      return { success: false, message: "Ya existe la prioridad ingresada." };
    }

    return { success: true };

  } catch (error) {
    console.error("Error al buscar prioridad:", error);
    throw error;
  }
}

static async findById(id_prioridad) {
  try {
    const [rows] = await db.promise().query(
      'SELECT id_prioridad, nombre_prioridad FROM tipos_prioridad WHERE id_prioridad = ?',
      [id_prioridad]
    );
    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error("Error al buscar prioridad por id:", error);
    throw error;
  }
}

static async update(id_prioridad, nombre_prioridad) {
  try {
    const existing = await this.findById(id_prioridad);
    if (!existing) {
      return { success: false, message: "Prioridad no encontrada" };
    }

    // Verificar duplicado
    const [dups] = await db.promise().query(
      'SELECT id_prioridad FROM tipos_prioridad WHERE nombre_prioridad = ? AND id_prioridad <> ?',
      [nombre_prioridad, id_prioridad]
    );
    if (dups.length > 0) {
      return { success: false, message: "Ya existe la prioridad ingresada." };
    }

    await db.promise().query(
      'UPDATE tipos_prioridad SET nombre_prioridad = ? WHERE id_prioridad = ?',
      [nombre_prioridad, id_prioridad]
    );

    return { success: true, message: "Prioridad actualizada correctamente" };
  } catch (error) {
    console.error("Error al actualizar prioridad:", error);
    throw error;
  }
}

static async delete(id_prioridad) {
  try {
    const existing = await this.findById(id_prioridad);
    if (!existing) {
      return { success: false, message: "Prioridad no encontrada" };
    }

    await db.promise().query(
      'DELETE FROM tipos_prioridad WHERE id_prioridad = ?',
      [id_prioridad]
    );

    return { success: true, message: "Prioridad eliminada correctamente" };
  } catch (error) {
    console.error("Error al eliminar prioridad:", error);
    throw error;
  }
}
}