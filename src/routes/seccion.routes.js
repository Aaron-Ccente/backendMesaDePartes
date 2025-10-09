import {Router} from 'express';
import { SectionController } from '../controllers/seccion.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);
router.get("/", SectionController.getSectionById)

export default router