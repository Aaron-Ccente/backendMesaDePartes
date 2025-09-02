import db from '../database/db.js';
import bcrypt from 'bcryptjs';

export class Admin {
  // Crear un nuevo administrador
  static async create(adminData) {
    try {
      const { CIP, nombre_usuario, password_hash, nombres } = adminData;
      
      // Verificar si el CIP ya existe
      const [existingAdmin] = await db.promise().query(
        'SELECT CIP FROM administradores WHERE CIP = ?',
        [CIP]
      );
      
      if (existingAdmin.length > 0) {
        throw new Error('El CIP ya está registrado');
      }
      
      // Encriptar la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);
      
      // Insertar el nuevo administrador
      const [result] = await db.promise().query(
        'INSERT INTO administradores (CIP, nombre_usuario, password_hash, nombres) VALUES (?, ?, ?, ?)',
        [CIP, nombre_usuario, hashedPassword, nombres]
      );
      
      return {
        id: result.insertId,
        CIP,
        nombre_usuario,
        nombres
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar administrador por CIP
  static async findByCIP(CIP) {
    try {
      const [rows] = await db.promise().query(
        'SELECT CIP, nombre_usuario, password_hash, nombres FROM administradores WHERE CIP = ?',
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
        'SELECT CIP, nombre_usuario, password_hash, nombres FROM administradores WHERE nombre_usuario = ?',
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
        'SELECT CIP, nombre_usuario, nombres FROM administradores'
      );
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  // Actualizar administrador
  static async update(CIP, updateData) {
    try {
      const { nombre_usuario, nombres } = updateData;
      
      // Verificar si el nombre de usuario ya existe en otro administrador
      if (nombre_usuario) {
        const [existingUsername] = await db.promise().query(
          'SELECT CIP FROM administradores WHERE nombre_usuario = ? AND CIP != ?',
          [nombre_usuario, CIP]
        );
        
        if (existingUsername.length > 0) {
          throw new Error('El nombre de usuario ya está en uso');
        }
      }
      
      const [result] = await db.promise().query(
        'UPDATE administradores SET nombre_usuario = ?, nombres = ? WHERE CIP = ?',
        [nombre_usuario, nombres, CIP]
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
        'DELETE FROM administradores WHERE CIP = ?',
        [CIP]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}
