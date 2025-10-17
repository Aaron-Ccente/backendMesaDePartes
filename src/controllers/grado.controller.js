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

  static async getGradoById(req, res) {
    try {
      const { id } = req.params;
      const grado = await Grados.findById(id);
      if (!grado) return res.status(404).json({ success: false, message: "Grado no encontrado" });
      return res.status(200).json({ success: true, data: grado });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async createGrado(req, res) {
    try {
      const { nombre } = req.body;
      const result = await Grados.create({ nombre });
      if (result.success === false) {
        return res.status(409).json(result);
      }
      return res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async updateGrado(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const result = await Grados.update(id, nombre);
      if (result.success === false) {
        if (result.message.includes("no encontrado")) return res.status(404).json(result);
        if (result.message.includes("Ya existe")) return res.status(409).json(result);
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async deleteGrado(req, res) {
    try {
      const { id } = req.params;
      const result = await Grados.delete(id);
      if (result.success === false) {
        if (result.message.includes("no encontrado")) return res.status(404).json(result);
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }
}
