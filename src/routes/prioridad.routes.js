import { Router } from "express";
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { PrioridadController } from "../controllers/prioridad.controller.js";

const router = Router();

router.use(authenticateToken);
router.get("/", PrioridadController.getAllTypesOfPriority);

router.use(requireAdmin);

// router.post("/", PrioridadController.createPriority);
// router.post("/", PrioridadController.editPriority);
// router.delete("/", PrioridadController.deletePriority)

export default router;