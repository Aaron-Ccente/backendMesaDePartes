// backend/src/controllers/OficioResultados.controller.js
import { Oficio } from '../models/Oficio.js';
import { WorkflowService } from '../services/workflowService.js';

export class OficioResultadosController {

  /**
   * Obtiene todos los resultados de una hoja de ruta para un oficio específico.
   */
  static async getResultadosPorOficio(req, res) {
    try {
      const { id_oficio } = req.params;
      const result = await Oficio.getResultados(Number(id_oficio));

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
   * Un perito guarda un nuevo resultado en la hoja de ruta y se determina el siguiente paso.
   */
  static async addResultado(req, res) {
    try {
      const { id_oficio } = req.params;
      const { tipo_resultado, resultados } = req.body;
      const id_perito_responsable = req.user.id_usuario;

      // 1. Validar datos de entrada
      if (!tipo_resultado || !resultados) {
        return res.status(400).json({
          success: false,
          message: 'tipo_resultado y resultados son requeridos en el body',
        });
      }
      
      // 2. Crear el registro del resultado usando el modelo centralizado
      const createResult = await Oficio.addResultado({
        id_oficio: Number(id_oficio),
        id_perito_responsable,
        tipo_resultado,
        resultados
      });

      // 3. Añadir un seguimiento para registrar la acción
      const nuevo_estado = `RESULTADO REGISTRADO: ${String(tipo_resultado).toUpperCase()}`;
      await Oficio.addSeguimiento({
        id_oficio: Number(id_oficio),
        id_usuario: id_perito_responsable,
        estado_nuevo: nuevo_estado,
      });

      // 4. Determinar el siguiente paso en el flujo de trabajo
      const nextStep = await WorkflowService.getNextStep(Number(id_oficio));

      // 5. Devolver éxito con la información del siguiente paso
      return res.status(201).json({
        success: true,
        message: 'Resultado y seguimiento guardados exitosamente.',
        data: { id_resultado: createResult.data.id_resultado },
        next_step_info: nextStep
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
