import { Router } from 'express';
import { OficioController } from '../controllers/oficio.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas GET
router.get('/', OficioController.getAllOficios);

// Para validar que el numero de oficio no existe 
router.get('/check/:numero', OficioController.checkNumero);

// Obtener oficios asignados al usuario autenticado (ruta específica)
router.get('/assigned', OficioController.getAssignedToUser);

// Obtener seguimiento
router.get('/:id/seguimiento', OficioController.getSeguimientoOficio);

// Obtener oficio segun id (ruta dinámica debe ir al final de las GET específicas)
router.get('/:id', OficioController.getOficioById);

// Ruta POST - crear
router.post('/', OficioController.createOficio);

// Responder/registrar seguimiento en un oficio (perito responde)
router.post('/:id/respond', OficioController.respondToOficio);

export default router;