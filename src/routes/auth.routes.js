import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta de login de administrador
router.post('/admin/login', AuthController.loginAdmin);

// Ruta de registro de administrador
router.post('/admin/register', AuthController.registerAdmin);

// Ruta para verificar token (protegida)
router.get('/admin/verify', authenticateToken, AuthController.verifyToken);

// Ruta para obtener información del administrador autenticado (protegida)
router.get('/admin/info', authenticateToken, AuthController.getAdminInfo);

export default router;
