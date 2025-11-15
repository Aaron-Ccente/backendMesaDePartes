import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { JWT_SECRET } from '../config/config.js';

export class AuthService {
  static generateToken(adminData) {
    const payload = {
      id_usuario: adminData.id_usuario,
      CIP: adminData.CIP,
      nombre_usuario: adminData.nombre_usuario,
      nombre_completo: adminData.nombre_completo,
      role: 'admin'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  static async loginAdmin(credentials) {
    try {
      const { CIP, password_hash } = credentials;
      if (!CIP || !password_hash) throw new Error('CIP y contraseña son requeridos');

      const admin = await Admin.verifyCredentials(CIP, password_hash);
      if (!admin) throw new Error('Credenciales inválidas');
      if (admin.suspended) throw new Error(admin.message);
      
      const token = this.generateToken(admin);
      return {
        success: true,
        message: 'Login exitoso',
        token,
        admin: {
          id_usuario: admin.id_usuario,
          CIP: admin.CIP,
          nombre_usuario: admin.nombre_usuario,
          nombre_completo: admin.nombre_completo
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async registerAdmin(adminData) {
    try {
      const { CIP, nombre_usuario, password_hash, nombre_completo } = adminData;
      if (!CIP || !nombre_usuario || !password_hash || !nombre_completo) {
        throw new Error('Todos los campos son requeridos');
      }
      if (password_hash.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

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

  // LISTAR administradores (paginado + búsqueda)
  static async getAllAdmins(page = 1, limit = 50, search = '') {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 50;
      const offset = (pageNum - 1) * limitNum;
      if (typeof Admin.findAll === 'function') {
        try {
          const result = await Admin.findAll({ offset, limit: limitNum, search });
          if (Array.isArray(result)) {
            const total = result.length;
            const pages = Math.max(1, Math.ceil(total / limitNum));
            return { data: result, pagination: { page: pageNum, limit: limitNum, total, pages } };
          }
          if (result && Array.isArray(result.rows)) {
            const total = result.total ?? result.rows.length;
            const pages = Math.max(1, Math.ceil(total / limitNum));
            return { data: result.rows, pagination: { page: pageNum, limit: limitNum, total, pages } };
          }
        } catch (err) {
          console.warn('AuthService.getAllAdmins: Admin.findAll(options) falló, intentando findAll simple', err.message);
        }
      }

      if (typeof Admin.findAll === 'function') {
        const rows = await Admin.findAll();
        const filtered = Array.isArray(rows)
          ? (search ? rows.filter(r => (r.CIP + r.nombre_usuario + r.nombre_completo).toLowerCase().includes(search.toLowerCase())) : rows)
          : [];
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / limitNum));
        const paged = filtered.slice(offset, offset + limitNum);
        return { data: paged, pagination: { page: pageNum, limit: limitNum, total, pages } };
      }


      return { data: [], pagination: { page: pageNum, limit: limitNum, total: 0, pages: 1 } };
    } catch (error) {
      throw new Error('Error en getAllAdmins: ' + error.message);
    }
  }

  static async getAdminByCIP(cip) {
    try {
      if (!cip) throw new Error('CIP requerido');
      if (typeof Admin.findByCIP !== 'function') throw new Error('Admin.findByCIP no implementado');

      const admin = await Admin.findbyCIP(cip);
      if (!admin) return null;
      return {
        CIP: admin.CIP,
        nombre_usuario: admin.nombre_usuario ?? admin.NombreUsuario,
        nombre_completo: admin.nombre_completo ?? admin.Nombre
      };
    } catch (error) {
      throw new Error('Error en getAdminByCIP: ' + error.message);
    }
  }

  static async updateAdmin(cip, adminData) {
    try {
      if (!cip) throw new Error('CIP requerido');
      if (typeof Admin.update !== 'function') throw new Error('Admin.update no implementado');

      const updated = await Admin.update(cip, adminData);
      return updated;
    } catch (error) {
      throw new Error('Error en updateAdmin: ' + error.message);
    }
  }

  static async deleteAdmin(cip) {
    try {
      if (!cip) throw new Error('CIP requerido');
      if (typeof Admin.delete !== 'function') throw new Error('Admin.delete no implementado');

      const deleted = await Admin.delete(cip);
      return deleted;
    } catch (error) {
      throw new Error('Error en deleteAdmin: ' + error.message);
    }
  }

  static async enableDisableUser({ id_estado, id_usuario, motivo }) {
    try {
      if (!id_usuario) throw new Error('ID de usuario requerido');
      if (typeof Admin.enableDisable !== 'function') throw new Error('Admin.enableDisable no implementado');

      const result = await Admin.enableDisable({ id_estado, id_usuario, motivo });
      return result;
    } catch (error) {
      throw new Error('Error en enableDisableUser: ' + error.message);
    }
  }

  static async validateToken(token) {
    try {
      if (!token) throw new Error('Token no proporcionado');
      const decoded = this.verifyToken(token);
      const admin = typeof Admin.findByCIP === 'function' ? await Admin.findByCIP(decoded.CIP) : null;
      if (!admin) throw new Error('Administrador no encontrado');
      return {
        success: true,
        admin: {
          CIP: admin.CIP,
          nombre_usuario: admin.nombre_usuario ?? admin.NombreUsuario,
          nombre_completo: admin.nombre_completo ?? admin.Nombre
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async getAdminInfo(token) {
    try {
      const validation = await this.validateToken(token);
      return validation;
    } catch (error) {
      throw error;
    }
  }
}
