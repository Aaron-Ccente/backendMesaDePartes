import { Router } from "express";
import { GradosController } from "../controllers/grado.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Se requiere el token de usuarios autentificados (mesa de partes, perito y admin)
router.use(authenticateToken);
router.get("/", GradosController.getAllGrados);
// router.post("/", GradosController.createGrados);
// router.put("/:id", GradosController.editGrados);
// router.delete("/:id", GradosController.deleteGrados);

export default router;