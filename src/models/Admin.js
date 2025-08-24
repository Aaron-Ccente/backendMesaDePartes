import db from '../database/db.js';
import bcrypt from 'bcryptjs';

export class Admin {
  // Crear un nuevo administrador
  static async create(adminData) {
    try {
      const { CIP, NombreUsuario, Contrasena, Nombre } = adminData;
      
      // Verificar si el CIP ya existe
      const [existingAdmin] = await db.promise().query(
        'SELECT CIP FROM Administrador WHERE CIP = ?',
        [CIP]
      );
      
      if (existingAdmin.length > 0) {
        throw new Error('El CIP ya está registrado');
      }
      
      // Verificar si el nombre de usuario ya existe
      const [existingUsername] = await db.promise().query(
        'SELECT NombreUsuario FROM Administrador WHERE NombreUsuario = ?',
        [NombreUsuario]
      );
      
      if (existingUsername.length > 0) {
        throw new Error('El nombre de usuario ya está en uso');
      }
      
      // Encriptar la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(Contrasena, saltRounds);
      
      // Insertar el nuevo administrador
      const [result] = await db.promise().query(
        'INSERT INTO Administrador (CIP, NombreUsuario, Contrasena, Nombre) VALUES (?, ?, ?, ?)',
        [CIP, NombreUsuario, hashedPassword, Nombre]
      );
      
      return {
        id: result.insertId,
        CIP,
        NombreUsuario,
        Nombre
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar administrador por CIP
  static async findByCIP(CIP) {
    try {
      const [rows] = await db.promise().query(
        'SELECT CIP, NombreUsuario, Contrasena, Nombre FROM Administrador WHERE CIP = ?',
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
        'SELECT CIP, NombreUsuario, Contrasena, Nombre FROM Administrador WHERE NombreUsuario = ?',
        [NombreUsuario]
      );
      
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
  
  // Verificar credenciales
  static async verifyCredentials(CIP, contrasena) {
    try {
      const admin = await this.findByCIP(CIP);
      
      if (!admin) {
        return null;
      }
      
      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(contrasena, admin.Contrasena);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Retornar datos del administrador sin la contraseña
      const { Contrasena, ...adminData } = admin;
      return adminData;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener todos los administradores (para administración)
  static async findAll() {
    try {
      const [rows] = await db.promise().query(
        'SELECT CIP, NombreUsuario, Nombre FROM Administrador'
      );
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  // Actualizar administrador
  static async update(CIP, updateData) {
    try {
      const { NombreUsuario, Nombre } = updateData;
      
      // Verificar si el nombre de usuario ya existe en otro administrador
      if (NombreUsuario) {
        const [existingUsername] = await db.promise().query(
          'SELECT CIP FROM Administrador WHERE NombreUsuario = ? AND CIP != ?',
          [NombreUsuario, CIP]
        );
        
        if (existingUsername.length > 0) {
          throw new Error('El nombre de usuario ya está en uso');
        }
      }
      
      const [result] = await db.promise().query(
        'UPDATE Administrador SET NombreUsuario = ?, Nombre = ? WHERE CIP = ?',
        [NombreUsuario, Nombre, CIP]
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
        'DELETE FROM Administrador WHERE CIP = ?',
        [CIP]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}
