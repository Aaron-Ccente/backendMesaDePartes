import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { JWT_SECRET } from '../config/config.js';

export class AuthService {
  // Generar token JWT
  static generateToken(adminData) {
    const payload = {
      CIP: adminData.CIP,
      nombre_usuario: adminData.nombre_usuario,
      nombre_completo: adminData.nombre_completo,
      role: 'admin'
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }
  
  // Verificar token JWT
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }
  
  // Login de administrador
  static async loginAdmin(credentials) {
    try {
      const { CIP, password_hash } = credentials;
      
      // Validar campos requeridos
      if (!CIP || !password_hash) {
        throw new Error('CIP y contraseña son requeridos');
      }
      
      // Verificar credenciales
      const admin = await Admin.verifyCredentials(CIP, password_hash);
      
      if (!admin) {
        throw new Error('Credenciales inválidas');
      }
      
      // Generar token JWT
      const token = this.generateToken(admin);
      
      return {
        success: true,
        message: 'Login exitoso',
        token,
        admin: {
          CIP: admin.CIP,
          nombre_usuario: admin.nombre_usuario,
          nombre_completo: admin.nombre_completo
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Registro de administrador
  static async registerAdmin(adminData) {
    try {
      const { CIP, nombre_usuario, password_hash, nombre_completo } = adminData;
      
      // Validar campos requeridos
      if (!CIP || !nombre_usuario || !password_hash || !nombre_completo) {
        throw new Error('Todos los campos son requeridos');
      }
      
      // Validar longitud mínima de contraseña
      if (password_hash.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      // Crear el administrador
      const newAdmin = await Admin.create(adminData);
      
      return {
        success: true,
        message: 'Administrador registrado exitosamente',
        admin: newAdmin
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Verificar si el token es válido
  static async validateToken(token) {
    try {
      if (!token) {
        throw new Error('Token no proporcionado');
      }
      
      // Verificar el token
      const decoded = this.verifyToken(token);
      
      // Verificar que el administrador aún existe en la base de datos
      const admin = await Admin.findByCIP(decoded.CIP);
      
      if (!admin) {
        throw new Error('Administrador no encontrado');
      }
      
      return {
        success: true,
        admin: {
          CIP: admin.CIP,
          NombreUsuario: admin.NombreUsuario,
          Nombre: admin.Nombre
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener información del administrador autenticado
  static async getAdminInfo(token) {
    try {
      const validation = await this.validateToken(token);
      return validation;
    } catch (error) {
      throw error;
    }
  }
}
