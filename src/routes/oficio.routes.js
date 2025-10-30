import { Router } from 'express';
import { OficioController } from '../controllers/oficio.controller.js';
import { authenticateToken, requireMesaDePartes, requirePerito } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ========== RUTAS ESPECÍFICAS ==========

// Rutas GET públicas (para usuarios autenticados)
router.get('/', OficioController.getAllOficios);
router.get('/check/:numero', OficioController.checkNumero);

// Solo para peritos
router.get('/assigned', requirePerito, OficioController.getAssignedToUser);
router.get('/alerts', requirePerito, OficioController.getAlertas);

// Solo para mesa de partes
router.post('/', requireMesaDePartes, OficioController.createOficio);

// ========== RUTAS CON PARÁMETROS ==========

// Rutas con parámetros
router.get('/:id', OficioController.getOficioById);
router.get('/:id/seguimiento', OficioController.getSeguimientoOficio);
router.post('/:id/respond', requirePerito, OficioController.respondToOficio);

export default router;