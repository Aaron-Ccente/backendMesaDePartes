import { Router } from 'express';
import { ProcedimientoController } from '../controllers/procedimiento.controller.js';
import { authenticateToken, requirePerito } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas en este archivo requieren autenticación de perito
router.use(authenticateToken);
router.use(requirePerito);

/**
 * @swagger
 * /api/procedimientos/{id}/extraccion:
 *   get:
 *     summary: Obtiene los datos guardados de un procedimiento de extracción.
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
 *         description: Datos de la extracción encontrados.
 *       404:
 *         description: No se encontraron datos para este procedimiento.
 */
router.get('/:id/extraccion', ProcedimientoController.getDatosExtraccion);

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
 * /api/procedimientos/{id}/finalizar-extraccion-interna:
 *   post:
 *     summary: Finaliza la fase de extracción para un caso de 'Extracción y Análisis'.
 *     description: Registra las muestras y el acta de extracción, y actualiza el estado del caso a 'PENDIENTE_ANALISIS_TM' sin derivarlo.
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
 *             $ref: '#/components/schemas/RegistrarExtraccionBody'
 *     responses:
 *       200:
 *         description: Fase de extracción finalizada. Caso actualizado para análisis.
 *       400:
 *         description: Datos inválidos.
 */
router.post('/:id/finalizar-extraccion-interna', ProcedimientoController.finalizarExtraccionInterna);


/**
 * @swagger
 * /api/procedimientos/{id}/analisis:
 *   get:
 *     summary: Obtiene los datos guardados de un procedimiento de análisis para el perito actual.
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
 *         description: Datos del análisis encontrados.
 *       404:
 *         description: No se encontraron datos para este procedimiento.
 */
router.get('/:id/analisis', ProcedimientoController.getDatosAnalisis);


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
 * /api/procedimientos/{id}/datos-consolidacion:
 *   get:
 *     summary: Obtiene todos los datos necesarios para la vista de consolidación.
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
 *         description: Datos para la consolidación.
 */
router.get('/:id/datos-consolidacion', ProcedimientoController.getDatosConsolidacion);

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

// --- Rutas para flujos con formularios placeholder ---

/**
 * @swagger
 * /api/procedimientos/{id}/placeholder-analisis:
 *   post:
 *     summary: Registra un análisis placeholder para INST o LAB.
 *     tags: [Procedimientos, Placeholder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_analisis:
 *                 type: string
 *                 enum: [INST, LAB]
 *     responses:
 *       200:
 *         description: Análisis placeholder registrado.
 */
router.post('/:id/placeholder-analisis', ProcedimientoController.registrarAnalisisPlaceholder);

/**
 * @swagger
 * /api/procedimientos/{id}/placeholder-consolidacion:
 *   post:
 *     summary: Registra una consolidación placeholder para LAB.
 *     tags: [Procedimientos, Placeholder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consolidación placeholder registrada.
 */
router.post('/:id/placeholder-consolidacion', ProcedimientoController.registrarConsolidacionPlaceholder);

/**
 * @swagger
 * /api/procedimientos/{id}/finalizar-para-mp:
 *   post:
 *     summary: Finaliza el caso y lo envía a la bandeja de culminados de MP.
 *     tags: [Procedimientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caso finalizado exitosamente.
 */
router.post('/:id/finalizar-para-mp', ProcedimientoController.finalizarParaMP);


export default router;

