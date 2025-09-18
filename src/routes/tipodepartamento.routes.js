import { Router } from "express";
import { TipodepartamentoController } from "../controllers/tipodepartamento.controller.js";

const router = Router();

// Get all tipos de departamento
router.get('/', TipodepartamentoController.getAllTiposDepartamento)

export default router;
