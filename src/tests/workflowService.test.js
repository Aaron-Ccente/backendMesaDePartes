import { jest, describe, test, expect, afterEach } from '@jest/globals';
import { WorkflowService } from '../services/workflowService.js';
import { Oficio } from '../models/Oficio.js';
import { Perito } from '../models/Perito.js';

// Mock de los módulos para aislar el servicio en las pruebas
jest.mock('../models/Oficio.js');
jest.mock('../models/Perito.js');

describe('WorkflowService', () => {
  afterEach(() => {
    jest.restoreAllMocks(); // Usar restoreAllMocks para limpiar los mocks
  });

  // Test 1: Derivación de TM a LAB
  test('debería determinar que el siguiente paso es Laboratorio cuando TM completa su parte', async () => {
    const id_oficio = 1;
    // Asignar mocks directamente a los métodos estáticos de las clases importadas
    Oficio.getExamenesRequeridos = jest.fn().mockResolvedValue(['Sarro Ungueal', 'Toxicológico']);
    Oficio.getResultados = jest.fn().mockResolvedValue([{ tipo_resultado: 'SARRO_UNGUEAL' }]);
    Perito.findCargaTrabajoPorSeccion = jest.fn().mockResolvedValue({ data: [{ id_usuario: 10, nombre_completo: 'Perito LAB' }] });

    const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

    expect(siguientePaso.next_step).toBe('ASSIGN_TO_SECTION');
    expect(siguientePaso.section_id).toBe(2); // ID de Laboratorio
    expect(siguientePaso.reason).toContain('Examen Toxicológico pendiente');
    expect(siguientePaso.peritos_disponibles).toHaveLength(1);
    expect(siguientePaso.peritos_disponibles[0].id_usuario).toBe(10);
  });

  // Test 2: Derivación de INST a LAB
  test('debería determinar que el siguiente paso es Laboratorio cuando INST completa su parte', async () => {
    const id_oficio = 2;
    Oficio.getExamenesRequeridos = jest.fn().mockResolvedValue(['Dosaje Etílico', 'Toxicológico']);
    Oficio.getResultados = jest.fn().mockResolvedValue([{ tipo_resultado: 'DOSAJE_ETILICO' }]);
    Perito.findCargaTrabajoPorSeccion = jest.fn().mockResolvedValue({ data: [{ id_usuario: 11, nombre_completo: 'Perito Consolidado' }] });

    const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

    expect(siguientePaso.next_step).toBe('ASSIGN_TO_SECTION');
    expect(siguientePaso.section_id).toBe(2); // ID de Laboratorio
    expect(siguientePaso.reason).toContain('Examen Toxicológico pendiente');
  });

  // Test 3: Flujo completo, listo para consolidación en LAB
  test('debería determinar que el siguiente paso es Consolidar en Laboratorio', async () => {
    const id_oficio = 3;
    Oficio.getExamenesRequeridos = jest.fn().mockResolvedValue(['Dosaje Etílico', 'Toxicológico']);
    Oficio.getResultados = jest.fn().mockResolvedValue([
      { tipo_resultado: 'DOSAJE_ETILICO' },
      { tipo_resultado: 'TOXICOLOGICO' }
    ]);
    Perito.findCargaTrabajoPorSeccion = jest.fn().mockResolvedValue({ data: [{ id_usuario: 12, nombre_completo: 'Perito Final' }] });

    const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

    expect(siguientePaso.next_step).toBe('CONSOLIDATE');
    expect(siguientePaso.section_id).toBe(2); // Consolidación siempre en LAB
    expect(siguientePaso.reason).toContain('Todos los análisis han sido completados');
  });

  // Test 4: Flujo simple, solo un examen que se completa
  test('debería determinar que el flujo necesita consolidación en LAB si el único examen se finaliza', async () => {
    const id_oficio = 4;
    Oficio.getExamenesRequeridos = jest.fn().mockResolvedValue(['Dosaje Etílico']);
    Oficio.getResultados = jest.fn().mockResolvedValue([{ tipo_resultado: 'DOSAJE_ETILICO' }]);
    Perito.findCargaTrabajoPorSeccion = jest.fn().mockResolvedValue({ data: [] });

    const siguientePaso = await WorkflowService.determinarSiguientePaso(id_oficio);

    // Como INST no puede consolidar, lo envía a LAB para cierre.
    expect(siguientePaso.next_step).toBe('CONSOLIDATE');
    expect(siguientePaso.section_id).toBe(2); // Laboratorio
    expect(siguientePaso.reason).toContain('listo para la consolidación final');
  });
});
