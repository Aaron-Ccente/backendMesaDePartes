import { Oficio } from '../models/Oficio.js';
import { Validators } from '../utils/validators.js';

export class OficioController {
  static async getAllOficios(_, res) {
    try {
      const result = await Oficio.findAll();
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  static async getOficioById(req, res) {
    try {
      const { id } = req.params;
      const result = await Oficio.findById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  static async createOficio(req, res) {
    try {
      const { mesadepartesData, ...oficioData } = req.body;

      // Validar datos de mesa de partes
      if (!mesadepartesData?.id_usuario || !mesadepartesData?.CIP || !mesadepartesData?.nombre_completo) {
        return res.status(400).json({
          success: false,
          message: "Datos del usuario de mesa de partes incompletos"
        });
      }

      // Preparar datos del oficio
      const oficioCompleto = {
        ...oficioData,
        creado_por: mesadepartesData.id_usuario,
        actualizado_por: mesadepartesData.id_usuario
      };

      // Validar datos del oficio
      const validation = Validators.validateOficioData(oficioCompleto);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Datos del oficio inválidos",
          errors: validation.errors
        });
      }

      // Intentar crear el oficio
      const result = await Oficio.create(oficioCompleto);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || "Error al crear el oficio",
          errors: result.errors
        });
      }

      return res.status(201).json({
        success: true,
        message: "Oficio creado exitosamente",
        data: {
          id_oficio: result.data.id_oficio,
          numero_oficio: oficioCompleto.numero_oficio
        }
      });

    } catch (error) {
      console.error('Error al crear oficio:', error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear el oficio"
      });
    }
  }

   static async checkNumero(req, res) {
    try {
      const { numero } = req.params;
      if (!numero || String(numero).trim() === "") {
        return res.status(400).json({ success: false, message: "Número de oficio requerido" });
      }

      const result = await Oficio.existsByNumero(numero);
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message || "Error verificando número" });
      }

      return res.json({ success: true, exists: !!result.exists });
    } catch (error) {
      console.error('Error en checkNumero:', error);
      return res.status(500).json({ success: false, message: "Error interno al verificar número de oficio" });
    }
  }
  
  static async getSeguimientoOficio(req, res) {
    try {
      const { id } = req.params;
      const result = await Oficio.getSeguimiento(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  // Obtener oficios asignados al usuario
  static async getAssignedToUser(req, res) {
    try {
      const userId = req.user?.id_usuario ?? null;
      const userCIP = req.user?.CIP ?? null;

      const result = await Oficio.findAssignedToUser({ id_usuario: userId, CIP: userCIP, excludeCompleted: true });
      if (!result.success) {
        return res.status(500).json(result);
      }
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error en getAssignedToUser:', error);
      return res.status(500).json({ success: false, message: 'Error interno al obtener oficios asignados' });
    }
  }

  // Obtener alertas de oficios con estado CREACION DEL OFICIO
  static async getAlertas(req, res) {
    try {
      const userId = req.user?.id_usuario ?? null;
      const userCIP = req.user?.CIP ?? null;

      const result = await Oficio.getCountNewOficios({ id_usuario: userId, CIP: userCIP });
      if (!result.success) {
        return res.status(500).json(result);
      }
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error en getAlertas:', error);
      return res.status(500).json({ success: false, message: 'Error interno al obtener alertas' });
    }
  }

  // actualizar seguimiento de un oficio
  static async respondToOficio(req, res) {
    try {
      const { id } = req.params;
      const { estado_nuevo, estado_anterior = null, comentario = null } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: 'ID de oficio requerido' });
      }
      if (!estado_nuevo || String(estado_nuevo).trim() === '') {
        return res.status(400).json({ success: false, message: 'Estado nuevo es requerido' });
      }

      const id_usuario = req.user?.id_usuario;
      if (!id_usuario) {
        return res.status(400).json({ success: false, message: 'Usuario no identificado' });
      }

      // Insertar seguimiento
      const seguimientoResult = await Oficio.addSeguimiento({
        id_oficio: Number(id),
        id_usuario,
        estado_anterior,
        estado_nuevo
      });

      if (!seguimientoResult.success) {
        return res.status(500).json({ success: false, message: seguimientoResult.message || 'Error al guardar seguimiento' });
      }

      return res.status(201).json({
        success: true,
        message: 'Seguimiento creado correctamente',
        data: { id_seguimiento: seguimientoResult.data.id_seguimiento }
      });
    } catch (error) {
      console.error('Error en respondToOficio:', error);
      return res.status(500).json({ success: false, message: 'Error interno al responder oficio' });
    }
  }
  /**
   * Deriva (reasigna) un oficio a un nuevo perito.
   */
  static async derivarOficio(req, res) {
    try {
      // 1. Obtener IDs de la ruta y del usuario que deriva
      const { id } = req.params; // ID del Oficio
      const id_perito_actual = req.user.id_usuario; // ID del Perito que realiza la acción

      // 2. Obtener datos del body
      const { id_nuevo_perito, nombre_seccion_destino } = req.body;

      // 3. Validar la entrada
      if (!id_nuevo_perito || !nombre_seccion_destino) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren "id_nuevo_perito" y "nombre_seccion_destino" en el body.',
        });
      }

      // 4. Llamar al modelo para ejecutar la transacción
      const result = await Oficio.reasignarPerito(
        Number(id),
        Number(id_nuevo_perito),
        Number(id_perito_actual),
        nombre_seccion_destino
      );

      if (!result.success) {
        // Si el modelo falla (sin tipo de error), devolver el error
        return res.status(404).json(result);
      }

      // 5. Devolver éxito
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error en OficioController.derivarOficio:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al derivar el oficio',
        error: error.message,
      });
    }
  }
}