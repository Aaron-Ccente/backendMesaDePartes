import { Turnos } from "../models/Turno.js";

export class TurnoController {
  static async getAllTurnos(_, res) {
    try {
      const turnos = await Turnos.findAll();
      res.status(200).json({ success: true, data: turnos });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async getTurnoById(req, res) {
    try {
      const { id } = req.params;
      const turno = await Turnos.findById(id);
      if (!turno) return res.status(404).json({ success: false, message: "Turno no encontrado" });
      return res.status(200).json({ success: true, data: turno });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async createTurno(req, res) {
    try {
      const { nombre } = req.body;
      const result = await Turnos.create({ nombre });
      if (result.success === false) {
        return res.status(409).json(result);
      }
      return res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async updateTurno(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const result = await Turnos.update(id, nombre);
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

  static async deleteTurno(req, res) {
    try {
      const { id } = req.params;
      const result = await Turnos.delete(id);
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