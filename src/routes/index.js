import express from 'express';
import authRoutes from './auth.routes.js';
import peritoRoutes from './perito.routes.js';
import especialidadesRoutes from './especialidad.routes.js'
import TipoDepartamentoRoutes from './tipodepartamento.routes.js'
import gradosRoutes from './grado.routes.js'
import turnos from './turno.routes.js'
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

// Rutas para especialidades
router.use('/api/especialidades', especialidadesRoutes)

// Rutas para los tipos de departamentos
router.use('/api/tipodepartamentos', TipoDepartamentoRoutes)

// Rutas para los grados
router.use('/api/grados', gradosRoutes)

// Rutas para los turnos
router.use('/api/turnos', turnos)

export default router;
