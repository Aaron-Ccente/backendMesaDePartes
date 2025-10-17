import { Prioridad } from "../models/Prioridad.js";

export class PrioridadController {
    static async getAllTypesOfPriority(_, res) {
        try {
          const prioridades = await Prioridad.findAll();
          res.status(200).json({
            success: true,
            data: prioridades
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
          });
        }
    }

    static async getPrioridad(req, res) {
      try {
        const { id } = req.params;
        const prioridad = await Prioridad.findById(id);
        if (!prioridad) {
          return res.status(404).json({ success: false, message: 'Prioridad no encontrada' });
        }
        res.status(200).json({ success: true, data: prioridad });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: error.message
        });
      }
    }

    static async createPriority(req, res){
      try {
        const { nombre_prioridad } = req.body;
        if (!nombre_prioridad) {
          return res.status(400).json({ success: false, message: "nombre_prioridad es requerido" });
        }
          const prioridades = await Prioridad.create(nombre_prioridad);
          if (prioridades.success === false) {
            return res.status(409).json(prioridades);
          }
          res.status(201).json({
            success: true,
            message: prioridades.message || "Prioridad creada correctamente"
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
          });
        }
    }

    static async updatePriority(req, res) {
      try {
        const { id } = req.params;
        const { nombre_prioridad } = req.body;
        if (!nombre_prioridad) {
          return res.status(400).json({ success: false, message: "nombre_prioridad es requerido" });
        }

        const result = await Prioridad.update(id, nombre_prioridad);
        if (result.success === false) {
          if (result.message.includes('no encontrada')) {
            return res.status(404).json(result);
          }
          if (result.message.includes('Ya existe')) {
            return res.status(409).json(result);
          }
          return res.status(400).json(result);
        }

        return res.status(200).json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: error.message
        });
      }
    }

    static async deletePriority(req, res) {
      try {
        const { id } = req.params;
        const result = await Prioridad.delete(id);
        if (result.success === false) {
          if (result.message.includes('no encontrada')) {
            return res.status(404).json(result);
          }
          return res.status(400).json(result);
        }
        return res.status(200).json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: error.message
        });
      }
    }

}