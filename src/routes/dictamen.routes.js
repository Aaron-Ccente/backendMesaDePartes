import express from 'express';
import dictamenController from '../controllers/dictamen.controller.js';
import { authenticateToken, requirePerito } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:id_oficio/generar', [authenticateToken, requirePerito], dictamenController.generarDictamen);
router.post('/:id_oficio/preview', [authenticateToken, requirePerito], dictamenController.generarPreview);

export default router;
