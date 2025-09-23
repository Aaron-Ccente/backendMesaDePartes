import db from '../database/db.js';
import bcrypt from 'bcryptjs';

export class Admin {
  // Crear un nuevo administrador
  static async create(adminData) {
    const connection = await db.promise().getConnection();
    try {
      const { CIP, nombre_usuario, password_hash, nombre_completo } = adminData;
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
      // Insertar el nuevo usuario adminstrador
      const [result] = await connection.query(
        'INSERT INTO usuario (CIP, nombre_usuario, password_hash, nombre_completo) VALUES (?, ?, ?, ?)',
        [CIP, nombre_usuario, hashedPassword, nombre_completo]
      );
      const id_usuario = result.insertId;
      // Insertar el id del usuario en la tabla de administradores.
      await connection.query(
        'INSERT INTO administrador (id_usuario) VALUES (?)',
        [id_usuario]
      );
      // 1 es ADMINISTRADOR (rol del usuario)
      await connection.query(
        'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
        [id_usuario, 1]
      );
      // Insertar estado (HABILITADO o DESHABILITADO)
      await connection.query(
        'INSERT INTO estado_usuario (id_usuario, id_estado) VALUES (?, ?)',
        [id_usuario, 1]
      );
      // Confirmar transacción si ocurre algun error
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

      throw new Error(`Error al crear administrador: ${error.message}`);
    } finally {
      connection.release();
    }
  }
  
  // Buscar administrador por CIP
  static async findByCIP(CIP) {
    try {
      const [rows] = await db.promise().query(
        'SELECT CIP, nombre_usuario, password_hash, nombre_completo FROM usuario AS us LEFT JOIN usuario_rol AS ur ON us.id_usuario = ur.id_usuario LEFT JOIN rol AS r ON ur.id_rol = r.id_rol WHERE CIP = ? AND r.nombre_rol = "ADMINISTRADOR"',
        [CIP]
      );
      
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar administrador por nombre de usuario
  static async findByUsername(NombreUsuario) {
    try {
      const [rows] = await db.promise().query(
        'SELECT CIP, nombre_usuario, password_hash, nombre_completo FROM usuario WHERE nombre_usuario = ?',
        [NombreUsuario]
      );
      
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
  
  // Verificar credenciales
  static async verifyCredentials(CIP, password_hash_compare) {
    try {
      const admin = await this.findByCIP(CIP);
      
      if (!admin) {
        return null;
      }
      
      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password_hash_compare, admin.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Retornar datos del administrador sin la contraseña
      const { password_hash, ...adminData } = admin;
      return adminData;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener todos los administradores (para administración)
  static async findAll() {
    try {
      const [rows] = await db.promise().query(
        'SELECT CIP, nombre_usuario, nombre_completo FROM usuario AS u LEFT JOIN usuario_rol AS ur ON u.id_usuario = ur.id_usuario LEFT JOIN rol AS r ON ur.id_rol = r.id_rol WHERE r.nombre_rol = "ADMINISTRADOR"'
      );
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  // Actualizar administrador
  static async update(CIP, updateData) {
    try {
      const { nombre_completo, nombre_usuario } = updateData;
      const [result] = await db.promise().query(
        'UPDATE usuario SET nombre_completo = ?, nombre_usuario = ? WHERE CIP = ?',
        [nombre_completo, nombre_usuario, CIP]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Eliminar administrador
  static async delete(CIP) {
    try {
      const [result] = await db.promise().query(
        'DELETE FROM usuario WHERE CIP = ?',
        [CIP]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}
