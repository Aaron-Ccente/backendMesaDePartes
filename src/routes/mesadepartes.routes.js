import { Router } from "express";
import { MesaDePartesController } from "../controllers/mesadepartes.controller.js";

const router = Router()

// Ruta para login de un usuario de mesa de partes
router.post("/login", MesaDePartesController.login)

// Ruta para crear un usuario de mesa de partes
// RUTAS PROTEGIDAS (requieren autenticación de administrador)
router.use(authenticateToken);
router.use(requireAdmin);

// Crear nuevo perito
router.post('/', MesaDePartesController.createMesaDePartes);

// Obtener todos los peritos (con paginación y búsqueda)
router.get('/', MesaDePartesController.getAllMesaDePartes);

// Actualizar perito
router.put('/:cip', MesaDePartesController.updateMesaDePartes);

// Eliminar perito
router.delete('/:cip', MesaDePartesController.deleteMesaDePartes);


export default router