import { TiposDeExamen } from "../models/TiposDeExamen.js";

export class TiposDeExamenController {
  static async getAllTiposDeExamen(_, res) {
    try {
      const tipos = await TiposDeExamen.findAll();
      return res.status(200).json({ success: true, data: tipos });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async getTipoDeExamenById(req, res) {
    try {
      const { id } = req.params;
      const tipo = await TiposDeExamen.findById(id);
      if (!tipo) return res.status(404).json({ success: false, message: "Tipo de examen no encontrado" });
      return res.status(200).json({ success: true, data: tipo });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async createTipoDeExamen(req, res) {
    try {
      const { nombre, descripcion, tipo_departamento_ids } = req.body;
      const deps =
        typeof tipo_departamento_ids === "string"
          ? tipo_departamento_ids.split(",").map((v) => Number(v.trim())).filter(Boolean)
          : Array.isArray(tipo_departamento_ids)
          ? tipo_departamento_ids.map((v) => Number(v))
          : [];

      const result = await TiposDeExamen.create({ nombre, descripcion, tipo_departamento_ids: deps });
      if (result.success === false) return res.status(409).json(result);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async updateTipoDeExamen(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, tipo_departamento_ids } = req.body;
      const deps =
        typeof tipo_departamento_ids === "string"
          ? tipo_departamento_ids.split(",").map((v) => Number(v.trim())).filter(Boolean)
          : Array.isArray(tipo_departamento_ids)
          ? tipo_departamento_ids.map((v) => Number(v))
          : tipo_departamento_ids === undefined
          ? null
          : [];

      const result = await TiposDeExamen.update(id, { nombre, descripcion, tipo_departamento_ids: deps });
      if (result.success === false) {
        if (result.message.includes("no encontrado")) return res.status(404).json(result);
        if (result.message.includes("Ya existe")) return res.status(409).json(result);
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  static async deleteTipoDeExamen(req, res) {
    try {
      const { id } = req.params;
      const result = await TiposDeExamen.delete(id);
      if (result.success === false) {
        if (result.message.includes("no encontrado")) return res.status(404).json(result);
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }

  // obtener tipos de examen por id de tipo de departamento
  static async getTiposByDepartamento(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id de departamento requerido" });

      const tipos = await TiposDeExamen.findByDepartamentoId(id);
      return res.status(200).json({ success: true, data: tipos });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
    }
  }
}