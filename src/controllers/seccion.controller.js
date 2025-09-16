import { Section } from "../models/Seccion.js";

export class SectionController {
  static async getSectionById(req, res) {
    // id del tipo de departamento
    const { id } = req.query;
    try {
      const secciones = await Section.findSectionByIdTypeDepartament(id);
      res.status(200).json({
        success: true,
        data: secciones,
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
