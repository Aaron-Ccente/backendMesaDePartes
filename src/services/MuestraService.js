import { Oficio } from '../models/Oficio.js';
import { Muestra } from '../models/Muestra.js';

export class MuestraService {
  /**
   * Genera un código de muestra único y estandarizado.
   * Formato: [NumeroOficio]-[SECUENCIA]
   * Ejemplo: 0123-2025-01
   * @param {number} id_oficio - El ID del oficio al que pertenece la muestra.
   * @param {object} connection - Objeto de conexión de DB para transacciones.
   * @returns {Promise<string>} El código de muestra generado.
   */
  static async generarCodigoMuestra(id_oficio, connection = null) {
    // 1. Obtener el número de oficio
    const oficioData = await Oficio.findById(id_oficio, connection);
    if (!oficioData.success || !oficioData.data) {
      throw new Error('No se pudo encontrar el oficio para generar el código de muestra.');
    }
    // Limpiar el número de oficio por si tiene caracteres no deseados
    const numeroOficio = oficioData.data.numero_oficio.replace(/\s+/g, '-');

    // 2. Contar TODAS las muestras que ya existen para obtener la secuencia
    const count = await Muestra.countAllByOficio(id_oficio, connection);
    const secuencia = (count + 1).toString().padStart(2, '0');

    // 3. Ensamblar el código final
    const codigoFinal = `${numeroOficio}-${secuencia}`;

    return codigoFinal;
  }
}
