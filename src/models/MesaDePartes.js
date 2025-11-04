import bcrypt from "bcryptjs";
import db from "../database/db.js";

export class MesaDePartes{
    static async findByCIP(cip) {
    try {
      const [rows] = await db.promise().query(
        `SELECT us.id_usuario, us.CIP, us.nombre_completo, us.nombre_usuario, us.password_hash, r.nombre_rol, r.descripcion
        FROM usuario AS us
        INNER JOIN usuario_rol AS ur ON us.id_usuario = ur.id_usuario
        INNER JOIN rol AS r ON ur.id_rol = r.id_rol
        WHERE us.CIP = ? AND r.nombre_rol = "CENTRAL"`,
        [cip]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por CIP:', error);
      throw error;
    }
  }

  static async addSessionHistory(id_usuario, tipo_historial) {
    try {
      const [result] = await db.promise().query( 
        'INSERT INTO historial_usuario (id_usuario, tipo_historial) VALUES (?, ?)',
        [id_usuario, tipo_historial]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

    static async create(data){
    const connection = await db.promise().getConnection();
    try {
      const { CIP, nombre_usuario, password_hash, nombre_completo } = data;
      if (!CIP || !nombre_usuario || !password_hash || !nombre_completo) {
        throw new Error('Todos los campos son obligatorios');
      }
      const [existingAdmin] = await connection.query(
        'SELECT id_usuario FROM usuario WHERE CIP = ?',
        [CIP]
      );

      if (existingAdmin.length > 0) {
        throw new Error('El CIP ya está registrados');
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);
      await connection.beginTransaction();
      // Insertar el nuevo usuario de mesa de partes
      const [result] = await connection.query(
        'INSERT INTO usuario (CIP, nombre_usuario, password_hash, nombre_completo) VALUES (?, ?, ?, ?)',
        [CIP, nombre_usuario, hashedPassword, nombre_completo]
      );
      const id_usuario = result.insertId;
      // Insertar el id del usuario en la tabla de mesadepartes
      await connection.query(
        'INSERT INTO mesadepartes (id_usuario) VALUES (?)',
        [id_usuario]
      );
      // 3 es CENTRAL (rol del mesa de partes)
      await connection.query(
        'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
        [id_usuario, 3]
      );
      // Insertar estado (HABILITADO = 1 o DESHABILITADO = 2)
      await connection.query(
        'INSERT INTO estado_usuario (id_usuario, id_estado) VALUES (?, ?)',
        [id_usuario, 1]
      );
      // Confirmar transacción
      await connection.commit();
      return {
        id_usuario,
        CIP,
        nombre_usuario,
        nombre_completo
      };
    } catch (error) {
      // Rollback en caso alguna consulta falla (usuario_rol, estado_usuario)
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un registro con ese CIP o nombre de usuario');
      }
      throw new Error(`Error al crear usuario de mesa de partes: ${error.message}`);
    } finally {
      connection.release();
    }
  }

    // Logout para administradores
  static async logOutMesaDePartes({id_usuario}){
      try {
      const [result] = await db.promise().query(
        'INSERT INTO historial_usuario (id_usuario, tipo_historial) VALUES (?, ?)',
        [id_usuario, 'SALIDA']
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async search(searchTerm, limit = 10, offset = 0){
     try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await db.promise().query(
        `SELECT * 
        FROM usuario AS a 
        LEFT JOIN usuario_rol AS b ON a.id_usuario = b.id_usuario
        WHERE (a.CIP LIKE ? OR a.nombre_completo LIKE ?) 
          AND b.id_rol = 3
        ORDER BY a.nombre_completo 
        LIMIT ? OFFSET ?`,
        [searchPattern, searchPattern, limit, offset]
      );

      return rows;

    } catch (error) {
      console.error('Error buscando peritos:', error);
      throw error;
    }
  }

  static async count(){
    try {
      const [rows] = await db.promise().query('SELECT COUNT(*) as total FROM mesadepartes');
      return rows[0].total;
    } catch (error) {
      console.error('Error contando peritos:', error);
      throw error;
    }
  }

  static async findAll(limit = 10, offset = 0){
     try {
      const [rows] = await db.promise().query(
        `SELECT * 
        FROM usuario AS a
        LEFT JOIN usuario_rol AS b
        ON a.id_usuario = b.id_usuario 
        WHERE b.id_rol = 3
        ORDER BY a.nombre_completo
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error obteniendo peritos:', error);
      throw error;
    }
  }

    static async update(CIP, updateData){
      try {
      const { nombre_completo, nombre_usuario } = updateData;
      const [result] = await db.promise().query(
        'UPDATE usuario SET nombre_completo = ?, nombre_usuario = ? WHERE CIP = ?',
        [nombre_completo, nombre_usuario, CIP]
      );
      
      return {success: true, message: "Usuario actualizado correctamente"};
      } catch (error) {
        throw error;
      }
      }

    static async delete(cip){
      try {
      const [result] = await db.promise().query(
        'DELETE FROM usuario WHERE CIP = ?',
        [cip]
      );

      if (result.affectedRows === 0) {
        throw new Error('Usuario no encontrado');
      }

      return {
        success: true,
        message: 'Usuario eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
    }
}