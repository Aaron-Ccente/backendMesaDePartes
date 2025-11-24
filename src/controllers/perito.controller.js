import { Perito } from "../models/Perito.js";
import { Validators } from "../utils/validators.js";
import { WorkflowService } from '../services/workflowService.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config.js";

export class PeritoController {
  // Crear nuevo perito
  static async createPerito(req, res) {
    try {
      const peritoData = req.body;

      // Validar datos del perito
      const validation = Validators.validatePeritoData(peritoData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      // Crear el perito
      const result = await Perito.create(peritoData);

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creando perito:", error);

      if (
        error.message.includes("ya está registrado") ||
        error.message.includes("ya está en uso")
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener todos los peritos
  static async getAllPeritos(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      let peritos;
      let total;

      if (search) {
        peritos = await Perito.search(search, parseInt(limit), offset);
        total = await Perito.count();
      } else {
        peritos = await Perito.findAll(parseInt(limit), offset);
        total = await Perito.count();
      }

      // Remover contraseña
      const peritosSinPassword = peritos.map((perito) => {
        const { password_hash, ...peritoSinPassword } = perito;
        return peritoSinPassword;
      });

      res.status(200).json({
        success: true,
        data: peritosSinPassword,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error obteniendo peritos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }
  static async getAllPeritoAccordingToSpecialty(req, res) {
    try {
      const { id_especialidad } = req.query;
      const peritos = await Perito.findAccordingToSpecialty(id_especialidad);
      if (!peritos) {
        return res.status(404).json({
          success: false,
          message: "Peritos no encontrados",
        });
      }

      res.status(200).json({
        success: true,
        data: peritos,
      });
    } catch (error) {
      console.error("Error obteniendo peritos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async getPeritosParaAsignacion(req, res) {
    try {
      const { idTiposExamen, tipoDeIngreso } = req.query;

      const examenesIds = Array.isArray(idTiposExamen) 
        ? idTiposExamen 
        : (idTiposExamen ? [idTiposExamen] : []);

      // Para el caso de "Toma de Muestras", el flujo siempre inicia en la sección TM.
      // El examen real puede ser otro (ej. Toxicológico), pero la primera acción es la toma.
      // El ID '3' corresponde a 'Sarro Ungueal', que es el examen marcador de la sección TM.
      // Si el tipo de ingreso es TM, nos aseguramos de que la lógica de prioridad empiece por ahí.
      const finalExamenesIds = tipoDeIngreso === 'TOMA DE MUESTRAS' 
        ? [...new Set([...examenesIds, '3'])] 
        : examenesIds;

      if (finalExamenesIds.length === 0) {
        return res.json({ success: true, data: [] });
      }
      
      const peritosDisponibles = await WorkflowService.determinarAsignacionInicial(finalExamenesIds);
      
      res.status(200).json({ success: true, data: peritosDisponibles });

    } catch (error) {
      console.error("Error en getPeritosParaAsignacion:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener perito por CIP
  static async getPeritoByCIP(req, res) {
    try {
      const { cip } = req.params;
      const perito = await Perito.findByCIP(cip);
      if (!perito) {
        return res.status(404).json({
          success: false,
          message: "Perito no encontrado",
        });
      }

      // Remover contraseña hasheada de la respuesta
      const { password_hash, ...peritoSinPassword } = perito;
      res.status(200).json({
        success: true,
        data: peritoSinPassword,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Actualizar perito
  static async updatePerito(req, res) {
    try {
      const { cip } = req.params;
      const updateData = req.body;
      // Validar que el perito existe
      const existingPerito = await Perito.findByCIPPerito(cip);
      if (!existingPerito) {
        return res.status(404).json({
          success: false,
          message: "Perito no encontrado",
        });
      }

      // Validar datos de actualización
      const validation = Validators.validatePeritoUpdateData(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      // Actualizar el perito
      const result = await Perito.update(cip, updateData);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error actualizando perito:", error);

      if (error.message === "Perito no encontrado") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Eliminar perito
  static async deletePerito(req, res) {
    try {
      const { cip } = req.params;

      // Validar que el perito existe
      const existingPerito = await Perito.findByCIP(cip);
      if (!existingPerito) {
        return res.status(404).json({
          success: false,
          message: "Perito no encontrado",
        });
      }

      // Eliminar el perito
      const result = await Perito.delete(cip);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error eliminando perito:", error);

      if (error.message === "Perito no encontrado") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Logout de perito
  static async logoutPerito(req, res) {
    try {
      const userId = req.user?.id_usuario || null;
      // procesar el logout pero sin operación en BD
      if (!userId) {
        console.warn(
          "Logout sin ID de usuario - limpiando sesión del lado del cliente"
        );
        return res.json({
          success: true,
          message: "Sesión cerrada correctamente",
          data: { logout_completed: true },
        });
      }

      const result = await Perito.logOutPerito({ id_usuario: userId });
      if (!result) {
        return res.status(500).json(result);
      }
      return res.json({
        success: true,
        message: "Sesión cerrada correctamente",
      });
    } catch (error) {
      console.error("Error en logoutPerito:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al realizar logout",
        error: error.message,
      });
    }
  }

  // Cambiar contraseña de perito
  static async changePeritoPassword(req, res) {
    try {
      const { cip } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La nueva contraseña debe tener al menos 6 caracteres",
        });
      }

      // Validar que el perito existe
      const existingPerito = await Perito.findByCIP(cip);
      if (!existingPerito) {
        return res.status(404).json({
          success: false,
          message: "Perito no encontrado",
        });
      }

      // Cambiar contraseña
      const result = await Perito.changePassword(cip, newPassword);

      res.status(200).json(result);
    } catch (error) {
      if (error.message === "Perito no encontrado") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener estadísticas de peritos
  static async getPeritosStats(_, res) {
    try {
      const stats = await Perito.getStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Login de perito (ahora genera JWT)
  static async loginPerito(req, res) {
    try {
      const { CIP, password_hash } = req.body;
      if (!CIP || !password_hash) {
        return res.status(400).json({
          success: false,
          message: "CIP y contraseña son requeridos",
        });
      }

      // Buscar perito por CIP
      const perito = await Perito.findByCIPPerito(CIP);
      if (!perito) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Si está suspendido, detener proceso y mostrar mensaje formateado
      const peritoStatus = await Perito.checkIfSuspended(CIP);
      if (peritoStatus.suspended) {
        return res.status(403).json({
          success: false,
          message: peritoStatus.message,
        });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(
        password_hash,
        perito.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }
      // Agregar estado de ENTRADA para su historial de sesiones
      await Perito.addSessionHistory(perito.id_usuario, "ENTRADA");

      const { password_hash: _, ...peritoSinPassword } = perito;

      // Generar JWT (24h)
      const payload = {
        id_usuario: perito.id_usuario,
        CIP: perito.CIP,
        nombre_usuario: perito.nombre_usuario,
        nombre_completo: perito.nombre_completo,
        role: "perito",
        id_seccion: perito.id_seccion,
        seccion_nombre: perito.seccion_nombre, // <-- Añadir la sección al payload
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        token,
        data: peritoSinPassword,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async getAllRelations(req, res) {
    try {
      const { cip } = req.params;
      if (!cip) {
        return res.status(400).json({
          success: false,
          message: "cip es requerido requeridos",
        });
      }

      // Buscar relaciones del perito por CIP
      const perito = await Perito.findAllRelations(cip);

      if (!perito) {
        return res.status(200).json({
          success: false,
          message:
            "El perito no tiene especialidades, grados, secciones o un departamento",
        });
      } else {
        return res.status(200).json({
          message: "Datos de las relaciones del perito cargados correctamente",
          success: true,
          data: perito,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }
  // Obtiene la carga de trabajo de los peritos por sección
  static async getCargaTrabajoPorSeccion(req, res) {
    try {
      // 1. Obtener el ID de la sección desde los query params (ej: /api/peritos/carga?seccion=6)
      const { seccion } = req.query;
      if (!seccion || isNaN(Number(seccion))) {
        return res.status(400).json({
          success: false,
          message: "Se requiere un ID de sección numérico (ej: ?seccion=6)",
        });
      }

      // 2. Llamar a la nueva función del modelo
      const result = await Perito.findCargaTrabajoPorSeccion(Number(seccion));

      if (!result.success) {
         // Esto es por si el modelo mismo devuelve un error de lógica (aunque el nuestro no lo hace)
         return res.status(500).json(result);
      }

      // 3. Devolver los datos
      return res.status(200).json({
        success: true,
        data: result.data,
      });

    } catch (error) {
      console.error('Error en getCargaTrabajoPorSeccion:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener la carga de trabajo',
        error: error.message,
      });
    }
  }
}
