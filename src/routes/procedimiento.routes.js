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
router.post('/:id/extraccion', ProcedimientoController.registrarExtraccion);


/**
 * @swagger
 * /api/procedimientos/{id}/analisis:
 *   post:
 *     summary: Registra el resultado de un análisis de muestras recibidas.
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
 *               apertura_data:
 *                 type: object
 *                 properties:
 *                   descripcion_paquete:
 *                     type: string
 *                   observaciones:
 *                     type: string
 *               muestras_analizadas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     codigo_muestra:
 *                       type: string
 *                     resultado_analisis:
 *                       type: string
 *             example:
 *               apertura_data:
 *                 descripcion_paquete: "Sobre manila sin alteraciones."
 *                 observaciones: "Se procede a la apertura."
 *               muestras_analizadas:
 *                 - codigo_muestra: "0456-2025-SAN-01"
 *                   resultado_analisis: "Positivo para metabolitos de Cocaína."
 *     responses:
 *       201:
 *         description: Análisis registrado exitosamente.
 *       400:
 *         description: Datos inválidos.
 */
router.post('/:id/analisis', ProcedimientoController.registrarAnalisis);

/**
 * @swagger
 * /api/procedimientos/{id}/siguiente-paso:
 *   get:
 *     summary: Obtiene la información del siguiente paso para la derivación.
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
 *     responses:
 *       200:
 *         description: Devuelve el nombre de la sección de destino y la lista de peritos disponibles.
 *       404:
 *         description: No se pudo determinar un siguiente paso.
 */
router.get('/:id/siguiente-paso', ProcedimientoController.obtenerSiguientePaso);

/**
 * @swagger
 * /api/procedimientos/{id}/derivar:
 *   post:
 *     summary: Deriva un caso al siguiente perito según el flujo de trabajo.
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del oficio a derivar.
 *     responses:
 *       200:
 *         description: Caso derivado exitosamente.
 *       404:
 *         description: No se encontraron peritos disponibles para la derivación.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/:id/derivar', ProcedimientoController.derivarCaso);

/**
 * @swagger
 * /api/procedimientos/{id}/resultados-completos:
 *   get:
 *     summary: Obtiene todos los resultados registrados para un oficio.
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
 *     responses:
 *       200:
 *         description: Lista de resultados.
 */
router.get('/:id/resultados-completos', ProcedimientoController.obtenerResultadosCompletos);

/**
 * @swagger
 * /api/procedimientos/{id}/consolidacion:
 *   post:
 *     summary: Registra la consolidación final y cierra el caso.
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
 *               conclusiones:
 *                 type: string
 *               observaciones:
 *                 type: string
 *               cerrar_caso:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Consolidación registrada exitosamente.
 */
router.post('/:id/consolidacion', ProcedimientoController.registrarConsolidacion);

export default router;

