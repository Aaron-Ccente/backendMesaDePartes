import { Router } from "express";
import { GradosController } from "../controllers/grado.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);

// GET - Obtener todos los grados (cualquiera autenticado)
router.get("/", GradosController.getAllGrados);

// Rutas que requieren ser admin
router.use(requireAdmin);

router.get("/:id", GradosController.getGradoById);
router.post("/", GradosController.createGrado);
router.put("/:id", GradosController.updateGrado);
router.delete("/:id", GradosController.deleteGrado);

export default router;