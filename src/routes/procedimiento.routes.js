import { Router } from 'express';
import { ProcedimientoController } from '../controllers/procedimiento.controller.js';
import { authenticateToken, requirePerito } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas en este archivo requieren autenticación de perito
router.use(authenticateToken);
router.use(requirePerito);

/**
 * @swagger
 * /api/procedimientos/{id}/registrar-extraccion:
 *   post:
 *     summary: Registra el resultado de un procedimiento de extracción de muestras.
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del oficio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fue_exitosa:
 *                 type: boolean
 *                 description: Indica si la extracción tuvo éxito.
 *               observaciones:
 *                 type: string
 *                 description: Observaciones, especialmente si la extracción falló.
 *               muestras:
 *                 type: array
 *                 description: Lista de muestras recolectadas (si fue exitosa).
 *                 items:
 *                   type: object
 *                   properties:
 *                     descripcion:
 *                       type: string
 *                     cantidad:
 *                       type: string
 *             example:
 *               fue_exitosa: true
 *               observaciones: "El examinado colaboró en todo momento."
 *               muestras:
 *                 - descripcion: "Frasco de vidrio con tapa azul"
 *                   cantidad: "50 ml"
 *     responses:
 *       201:
 *         description: Extracción registrada exitosamente.
 *       400:
 *         description: Datos inválidos.
 */
router.post('/:id/registrar-extraccion', ProcedimientoController.registrarExtraccion);

export default router;

