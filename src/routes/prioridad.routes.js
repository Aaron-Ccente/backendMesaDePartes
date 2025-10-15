import { Router } from "express";
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { PrioridadController } from "../controllers/prioridad.controller.js";

const router = Router();

// Requiere token de autentificacion
router.use(authenticateToken);
router.get("/", PrioridadController.getAllTypesOfPriority);

// Requiere ser logeado como administrador
router.use(requireAdmin);

router.post("/", PrioridadController.createPriority);
router.put("/:id", PrioridadController.updatePriority);
router.delete("/:id", PrioridadController.deletePriority);

export default router;