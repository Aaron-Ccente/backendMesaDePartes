import { Router } from "express";
import { TurnoController } from "../controllers/turno.controller.js";

const router = Router()
router.get("/", TurnoController.getAllTurnos)


export default router