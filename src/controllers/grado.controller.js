
import { Grados } from "../models/Grado.js";

export class GradosController {
  static async getAllGrados(_, res) {
    try {
      const grados = await Grados.findAll();
      res.status(200).json({
        success: true,
        data: grados,
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
