import { Router } from 'express';
import { ProcedimientoController } from '../controllers/procedimiento.controller.js';
import { authenticateToken, requirePerito, requireMesaDePartes } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// --- START: Configuración de Multer ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Configuración para Informe Firmado (Perito)
const informesFirmadosDir = path.join(baseUploadsDir, 'informes_firmados');
if (!fs.existsSync(informesFirmadosDir)) {
  fs.mkdirSync(informesFirmadosDir, { recursive: true });
}
const informeFirmadoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, informesFirmadosDir),
  filename: (req, file, cb) => {
    const idOficio = req.params.id;
    const fileExt = path.extname(file.originalname);
    cb(null, `informe-firmado-${idOficio}-${Date.now()}${fileExt}`);
  }
});
const uploadInformeFirmado = multer({ storage: informeFirmadoStorage, fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf') });


// Configuración para Documentos Finales (Mesa de Partes)
const documentosFinalesDir = path.join(baseUploadsDir, 'documentos_finales');
if (!fs.existsSync(documentosFinalesDir)) {
  fs.mkdirSync(documentosFinalesDir, { recursive: true });
}
const documentosFinalesStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentosFinalesDir),
  filename: (req, file, cb) => {
    const idOficio = req.params.id;
    const fileExt = path.extname(file.originalname);
    cb(null, `doc-final-${idOficio}-${Date.now()}${fileExt}`);
  }
});
const uploadDocumentosFinales = multer({ storage: documentosFinalesStorage }); // Permitir cualquier tipo de imagen/pdf

// --- END: Configuración de Multer ---


// Todas las rutas en este archivo requieren autenticación
router.use(authenticateToken);

// Rutas de Perito
router.get('/:id/extraccion', requirePerito, ProcedimientoController.getDatosExtraccion);
router.post('/:id/extraccion', requirePerito, ProcedimientoController.registrarExtraccion);
router.post('/:id/finalizar-extraccion-interna', requirePerito, ProcedimientoController.finalizarExtraccionInterna);
router.get('/:id/analisis', requirePerito, ProcedimientoController.getDatosAnalisis);
router.post('/:id/analisis', requirePerito, ProcedimientoController.registrarAnalisis);
router.get('/:id/siguiente-paso', requirePerito, ProcedimientoController.obtenerSiguientePaso);
router.post('/:id/derivar', requirePerito, ProcedimientoController.derivarCaso);
router.get('/:id/resultados-completos', requirePerito, ProcedimientoController.obtenerResultadosCompletos);
router.get('/:id/datos-consolidacion', requirePerito, ProcedimientoController.getDatosConsolidacion);
router.post('/:id/consolidacion', requirePerito, ProcedimientoController.registrarConsolidacion);
router.post('/:id/generar-caratula', requirePerito, ProcedimientoController.generarCaratula);
router.get('/:id/generar-informe-no-extraccion', requirePerito, ProcedimientoController.generarInformeNoExtraccion);

// Nuevas rutas para subida de archivos
router.post('/:id/upload-informe-firmado', requirePerito, uploadInformeFirmado.single('informe_firmado'), ProcedimientoController.uploadInformeFirmado);
router.post('/:id/upload-documentos-finales', requireMesaDePartes, uploadDocumentosFinales.array('documentos_finales', 5), ProcedimientoController.uploadDocumentosFinales);


// --- Rutas para flujos con formularios placeholder ---
router.post('/:id/placeholder-analisis', requirePerito, ProcedimientoController.registrarAnalisisPlaceholder);
router.post('/:id/placeholder-consolidacion', requirePerito, ProcedimientoController.registrarConsolidacionPlaceholder);
router.post('/:id/finalizar-para-mp', requirePerito, ProcedimientoController.finalizarParaMP);


export default router;

