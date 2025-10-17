import { Router } from "express";
import { TipodepartamentoController } from "../controllers/tipodepartamento.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);

// Get all tipos de departamento (cualquiera autenticado)
router.get("/", TipodepartamentoController.getAllTiposDepartamento);

// Rutas que requieren ser admin
router.use(requireAdmin);

router.post("/", TipodepartamentoController.createTipoDepartamento);
router.get("/:id", TipodepartamentoController.getTipoDepartamentoById);
router.put("/:id", TipodepartamentoController.updateTipoDepartamento);
router.delete("/:id", TipodepartamentoController.deleteTipoDepartamento);

export default router;