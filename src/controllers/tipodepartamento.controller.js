import { TipoDepartamento } from "../models/TipoDepartamento.js";

export class TipodepartamentoController {
  static async getAllTiposDepartamento(_, res) {
    try {
      const tipodepartamentos = await TipoDepartamento.findAll();
      res.status(200).json({
        success: true,
        data: tipodepartamentos,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async getTipoDepartamentoById(req, res) {
    try {
      const { id } = req.params;
      const tipo = await TipoDepartamento.findById(id);
      if (!tipo) return res.status(404).json({ success: false, message: "Tipo de departamento no encontrado" });
      return res.status(200).json({ success: true, data: tipo });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async createTipoDepartamento(req, res) {
    try {
      const { nombre_departamento, descripcion } = req.body;
      const result = await TipoDepartamento.create({ nombre_departamento, descripcion });
      if (result.success === false) {
        return res.status(409).json(result);
      }
      return res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async updateTipoDepartamento(req, res) {
    try {
      const { id } = req.params;
      const { nombre_departamento, descripcion } = req.body;
      const result = await TipoDepartamento.update(id, { nombre_departamento, descripcion });
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

  static async deleteTipoDepartamento(req, res) {
    try {
      const { id } = req.params;
      const result = await TipoDepartamento.delete(id);
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