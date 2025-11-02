import { Admin } from '../models/Admin.js';
import { AuthService } from '../services/authService.js';
import { Validators } from '../utils/validators.js';

export class AuthController {
  // Login de administrador
  static async loginAdmin(req, res) {
    try {
      const { CIP, password_hash } = req.body;
      const validation = Validators.validateLoginCredentials({ CIP, password_hash });
      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const result = await AuthService.loginAdmin({ CIP, password_hash });
      return res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }
      return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  }

 // LogOut de un usuario administrador
  static async logoutAdmin(req, res){
    try {
      const userId = req.admin?.id_usuario || req.user?.id_usuario || null;
      // procesar el logout pero sin operación en BD
      if (!userId) {
        console.warn('Logout sin ID de usuario - limpiando sesión del lado del cliente');
        return res.json({ 
          success: true, 
          message: 'Sesión cerrada correctamente',
          data: { logout_completed: true }
        });
      }

      const result = await Admin.logOutAdmin({ id_usuario: userId });
      if (!result) {
        return res.status(500).json(result);
      }
      return res.json({ 
        success: true, 
        message: 'Sesión cerrada correctamente',
      });
    } catch (error) {
      console.error('Error en logoutAdmin:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno al realizar logout', 
        error: error.message 
      });
    }
  }

  // Registro de administrador (puede estar protegida si solo admins crean admins)
  static async registerAdmin(req, res) {
    try {
      const { CIP, nombre_usuario, password_hash, nombre_completo } = req.body;
      const validation = Validators.validateAdminData({ CIP, nombre_usuario, password_hash, nombre_completo });

      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const result = await AuthService.registerAdmin({ CIP, nombre_usuario, password_hash, nombre_completo });
      return res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('ya está registrado') || error.message.includes('ya está en uso')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  // Obtener lista de administradores (paginado)
  static async getAllAdmins(req, res) {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 50;

      const data = await AuthService.getAllAdmins(pageNum, limitNum, search);

      // Espera que AuthService devuelva { success, data, pagination }
      return res.status(200).json({
        success: true,
        data: data.data ?? data,
        pagination: data.pagination ?? {
          page: pageNum,
          limit: limitNum,
          total: Array.isArray(data.data) ? data.data.length : (data.total ?? 0),
          pages: data.pagination?.pages ?? 1
        }
      });
    } catch (error) {
      console.error('Error getAllAdmins:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  // Obtener admin por CIP
  static async getAdminByCIP(req, res) {
    try {
      const { cip } = req.params;
      const admin = await AuthService.getAdminByCIP(cip);

      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
      }

      return res.status(200).json({ success: true, data: admin.data ?? admin });
    } catch (error) {
      console.error('Error getAdminByCIP:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  // Crear administrador (protegido)
  static async createAdmin(req, res) {
    try {
      const { CIP, nombre_usuario, password_hash, nombre_completo } = req.body;
      const validation = Validators.validateAdminData({ CIP, nombre_usuario, password_hash, nombre_completo });

      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      const result = await AuthService.registerAdmin({ CIP, nombre_usuario, password_hash, nombre_completo });
      return res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('ya está registrado') || error.message.includes('ya está en uso')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      console.error('Error createAdmin:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  // Actualizar administrador
  static async updateAdmin(req, res) {
    try {
      const { cip } = req.params;
      const updateData = req.body;

      const result = await AuthService.updateAdmin(cip, updateData);

      if (!result) {
        return res.status(404).json({ success: false, message: 'Administrador no encontrado o no actualizado' });
      }

      return res.status(200).json({ success: true, message: 'Administrador actualizado correctamente' });
    } catch (error) {
      console.error('Error updateAdmin:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  // Eliminar administrador
  static async deleteAdmin(req, res) {
    try {
      const { cip } = req.params;
      const result = await AuthService.deleteAdmin(cip);

      if (!result) {
        return res.status(404).json({ success: false, message: 'Administrador no encontrado o no eliminado' });
      }

      return res.status(200).json({ success: true, message: 'Administrador eliminado correctamente' });
    } catch (error) {
      console.error('Error deleteAdmin:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  // Verificar token
  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
      }

      const result = await AuthService.validateToken(token);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  // Obtener información del administrador autenticado
  static async getAdminInfo(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
      }

      const result = await AuthService.getAdminInfo(token);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }
}
