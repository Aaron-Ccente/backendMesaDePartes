import { Router } from "express";
import { TurnoController } from "../controllers/turno.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router()

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);
// Ruta GET - Obtener todos los turnos disponibles
router.get("/", TurnoController.getAllTurnos)

// Ruta POST - Crear un nuevo turno

// Ruta PUT - Editar un turno

// Ruta DELETE - Eliminar el turno

export default router