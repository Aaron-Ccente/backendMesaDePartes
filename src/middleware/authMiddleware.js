import { AuthService } from '../services/authService.js';

export const authenticateToken = async (req, res, next) => {
  try {
    // Obtener el token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }
    const decoded = AuthService.verifyToken(token);
    // Agregar la información del usuario
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    // Verificar que el usuario tenga rol de administrador
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en requireAdmin:', error);
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado'
    });
  }
};

export const validateAdminExists = async (req, res, next) => {
  try {
    // Verificar que el administrador aún existe en la base de datos
    const { AuthService } = await import('../services/authService.js');
    const result = await AuthService.validateToken(req.headers.authorization?.split(' ')[1]);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: 'Administrador no encontrado o token inválido'
      });
    }
    
    // Actualizar la información del usuario en la request
    req.user = result.admin;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Error en validación del administrador'
    });
  }
};
