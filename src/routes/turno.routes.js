import { Router } from "express";
import { TurnoController } from "../controllers/turno.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);

// GET - Obtener todos los turnos disponibles (cualquiera autenticado)
router.get("/", TurnoController.getAllTurnos);


// Rutas que requieren ser admin
router.use(requireAdmin);

router.get("/:id", TurnoController.getTurnoById);
router.post("/", TurnoController.createTurno);
router.put("/:id", TurnoController.updateTurno);
router.delete("/:id", TurnoController.deleteTurno);

export default router;