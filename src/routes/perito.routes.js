import express from 'express';
import { PeritoController } from '../controllers/perito.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// RUTAS PÚBLICAS (sin autenticación)
// Login de perito
router.post('/login', PeritoController.loginPerito);

// RUTAS PROTEGIDAS (requieren token de usuario autentificado)
router.use(authenticateToken);

// Obtener peritos segun la especialidad selecccionada
router.get('/especialidad', PeritoController.getAllPeritoAccordingToSpecialty)

// RUTAS PROTEGIDAS (requieren autenticación de administrador)

router.use(requireAdmin);

// Crear nuevo perito
router.post('/', PeritoController.createPerito);

// Obtener todos los peritos (con paginación y búsqueda)
router.get('/', PeritoController.getAllPeritos);

// Obtener perito con sus especialidades, grado, seccion y tipo de departamento por CIP
router.get('/:cip', PeritoController.getPeritoByCIP);

// Actualizar perito
router.put('/:cip', PeritoController.updatePerito);

// Eliminar perito
router.delete('/:cip', PeritoController.deletePerito);

// Cambiar contraseña de perito
router.patch('/:cip/password', PeritoController.changePeritoPassword);

// Obtener estadísticas de peritos
router.get('/stats/overview', PeritoController.getPeritosStats);

export default router;
