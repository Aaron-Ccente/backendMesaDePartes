// backend/src/controllers/OficioResultados.controller.js
import { OficioResultados } from '../models/OficioResultados.js';
import { Oficio } from '../models/Oficio.js'; // Necesitaremos Oficio para actualizar el estado

export class OficioResultadosController {

  /**
   * Obtiene todos los resultados de una hoja de ruta para un oficio específico.
   */
  static async getResultadosPorOficio(req, res) {
    try {
      const { id_oficio } = req.params;
      
      const result = await OficioResultados.findByOficioId(Number(id_oficio));

      if (!result.success) {
        return res.status(404).json(result);
      }
      
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error en getResultadosPorOficio:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
      });
    }
  }

  /**
   * Un perito guarda un nuevo resultado en la hoja de ruta.
   */
  static async addResultado(req, res) {
    try {
      const { id_oficio } = req.params;
      const { tipo_resultado, resultados } = req.body;
      const id_perito_responsable = req.user.id_usuario; // Obtenido del token (authMiddleware)

      // 1. Validar datos de entrada
      if (!tipo_resultado || !resultados) {
        return res.status(400).json({
          success: false,
          message: 'tipo_resultado y resultados son requeridos en el body',
        });
      }
      
      // 2. Crear el registro del resultado
      const data = {
        id_oficio: Number(id_oficio),
        id_perito_responsable,
        tipo_resultado,
        resultados // Debe ser un objeto JSON
      };

      const createResult = await OficioResultados.create(data);

      if (!createResult.success) {
        return res.status(500).json(createResult);
      }

      // 3. (Importante) Actualizar el estado del Oficio principal
      // Obtenemos el nombre de la sección del perito que guarda el resultado
      const nombreSeccion = req.user.seccion_nombre || 'PERITO'; // Asumimos que seccion_nombre vendrá del login
      
      // Creamos un estado de seguimiento descriptivo
      const nuevo_estado = `RESULTADO REGISTRADO: ${nombreSeccion.toUpperCase()}`;
      
      await Oficio.addSeguimiento({
        id_oficio: Number(id_oficio),
        id_usuario: id_perito_responsable,
        estado_nuevo: nuevo_estado,
        estado_anterior: null // El estado anterior lo gestionará el frontend si es necesario
      });

      // 4. Devolver éxito
      return res.status(201).json({
        success: true,
        message: 'Resultado y seguimiento guardados exitosamente',
        data: { id_resultado: createResult.id }
      });

    } catch (error) {
      console.error('Error en addResultado:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al guardar el resultado',
        error: error.message,
      });
    }
  }
}
