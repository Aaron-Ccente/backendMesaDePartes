import { Router } from "express";
import { EspecialidadController } from "../controllers/especialidad.controller.js";

const router = Router();
router.get('/', EspecialidadController.getAllEspecialidades);

export default router;          