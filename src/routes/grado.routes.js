import { Router } from "express";
import { GradosController } from "../controllers/grado.controller.js";

const router = Router();

router.get("/", GradosController.getAllGrados);
// router.post("/", GradosController.createGrados);
// router.put("/:id", GradosController.editGrados);
// router.delete("/:id", GradosController.deleteGrados);

export default router;