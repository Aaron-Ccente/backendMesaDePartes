import { Router } from "express";
import { TiposDeExamenController } from "../controllers/tipos_de_examen.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Autenticación requerida para todas las rutas
router.use(authenticateToken);

// GET - Obtener todos los tipos de examen
router.get("/", TiposDeExamenController.getAllTiposDeExamen);

// GET - Obtener tipos de examen por id de tipo de departamento
router.get("/departamento/:id", TiposDeExamenController.getTiposByDepartamento);

// Rutas que requieren ser admin
router.use(requireAdmin);

// GET - Obtener tipo de examen por id
router.get("/:id", TiposDeExamenController.getTipoDeExamenById);

// POST - Crear nuevo tipo de examen    
router.post("/", TiposDeExamenController.createTipoDeExamen);

// PUT - Actualizar tipo de examen
router.put("/:id", TiposDeExamenController.updateTipoDeExamen);

// DELETE - Eliminar tipo de examen
router.delete("/:id", TiposDeExamenController.deleteTipoDeExamen);

export default router;