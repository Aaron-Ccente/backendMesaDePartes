import { Router } from 'express';
import { OficioController } from '../controllers/oficio.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas GET

// Obtener todos los oficios
router.get('/', OficioController.getAllOficios);

// Para validar que el numero de oficio no existe 
router.get('/check/:numero', OficioController.checkNumero);

// Obtener oficio segun id
router.get('/:id', OficioController.getOficioById);

// Seguimiento
router.get('/:id/seguimiento', OficioController.getSeguimientoOficio);

// Ruta POST - crear
router.post('/', OficioController.createOficio);

export default router;