import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta de login de administrador
router.post('/admin/login', AuthController.loginAdmin);

// Ruta de registro de administrador
router.post('/admin/register', AuthController.registerAdmin);

// Ruta para verificar token (protegida)
router.get('/admin/verify', authenticateToken, AuthController.verifyToken);

// Ruta para obtener información del administrador autenticado (protegida)
router.get('/admin/info', authenticateToken, AuthController.getAdminInfo);

// Ruta de prueba protegida (solo para administradores)
router.get('/admin/protected', requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Ruta protegida accesible solo para administradores',
    user: req.user
  });
});

export default router;
