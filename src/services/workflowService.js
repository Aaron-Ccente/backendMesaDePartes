import db from '../database/db.js';

/**
 * El WorkflowService encapsula la lógica de negocio compleja para determinar
 * el flujo de un oficio a través de las diferentes secciones y peritos.
 */
export class WorkflowService {

  /**
   * Determina el siguiente paso lógico para un oficio basado en los exámenes requeridos
   * y los resultados ya presentados.
   * 
   * @param {number} id_oficio - El ID del oficio a analizar.
   * @returns {Promise<object>} Un objeto que indica el siguiente paso.
   *          Ej: { next_step: 'ASSIGN_TO_SECTION', section_name: 'Instrumentalización' }
   *          Ej: { next_step: 'CONSOLIDATE', consolidator_id: 123 }
   *          Ej: { next_step: 'WORKFLOW_COMPLETE' }
   */
  static async getNextStep(id_oficio) {
    try {
      // 1. Obtener todos los exámenes requeridos para el oficio
      const [requiredExams] = await db.promise().query(
        `SELECT te.nombre 
         FROM oficio_examen oe
         JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen
         WHERE oe.id_oficio = ?`,
        [id_oficio]
      );
      const requiredExamNames = requiredExams.map(e => e.nombre);

      // 2. Obtener todos los resultados que ya han sido enviados para el oficio
      const [submittedResults] = await db.promise().query(
        `SELECT tipo_resultado FROM oficio_resultados_perito WHERE id_oficio = ?`,
        [id_oficio]
      );
      const submittedResultTypes = submittedResults.map(r => r.tipo_resultado);

      // --- Lógica de decisión del flujo de Toxicología ---

      // Regla 1: Si se requiere "Dosaje Etílico" y aún no se ha presentado, ese es el siguiente paso.
      if (requiredExamNames.includes('Dosaje Etílico') && !submittedResultTypes.includes('DOSAJE_ETILICO')) {
        return { 
          next_step: 'ASSIGN_TO_SECTION', 
          section_name: 'Instrumentalización',
          reason: 'Dosaje Etílico pendiente.'
        };
      }

      // Regla 2: Si se requiere "Toxicológico" y aún no se ha presentado, ese es el siguiente paso.
      // Nota: Esto se ejecutaría después de la regla del Dosaje Etílico.
      if (requiredExamNames.includes('Toxicológico') && !submittedResultTypes.includes('TOXICOLOGICO')) {
        return {
          next_step: 'ASSIGN_TO_SECTION',
          section_name: 'Laboratorio',
          reason: 'Examen Toxicológico pendiente.'
        };
      }
      
      // Regla 3: Si se requiere "Sarro Ungueal" y aún no se ha presentado.
      if (requiredExamNames.includes('Sarro Ungueal') && !submittedResultTypes.includes('SARRO_UNGUEAL')) {
        return {
          next_step: 'ASSIGN_TO_SECTION',
          section_name: 'Laboratorio',
          reason: 'Examen de Sarro Ungueal pendiente.'
        };
      }

      // Regla 4: Si todos los exámenes requeridos tienen un resultado, el siguiente paso es la consolidación.
      const allResultsSubmitted = requiredExamNames.every(reqExam => {
        // Normalizar nombres para la comparación
        const normalizedReq = reqExam.toUpperCase().replace(/ /g, '_');
        return submittedResultTypes.includes(normalizedReq);
      });

      if (allResultsSubmitted && requiredExamNames.length > 0) {
        // El consolidador es siempre un perito del Laboratorio.
        // Necesitamos encontrar quién fue el perito original del laboratorio o uno disponible.
        // Por ahora, indicamos la necesidad de consolidar en la sección Laboratorio.
        return {
          next_step: 'CONSOLIDATE',
          section_name: 'Laboratorio',
          reason: 'Todos los resultados han sido presentados. Listo para consolidar.'
        };
      }

      // Regla 5: Si no hay más pasos lógicos, el flujo puede considerarse completo desde la perspectiva del perito.
      return {
        next_step: 'WORKFLOW_COMPLETE',
        reason: 'No hay más pasos de análisis pendientes.'
      };

    } catch (error) {
      console.error('Error en WorkflowService.getNextStep:', error);
      throw error;
    }
  }
}
