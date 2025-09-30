import { Router } from "express";
import { TurnoController } from "../controllers/turno.controller.js";

const router = Router()

// Ruta GET - Obtener todos los turnos disponibles
router.get("/", TurnoController.getAllTurnos)


export default router