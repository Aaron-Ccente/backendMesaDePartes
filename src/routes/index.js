import express from 'express';
import authRoutes from './auth.routes.js';
import peritoRoutes from './perito.routes.js';
import TipoDepartamentoRoutes from './tipodepartamento.routes.js'
import tiposDeExamenRoutes from './tipos_de_examen.routes.js'
import gradosRoutes from './grado.routes.js'
import turnos from './turno.routes.js'
import mesadepartesRoutes from './mesadepartes.routes.js'
import prioridadesRoutes from './prioridad.routes.js'
import oficioRoutes from './oficio.routes.js'
import googleRoutes from './googleapi.routes.js'
import seguimientoRoutes from './seguimiento.routes.js'
import mesaDePartesDashboardRoutes from './mesadepartes.dashboard.routes.js';
import procedimientoRoutes from './procedimiento.routes.js';
import documentoRoutes from './documento.routes.js';
import dictamenRoutes from './dictamen.routes.js';

const router = express.Router();

// Ruta raíz de la API
router.get('/', (_, res) => {
  res.json({
    message: 'API Mesa de Partes PNP',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      peritos: '/api/peritos'
    }
  });
});


// Rutas de autenticación
router.use('/api/auth', authRoutes);

// Rutas de peritos
router.use('/api/peritos', peritoRoutes);

// Rutas para los tipos de departamentos
router.use('/api/tipodepartamentos', TipoDepartamentoRoutes)

// Rutas para los tipos de examenes
router.use('/api/tiposdeexamen', tiposDeExamenRoutes);

// Rutas para los grados
router.use('/api/grados', gradosRoutes)

// Rutas para los turnos
router.use('/api/turnos', turnos)

// Rutas para mesa de partes
router.use('/api/mesadepartes', mesadepartesRoutes)

// Rutas para el dashboard de mesa de partes
router.use('/api/mesadepartes-dashboard', mesaDePartesDashboardRoutes);

// Rutas para los tipos de prioridades de los oficios
router.use('/api/prioridades', prioridadesRoutes)

// Rutas para los oficios
router.use('/api/oficios', oficioRoutes);

// Rutas para la api de google drive
router.use('/api/google', googleRoutes)

// Rutas para el seguimiento de casos
router.use('/api/seguimiento', seguimientoRoutes)

// Rutas para los procedimientos de los peritos
router.use('/api/procedimientos', procedimientoRoutes);

// Rutas para la generación de documentos
router.use('/api/documentos', documentoRoutes);

// Rutas para la generación de dictamenes
router.use('/api/dictamen', dictamenRoutes);

export default router;
