import { Oficio } from '../models/Oficio.js';
import { Muestra } from '../models/Muestra.js';

const TIPO_MUESTRA_CODIGOS = {
  'Sangre': 'SAN',
  'Orina': 'ORI',
  'Hisopo Ungueal': 'HIS',
  'Visceras': 'VIS',
  'Cabello': 'CAB',
  'Otro': 'OTR',
};

export class MuestraService {
  /**
   * Genera un código de muestra único y estandarizado.
   * Formato: [NumeroOficio]-[TIPO]-[SECUENCIA]
   * Ejemplo: 0123-2025-SAN-01
   * @param {number} id_oficio - El ID del oficio al que pertenece la muestra.
   * @param {string} tipo_muestra - El tipo de muestra (ej. 'Sangre', 'Orina').
   * @returns {Promise<string>} El código de muestra generado.
   */
  static async generarCodigoMuestra(id_oficio, tipo_muestra) {
    // 1. Obtener el número de oficio
    const oficioData = await Oficio.findById(id_oficio);
    if (!oficioData.success || !oficioData.data) {
      throw new Error('No se pudo encontrar el oficio para generar el código de muestra.');
    }
    const numeroOficio = oficioData.data.numero_oficio;

    // 2. Obtener el código de 3 letras para el tipo de muestra
    const codigoTipo = TIPO_MUESTRA_CODIGOS[tipo_muestra] || 'OTR';

    // 3. Contar cuántas muestras de este tipo ya existen para obtener la secuencia
    const count = await Muestra.countByType(id_oficio, tipo_muestra);
    const secuencia = (count + 1).toString().padStart(2, '0');

    // 4. Ensamblar el código final
    const codigoFinal = `${numeroOficio}-${codigoTipo}-${secuencia}`;

    return codigoFinal;
  }
}
