import express from 'express';
import authRoutes from './auth.routes.js';
import peritoRoutes from './perito.routes.js';

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

export default router;
