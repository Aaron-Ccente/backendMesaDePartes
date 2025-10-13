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
}