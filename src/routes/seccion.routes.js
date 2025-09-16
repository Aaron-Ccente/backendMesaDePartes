import {Router} from 'express';
import { SectionController } from '../controllers/seccion.controller.js';

const router = Router();

router.get("/", SectionController.getSectionById)

export default router