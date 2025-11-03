// backend/src/models/OficioResultados.js
import db from '../database/db.js';

export class OficioResultados {

  /**
   * Crea un nuevo registro de resultado para un oficio.
   * @param {object} data - Datos del resultado
   * @param {number} data.id_oficio - ID del oficio principal
   * @param {number} data.id_perito_responsable - ID del usuario (perito) que registra
   * @param {string} data.tipo_resultado - Tipo de resultado (ej. "TOMA_MUESTRA", "DOSAJE_ETILICO")
   * @param {object} data.resultados - Objeto JSON con los hallazgos (ej: {"Alcaloide Cocaína": "NEGATIVO"})
   */
  static async create(data) {
    const { 
      id_oficio, 
      id_perito_responsable, 
      tipo_resultado, 
      resultados 
    } = data;

    if (!id_oficio || !id_perito_responsable || !tipo_resultado || !resultados) {
      throw new Error('id_oficio, id_perito_responsable, tipo_resultado y resultados son requeridos');
    }

    try {
      // Guardamos los resultados como una cadena JSON
      const resultadosJSON = JSON.stringify(resultados);

      const query = `
        INSERT INTO oficio_resultados_perito (
          id_oficio, 
          id_perito_responsable, 
          tipo_resultado, 
          resultados
        ) VALUES (?, ?, ?, ?)
      `;
      
      const [result] = await db.promise().query(query, [
        id_oficio,
        id_perito_responsable,
        tipo_resultado,
        resultadosJSON
      ]);

      return { 
        success: true, 
        id: result.insertId,
        message: 'Resultado guardado exitosamente' 
      };

    } catch (error) {
      console.error('Error en OficioResultados.create:', error);
      throw error;
    }
  }

  /**
   * Busca todos los resultados asociados a un ID de oficio.
   * @param {number} id_oficio - ID del oficio principal
   */
  static async findByOficioId(id_oficio) {
    if (!id_oficio) {
      throw new Error('El id_oficio es requerido');
    }

    try {
      const query = `
        SELECT 
          r.id_resultado,
          r.id_oficio,
          r.id_perito_responsable,
          u.nombre_completo as nombre_perito,
          s.nombre as nombre_seccion,
          r.tipo_resultado,
          r.resultados,
          r.fecha_creacion
        FROM oficio_resultados_perito r
        
        -- Unir con usuario para obtener el nombre del perito
        JOIN usuario u ON r.id_perito_responsable = u.id_usuario
        
        -- Unir con sección para saber qué sección registró
        LEFT JOIN usuario_seccion us ON u.id_usuario = us.id_usuario
        LEFT JOIN seccion s ON us.id_seccion = s.id_seccion

        WHERE r.id_oficio = ?
        ORDER BY r.fecha_creacion ASC;
      `;

      const [rows] = await db.promise().query(query, [id_oficio]);

      // Convertir la cadena JSON de 'resultados' de nuevo a un objeto
      const resultados = rows.map(row => {
        try {
          row.resultados = JSON.parse(row.resultados);
        } catch (e) {
          console.warn(`Error parseando JSON para resultado ID ${row.id_resultado}:`, row.resultados);
          row.resultados = { error: "Formato de resultado inválido en la BD." };
        }
        return row;
      });

      return { success: true, data: resultados };

    } catch (error) {
      console.error('Error en OficioResultados.findByOficioId:', error);
      throw error;
    }
  }
}
