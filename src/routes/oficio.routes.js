import { Router } from 'express';
import { OficioController } from '../controllers/oficio.controller.js';
import { authenticateToken, requireMesaDePartes, requirePerito } from '../middleware/authMiddleware.js';
import { OficioResultadosController } from '../controllers/OficioResultados.controller.js';
// Importamos Multer para subir archivos locales
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { OficioCierreController } from '../controllers/OficioCierre.controller.js';
// import { authenticateToken, requireMesaDePartes, requirePerito } from '../middleware/authMiddleware.js';

// --- Configuración de Multer para Almacenamiento Local (Paso 2.4e) ---

// Definir la ruta de subidas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Salimos de 'routes', 'src' y entramos a 'uploads/oficios_finales'
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'oficios_finales');

// Asegurarse de que el directorio de subidas exista
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Usar la carpeta que definimos
  },
  filename: function (req, file, cb) {
    // Crear un nombre de archivo único para evitar colisiones
    // ej: oficio_110_firmado-1678886400000.pdf
    const idOficio = req.params.id_oficio || req.params.id; // Tomar el ID del oficio de la URL
    const fileExt = path.extname(file.originalname);
    const safeOriginalName = file.originalname.replace(fileExt, '').replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueSuffix = Date.now();

    cb(null, `oficio_${idOficio}_${safeOriginalName}-${uniqueSuffix}${fileExt}`);
  }
});

// Filtro de archivos (solo aceptar PDFs)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Error: Solo se permiten archivos PDF.'), false);
  }
};

// Inicializar Multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});

// --- Fin Configuración de Multer ---
const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ========== RUTAS ESPECÍFICAS ==========

// Rutas GET públicas (para usuarios autenticados)
router.get('/', OficioController.getAllOficios);
router.get('/check/:numero', OficioController.checkNumero);

// Solo para peritos
router.get('/assigned', requirePerito, OficioController.getAssignedToUser);
router.get('/alerts', requirePerito, OficioController.getAlertas);

// Solo para mesa de partes
router.post('/', requireMesaDePartes, OficioController.createOficio);

// ========== RUTAS CON PARÁMETROS ==========

// Rutas con parámetros
router.get('/:id', OficioController.getOficioById);
router.get('/:id/seguimiento', OficioController.getSeguimientoOficio);
router.post('/:id/respond', requirePerito, OficioController.respondToOficio);

// --- Rutas de Hoja de Ruta (Resultados) ---

// GET: Obtener todos los resultados de un oficio (Cualquier usuario autenticado)
// (authenticateToken ya está aplicado a todo el router)
router.get(
  '/:id_oficio/resultados',
  OficioResultadosController.getResultadosPorOficio
);

// POST: Un perito añade un resultado a la hoja de ruta
router.post(
  '/:id_oficio/resultados',
  requirePerito, // Solo los peritos pueden añadir resultados
  OficioResultadosController.addResultado
);

// POST: Un perito deriva (reasigna) el oficio a otro perito
router.post(
  '/:id/derivar', // :id es el id_oficio
  requirePerito,  // Solo un perito puede derivar
  OficioController.derivarOficio
);
// (Usa :id_oficio para coincidir con la lógica de Multer)
router.post(
  '/:id_oficio/cerrar_local',
  requireMesaDePartes, // Solo Mesa de Partes puede cerrar
  upload.single('archivo_final'), // Middleware de Multer para 1 archivo, campo "archivo_final"
  OficioCierreController.cerrarOficioLocal
);
router.get(
  '/archivos/:id_archivo/descargar',
  authenticateToken, // Asegura que solo usuarios logueados descarguen
  OficioCierreController.descargarArchivoLocal
);
export default router;