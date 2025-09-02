import { AuthService } from '../services/authService.js';
import { Validators } from '../utils/validators.js';

export class AuthController {
  // Login de administrador
  static async loginAdmin(req, res) {
    try {
      const { CIP, Contrasena } = req.body;
      // Validar credenciales
      const validation = Validators.validateLoginCredentials({ CIP, Contrasena });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
    
      // Procesar el login
      const result = await AuthService.loginAdmin({ CIP, contrasena: Contrasena });
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  // Registro de administrador
  static async registerAdmin(req, res) {
    try {
      const { CIP, nombre_usuario, password_hash, nombres, estado } = req.body;
      // Validar datos
      const validation = Validators.validateAdminData({
        CIP,
        nombre_usuario,
        password_hash,
        nombres,
        estado
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
      
      // Procesar el registro
      const result = await AuthService.registerAdmin({
        CIP,
        nombre_usuario,
        password_hash,
        nombres,
        estado
      });
      
      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('ya está registrado') || error.message.includes('ya está en uso')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Verificar token
  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }
      
      const result = await AuthService.validateToken(token);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Obtener información del administrador autenticado
  static async getAdminInfo(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }
      
      const result = await AuthService.getAdminInfo(token);
      
      res.status(200).json(result);
    } catch (error) {  
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }
}
