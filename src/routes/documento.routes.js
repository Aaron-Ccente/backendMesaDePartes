import { Router } from 'express';
import { DocumentoController } from '../controllers/documento.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Se usa POST para permitir enviar datos del formulario (extraData) en el cuerpo.
router.post('/preview/:id_oficio', authenticateToken, DocumentoController.getPreview);

// Ruta para generar el Acta de Apertura
router.post('/generar/acta-apertura/:id_oficio', authenticateToken, DocumentoController.generarActaApertura);

export default router;
