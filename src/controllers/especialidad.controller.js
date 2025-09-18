import { Especialidad } from '../models/Especialidad.js';

export class EspecialidadController{
    static async getAllEspecialidades(_, res) {
        try {
          const especialidades = await Especialidad.findAll();
          res.status(200).json({
            success: true,
            data: especialidades
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