import { Turnos } from "../models/Turno.js";

export class TurnoController{
    static async getAllTurnos(_, res) {
        try {
          const turnos = await Turnos.findAll();
          res.status(200).json({
            success: true,
            data: turnos,
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message,
          });
        }
      }
}