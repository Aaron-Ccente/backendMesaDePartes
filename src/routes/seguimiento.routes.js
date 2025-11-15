import express from 'express';
import * as seguimientoController from '../controllers/seguimiento.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Proteger todas las rutas de seguimiento con autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /api/seguimiento/casos:
 *   get:
 *     summary: Obtiene casos para la vista de seguimiento según el rol del usuario.
 *     tags: [Seguimiento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, todos]
 *         description: Filtra los casos por estado (por defecto 'pendiente').
 *     responses:
 *       200:
 *         description: Una lista de casos.
 *       403:
 *         description: Acceso no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/casos', seguimientoController.getCasosSeguimiento);

/**
 * @swagger
 * /api/seguimiento/casos/{id}:
 *   get:
 *     summary: Obtiene el detalle completo y el historial de un caso específico.
 *     tags: [Seguimiento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del oficio.
 *     responses:
 *       200:
 *         description: El detalle del caso.
 *       404:
 *         description: Caso no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/casos/:id', seguimientoController.getDetalleCaso);

/**
 * @swagger
 * /api/seguimiento/casos/{id}/estado:
 *   post:
 *     summary: Actualiza el estado de un caso.
 *     tags: [Seguimiento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del oficio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nuevo_estado:
 *                 type: string
 *                 description: El nuevo estado a registrar (ej. 'OFICIO VISTO').
 *             required:
 *               - nuevo_estado
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente.
 *       400:
 *         description: Datos inválidos.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/casos/:id/estado', seguimientoController.actualizarEstado);

/**
 * @swagger
 * /api/seguimiento/peritos-derivacion:
 *   get:
 *     summary: Obtiene la lista de peritos a los que se puede derivar un caso.
 *     tags: [Seguimiento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: casoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del oficio para el cual se buscan peritos de derivación.
 *     responses:
 *       200:
 *         description: Una lista de peritos elegibles.
 *       400:
 *         description: Parámetro 'casoId' faltante.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/peritos-derivacion', seguimientoController.getPeritosParaDerivacion);

export default router;