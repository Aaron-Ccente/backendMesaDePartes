import { Oficio } from '../models/Oficio.js';

export class MesaDePartesDashboardController {
  
  static async getStats(req, res) {
    try {
      const userId = req.user?.id_usuario;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      }

      const result = await Oficio.getStatsForMesaDePartes(userId);
      if (!result.success) {
        return res.status(500).json(result);
      }
      
      return res.json(result);

    } catch (error) {
      console.error('Error en getStats:', error);
      return res.status(500).json({ success: false, message: 'Error interno al obtener estadísticas.' });
    }
  }

  static async getRecentCases(req, res) {
    try {
      const userId = req.user?.id_usuario;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      }

      // El segundo argumento es el límite, podemos hacerlo configurable si es necesario
      const result = await Oficio.getRecentCasosPorCreador(userId, 5); 
      
      if (!result.success) {
        return res.status(500).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('Error en getRecentCases:', error);
      return res.status(500).json({ success: false, message: 'Error interno al obtener casos recientes.' });
    }
  }
}
