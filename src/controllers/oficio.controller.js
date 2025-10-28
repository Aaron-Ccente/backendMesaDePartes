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
}