import cors from 'cors';
import express from 'express';
import { PORT, JWT_SECRET } from './src/config/config.js';
import routes from './src/routes/index.js';

const app = express();

// Middleware base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);
  next();
});

// Rutas principales
app.use('/', routes);

// Ruta de fallback para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto: ${PORT}`);
  if (!JWT_SECRET) {
    console.warn('ADVERTENCIA: JWT_SECRET no está configurado');
  } else {
    console.log('JWT_SECRET configurado correctamente');
  }
});