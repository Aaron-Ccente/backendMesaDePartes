import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MesaDePartes } from "../models/MesaDePartes.js";
import { Validators } from "../utils/validators.js";
import { JWT_SECRET } from "../config/config.js";

export class MesaDePartesController {
  static async login(req, res) {
    try {
      const { CIP, password_hash } = req.body;

      const validation = Validators.validateLoginCredentials({
        CIP,
        password_hash,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      // Buscar usuario por el CIP
      const mesadepartes = await MesaDePartes.findByCIP(CIP);

      if (!mesadepartes) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas"
        });
      }

      // Si el usuario esta suspendido 
      if (mesadepartes.suspended) {
        return res.status(403).json({
          success: false,
          message: mesadepartes.message
        });
      }

      // Verifica contraseña
      const isValidPassword = await bcrypt.compare(
        password_hash,
        mesadepartes.password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas"
        });
      }

      // Registrar ENTRADA si es un usuario habilitado
      await MesaDePartes.addSessionHistory(mesadepartes.id_usuario, 'ENTRADA');

      // Generar JWT
      const payload = {
        id_usuario: mesadepartes.id_usuario,
        CIP: mesadepartes.CIP,
        nombre_usuario: mesadepartes.nombre_usuario,
        nombre_completo: mesadepartes.nombre_completo,
        role: "mesadepartes",
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

      const { password_hash: _, ...userData } = mesadepartes;

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        token,
        data: userData,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }


  static async logoutMesaDePartes(req, res){
    try {
          const userId = req.user?.id_usuario || null;
          // procesar el logout pero sin operación en BD
          if (!userId) {
            console.warn('Logout sin ID de usuario - limpiando sesión del lado del cliente');
            return res.json({ 
              success: true, 
              message: 'Sesión cerrada correctamente',
              data: { logout_completed: true }
            });
          }
    
          const result = await MesaDePartes.logOutMesaDePartes({ id_usuario: userId });
          if (!result) {
            return res.status(500).json(result);
          }
          return res.json({ 
            success: true, 
            message: 'Sesión cerrada correctamente',
          });
        } catch (error) {
          console.error('Error en logOutMesaDePartes:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Error interno al realizar logout', 
            error: error.message 
          });
        }
  }

  static async createMesaDePartes(req, res){
    try {
          const mesaDePartesForm = req.body;
          
          // Validar datos del perito
          const validation = Validators.validateAdminData(mesaDePartesForm);
          if (!validation.isValid) {
            return res.status(400).json({
              success: false,
              message: validation.message
            });
          }
    
          // Crear usuario de mesa de partes
          const result = await MesaDePartes.create(mesaDePartesForm);
          res.status(201).json(result);
        } catch (error) {
          console.error('Error creando perito:', error);
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

  static async getAllMesaDePartes(req, res){
      try {
          const { page = 1, limit = 10, search } = req.query;
          const offset = (page - 1) * limit;
          
          let mesadepartes;
          let total;
          
          if (search) {
            mesadepartes = await MesaDePartes.search(search, parseInt(limit), offset);
            total = await MesaDePartes.count();
          } else {
            mesadepartes = await MesaDePartes.findAll(parseInt(limit), offset);
            total = await MesaDePartes.count();
          }
    
          // Remover contraseña
          const mesaDePartesSinPassword = mesadepartes.map(mesadepartes => {
            const { password_hash, ...mesaDePartesSinPassword } = mesadepartes;
            return mesaDePartesSinPassword;
          });
    
          res.status(200).json({
            success: true,
            data: mesaDePartesSinPassword,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / limit)
            }
          });
        } catch (error) {
          console.error('Error obteniendo usuarios de mesa de partes:', error);
          res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
          });
        }
  }

  static async updateMesaDePartes(req, res){
    try {
      const { cip } = req.params;
      const updateData = req.body;
      // Validar que el usuario de mesa de partes exista
      const existingUser = await MesaDePartes.findByCIP(cip);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario de mesa de partes no encontrado'
        });
      }

      // Actualizar el perito
      const result = await MesaDePartes.update(cip, updateData);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  static async deleteMesaDePartes(req, res){
  try {
      const { cip } = req.params;
      
      // Validar que el usuario existe
      const existingUser = await MesaDePartes.findByCIP(cip);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Perito no encontrado'
        });
      }

      // Eliminar el perito
      const result = await MesaDePartes.delete(cip);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      
      if (error.message === 'Usuario de mesa de partes no encontrado') {
        return res.status(404).json({
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

  static async getUserByCIP(req, res){
    try {
          const { cip } = req.params;
          const mesadepartes = await MesaDePartes.findByCIP(cip);
          if (!mesadepartes) {
            return res.status(404).json({
              success: false,
              message: 'Perito no encontrado'
            });
          }
    
          // Remover contraseña hasheada de la respuesta
          const { password_hash, ...mesadepartesSinPassword } = mesadepartes;
          res.status(200).json({
            success: true,
            data: mesadepartesSinPassword
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
          });
        }
  }

}
