import { Router } from "express";
import { EspecialidadController } from "../controllers/especialidad.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);
router.get('/', EspecialidadController.getAllEspecialidades);

export default router;          