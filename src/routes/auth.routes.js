import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// RUTAS PÚBLICAS (sin autenticación)
// Login de administrador
router.post('/admin/login', AuthController.loginAdmin);

// Registro de administrador
router.post('/admin/register', AuthController.registerAdmin);

// A partir de aquí, rutas protegidas que requieren token y rol administrador
router.use(authenticateToken);
router.use(requireAdmin);

// Obtener lista de administradores (paginado y búsqueda)
router.get('/admins', AuthController.getAllAdmins);

// Crear administrador
router.post('/admins', AuthController.createAdmin);

// Obtener admin por CIP
router.get('/admins/:cip', AuthController.getAdminByCIP);

// Actualizar admin
router.put('/admins/:cip', AuthController.updateAdmin);

// Eliminar admin
router.delete('/admins/:cip', AuthController.deleteAdmin);

// Ruta para verificar token (protegida)
router.get('/admin/verify', AuthController.verifyToken);

// Ruta para obtener información del administrador autenticado (protegida)
router.get('/admin/info', AuthController.getAdminInfo);

export default router;
