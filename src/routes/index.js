import express from 'express';
import authRoutes from './auth.routes.js';
import peritoRoutes from './perito.routes.js';

const router = express.Router();

// Ruta raíz de la API
router.get('/', (req, res) => {
  res.json({
    message: 'API Mesa de Partes PNP',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      peritos: '/api/peritos'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas de autenticación
router.use('/api/auth', authRoutes);

// Rutas de peritos
router.use('/api/peritos', peritoRoutes);

export default router;
