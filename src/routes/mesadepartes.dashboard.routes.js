import { Router } from 'express';
import { MesaDePartesDashboardController } from '../controllers/mesadepartes.dashboard.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas en este archivo requieren autenticación
router.use(authenticateToken);

// Ruta para obtener las estadísticas del dashboard
router.get('/stats', MesaDePartesDashboardController.getStats);

// Ruta para obtener los casos creados recientemente
router.get('/casos-recientes', MesaDePartesDashboardController.getRecentCases);

// Ruta para obtener los casos culminados
router.get('/casos-culminados', MesaDePartesDashboardController.getCasosCulminados);

// Ruta para obtener los casos listos para recojo
router.get('/casos-para-recojo', MesaDePartesDashboardController.getCasosParaRecojo);

export default router;
