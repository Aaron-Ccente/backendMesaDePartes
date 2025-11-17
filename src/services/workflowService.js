import { Oficio } from '../models/Oficio.js';
import { Perito } from '../models/Perito.js';

// Constantes para evitar "números mágicos" y facilitar mantenimiento
const SECCIONES = {
  TOMA_MUESTRA: { id: 1, nombre: 'Toma de Muestra' },
  LABORATORIO: { id: 2, nombre: 'Laboratorio' },
  INSTRUMENTALIZACION: { id: 3, nombre: 'Instrumentalización' },
};

const EXAMEN_A_SECCION = {
  'Sarro Ungueal': SECCIONES.TOMA_MUESTRA,
  'Toxicológico': SECCIONES.LABORATORIO,
  'Dosaje Etílico': SECCIONES.INSTRUMENTALIZACION,
};

// Orden de prioridad definido por la lógica de negocio
const ORDEN_PRIORIDAD = [
  SECCIONES.TOMA_MUESTRA,
  SECCIONES.LABORATORIO,
  SECCIONES.INSTRUMENTALIZACION,
];

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/ /g, '_');
};

export class WorkflowService {
  /**
   * Determina el siguiente paso lógico para un oficio, identificando la sección
   * de destino y los peritos disponibles con menor carga de trabajo.
   *
   * @param {number} id_oficio - El ID del oficio a analizar.
   * @returns {Promise<object>} Un objeto que indica el siguiente paso.
   */
  static async determinarSiguientePaso(id_oficio) {
    try {
      // 1. Obtener los exámenes requeridos y los resultados ya presentados
      const [examenesRequeridos, resultadosEnviados] = await Promise.all([
        Oficio.getExamenesRequeridos(id_oficio),
        Oficio.getResultados(id_oficio),
      ]);

      const nombresResultados = new Set(resultadosEnviados.map(r => normalizeString(r.tipo_resultado)));

      // 2. Determinar qué exámenes están pendientes
      const examenesPendientes = examenesRequeridos.filter(
        examen => !nombresResultados.has(normalizeString(examen))
      );

      // 3. Si no hay exámenes pendientes, el caso debe ir a consolidación
      if (examenesPendientes.length === 0) {
        // La consolidación siempre ocurre en Laboratorio
        const peritosDisponibles = await Perito.findCargaTrabajoPorSeccion(SECCIONES.LABORATORIO.id);
        return {
          next_step: 'CONSOLIDATE',
          section_id: SECCIONES.LABORATORIO.id,
          section_name: SECCIONES.LABORATORIO.nombre,
          reason: 'Todos los análisis han sido completados, listo para la consolidación final.',
          peritos_disponibles: peritosDisponibles.data || [],
        };
      }

      // 4. Aplicar la lógica de prioridad para encontrar el siguiente paso
      let seccionDestino = null;
      for (const seccionPrioritaria of ORDEN_PRIORIDAD) {
        const examenDeEstaSeccion = Object.keys(EXAMEN_A_SECCION).find(
          examen => EXAMEN_A_SECCION[examen].id === seccionPrioritaria.id
        );

        if (examenesPendientes.includes(examenDeEstaSeccion)) {
          seccionDestino = seccionPrioritaria;
          break; // Encontramos la sección de mayor prioridad pendiente
        }
      }

      // 5. Si se encontró una sección de destino, buscar peritos disponibles
      if (seccionDestino) {
        const peritosDisponibles = await Perito.findCargaTrabajoPorSeccion(seccionDestino.id);
        const examenPendiente = examenesPendientes.find(e => EXAMEN_A_SECCION[e]?.id === seccionDestino.id);

        return {
          next_step: 'ASSIGN_TO_SECTION',
          section_id: seccionDestino.id,
          section_name: seccionDestino.nombre,
          reason: `Examen ${examenPendiente} pendiente.`,
          peritos_disponibles: peritosDisponibles.data || [],
        };
      }

      // 6. Caso fallback: si algo sale mal, indicar que no hay más pasos.
      return {
        next_step: 'WORKFLOW_COMPLETE',
        reason: 'No se pudo determinar un siguiente paso lógico. Revisar configuración.',
      };

    } catch (error) {
      console.error('Error en WorkflowService.determinarSiguientePaso:', error);
      throw new Error('Error al determinar el siguiente paso del flujo de trabajo.');
    }
  }

  /**
   * Determina la asignación inicial de un perito basado en los exámenes requeridos.
   * @param {number[]} id_tipos_examen - Array de IDs de los tipos de examen.
   * @returns {Promise<object|null>} El objeto del perito a asignar o null si no se encuentra.
   */
  static async determinarAsignacionInicial(id_tipos_examen) {
    try {
      if (!id_tipos_examen || id_tipos_examen.length === 0) {
        throw new Error('Se requieren tipos de examen para la asignación inicial.');
      }

      // Mapeo directo y robusto de ID de Examen a ID de Sección
      const EXAMEN_ID_A_SECCION_ID = {
        '1': SECCIONES.LABORATORIO.id,      // Toxicológico -> LAB
        '2': SECCIONES.INSTRUMENTALIZACION.id, // Dosaje Etílico -> INST
        '3': SECCIONES.TOMA_MUESTRA.id,       // Sarro Ungueal -> TM
      };

      const seccionesRequeridas = new Set(
        id_tipos_examen.map(id => EXAMEN_ID_A_SECCION_ID[id]).filter(Boolean)
      );

      if (seccionesRequeridas.size === 0) {
        return []; // No se encontró una sección para los exámenes dados
      }
      
      let seccionDestinoId = null;
      // Encontrar la sección de mayor prioridad según el orden definido
      for (const seccion of ORDEN_PRIORIDAD) {
        if (seccionesRequeridas.has(seccion.id)) {
          seccionDestinoId = seccion.id;
          break;
        }
      }

      if (!seccionDestinoId) {
        return []; // No se pudo determinar una sección de destino
      }

      const peritosDisponibles = await Perito.findCargaTrabajoPorSeccion(seccionDestinoId);
      
      return peritosDisponibles.data || []; // Devolver la lista completa de peritos

    } catch (error) {
      console.error('Error en determinarAsignacionInicial:', error);
      throw error;
    }
  }
}

