import { Router } from "express";
import { TipodepartamentoController } from "../controllers/tipodepartamento.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);

// Get all tipos de departamento
router.get('/', TipodepartamentoController.getAllTiposDepartamento)

export default router;
