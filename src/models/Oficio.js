import db from '../database/db.js';
import { Perito } from './Perito.js';

export class Oficio {
  static async findAll() {
    try {
      const [oficios] = await db.promise().query(
        `SELECT o.*, tp.nombre_prioridad, td.nombre_departamento as especialidad
         FROM oficio o
         LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
         LEFT JOIN tipo_departamento td ON o.id_especialidad_requerida = td.id_tipo_departamento
         ORDER BY o.fecha_creacion DESC`
      );
      return { success: true, data: oficios };
    } catch (error) {
      console.error('Error en findAll:', error);
      return { success: false, message: "Error al obtener oficios" };
    }
  }

  static async getTodosLosCasos({ estado = 'pendiente' }) {
    try {
      let estadoFilter = '';
      // Por defecto, se muestran los pendientes. Si estado es 'todos', no se aplica filtro.
      if (estado === 'pendiente') {
        estadoFilter = "AND (s.estado_nuevo IS NULL OR s.estado_nuevo NOT IN ('COMPLETADO', 'CERRADO'))";
      }

      const query = `
        SELECT 
          o.id_oficio,
          o.numero_oficio,
          o.fecha_creacion,
          o.asunto,
          o.examinado_incriminado as administrado,
          s.estado_nuevo AS estado_actual,
          u.nombre_completo AS perito_asignado
        FROM oficio o
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo, s1.fecha_seguimiento, s1.id_usuario
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
        LEFT JOIN usuario u ON o.id_usuario_perito_asignado = u.id_usuario
        WHERE 1=1 ${estadoFilter}
        ORDER BY o.fecha_creacion DESC
      `;

      const [rows] = await db.promise().query(query);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error en getTodosLosCasos:', error);
      return { success: false, message: 'Error al obtener todos los casos' };
    }
  }

  static async getCasosPorCreador(id_creador, { estado = 'pendiente' }) {
    try {
      let estadoFilter = '';
      if (estado === 'pendiente') {
        estadoFilter = "AND (s.estado_nuevo IS NULL OR s.estado_nuevo NOT IN ('COMPLETADO', 'CERRADO'))";
      }

      const query = `
        SELECT 
          o.id_oficio,
          o.numero_oficio,
          o.fecha_creacion,
          o.asunto,
          o.examinado_incriminado as administrado,
          s.estado_nuevo AS estado_actual,
          u.nombre_completo AS perito_asignado
        FROM oficio o
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo, s1.fecha_seguimiento, s1.id_usuario
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
        LEFT JOIN usuario u ON o.id_usuario_perito_asignado = u.id_usuario
        WHERE o.creado_por = ? ${estadoFilter}
        ORDER BY o.fecha_creacion DESC
      `;

      const [rows] = await db.promise().query(query, [id_creador]);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error en getCasosPorCreador:', error);
      return { success: false, message: 'Error al obtener los casos por creador' };
    }
  }

  static async getRecentCasosPorCreador(id_creador, limit = 5) {
    try {
      const query = `
        SELECT 
          o.id_oficio,
          o.numero_oficio,
          o.asunto,
          s.estado_nuevo AS estado_actual
        FROM oficio o
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
        WHERE o.creado_por = ?
        ORDER BY o.fecha_creacion DESC
        LIMIT ?
      `;

      const [rows] = await db.promise().query(query, [id_creador, limit]);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error en getRecentCasosPorCreador:', error);
      return { success: false, message: 'Error al obtener los casos recientes por creador' };
    }
  }

  static async getStatsForMesaDePartes(id_creador) {
    try {
      const statsQuery = `
        SELECT 
          SUM(CASE WHEN DATE(o.fecha_creacion) = CURDATE() THEN 1 ELSE 0 END) as creados_hoy,
          SUM(CASE WHEN s.estado_nuevo NOT IN ('COMPLETADO', 'CERRADO') OR s.estado_nuevo IS NULL THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN s.estado_nuevo IN ('COMPLETADO', 'CERRADO') THEN 1 ELSE 0 END) as finalizados
        FROM oficio o
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
        WHERE o.creado_por = ?
      `;
      
      const [rows] = await db.promise().query(statsQuery, [id_creador]);
      // Los resultados de SUM pueden ser null si no hay filas, así que los convertimos a 0
      const stats = {
        creados_hoy: Number(rows[0].creados_hoy) || 0,
        pendientes: Number(rows[0].pendientes) || 0,
        finalizados: Number(rows[0].finalizados) || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error en getStatsForMesaDePartes:', error);
      return { success: false, message: 'Error al obtener las estadísticas' };
    }
  }


  static async getCountNewOficios({ id_usuario = null, CIP = null }) {
  try {
    const params = [];
    let userCond = '';
    
    if (id_usuario) {
      userCond = 'o.id_usuario_perito_asignado = ?';
      params.push(id_usuario);
    }
    if (CIP) {
      if (userCond) userCond += ' OR ';
      userCond += `o.id_usuario_perito_asignado = (SELECT id_usuario FROM usuario WHERE CIP = ?)`;
      params.push(CIP);
    }
    if (!userCond) {
      return { success: false, message: 'Se requiere id_usuario o CIP' };
    }

    const query = `
      SELECT COUNT(*) AS count_new_oficios
      FROM oficio o
      WHERE (${userCond})
      AND o.id_oficio NOT IN (
        SELECT DISTINCT id_oficio 
        FROM seguimiento_oficio 
        WHERE estado_nuevo IN ('OFICIO VISTO', 'OFICIO EN PROCESO', 'COMPLETADO')
      )
    `;

    const [rows] = await db.promise().query(query, params);
    return { success: true, data: rows[0].count_new_oficios };
  } catch (error) {
    console.error('Error en getCountNewOficios:', error);
    return { success: false, message: "Error al obtener el conteo de nuevos oficios" };
  }
}

  static async findById(id_oficio) {
    try {
      const [oficios] = await db.promise().query(
        `SELECT o.*, tp.nombre_prioridad, td.nombre_departamento as especialidad
         FROM oficio o
         LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
         LEFT JOIN tipo_departamento td ON o.id_especialidad_requerida = td.id_tipo_departamento
         WHERE o.id_oficio = ?`,
        [id_oficio]
      );
      
      if (oficios.length === 0) {
        return { success: false, message: "Oficio no encontrado" };
      }

      return { success: true, data: oficios[0] };
    } catch (error) {
      console.error('Error en findById:', error);
      return { success: false, message: "Error al obtener el oficio" };
    }
  }

  static async create(oficioData) {
    const connection = await db.promise().getConnection();
    
    try {
      await connection.beginTransaction();

      // Extraer los tipos de examen del objeto principal
      const { id_tipos_examen, tipos_examen, ...oficioPrincipalData } = oficioData;

      // --- VALIDACIONES ---
      const [perito] = await connection.query('SELECT id_usuario FROM usuario WHERE id_usuario = ?', [oficioPrincipalData.id_usuario_perito_asignado]);
      if (perito.length === 0) throw new Error('El perito asignado no existe.');

      const [especialidad] = await connection.query('SELECT id_tipo_departamento FROM tipo_departamento WHERE id_tipo_departamento = ?', [oficioPrincipalData.id_especialidad_requerida]);
      if (especialidad.length === 0) throw new Error('La especialidad requerida no existe.');

      // --- INSERCIÓN DEL OFICIO PRINCIPAL ---
      const [result] = await connection.query(
        `INSERT INTO oficio (
          numero_oficio, unidad_solicitante, unidad_remitente, region_fiscalia,
          tipo_de_muestra, asunto, examinado_incriminado, dni_examinado_incriminado,
          delito, direccion_implicado, celular_implicado,
          fecha_hora_incidente, especialidad_requerida, id_especialidad_requerida,
          muestra, perito_asignado, cip_perito_asignado, id_usuario_perito_asignado, 
          id_prioridad, creado_por, actualizado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          oficioPrincipalData.numero_oficio,
          oficioPrincipalData.unidad_solicitante,
          oficioPrincipalData.unidad_remitente,
          oficioPrincipalData.region_fiscalia,
          oficioPrincipalData.tipo_de_muestra,
          oficioPrincipalData.asunto,
          oficioPrincipalData.examinado_incriminado,
          oficioPrincipalData.dni_examinado_incriminado,
          oficioPrincipalData.delito,
          oficioPrincipalData.direccion_implicado,
          oficioPrincipalData.celular_implicado,
          oficioPrincipalData.fecha_hora_incidente,
          oficioPrincipalData.especialidad_requerida,
          oficioPrincipalData.id_especialidad_requerida,
          oficioPrincipalData.muestra,
          oficioPrincipalData.perito_asignado,
          oficioPrincipalData.cip_perito_asignado,
          oficioPrincipalData.id_usuario_perito_asignado,
          oficioPrincipalData.id_prioridad,
          oficioPrincipalData.creado_por,
          oficioPrincipalData.actualizado_por
        ]
      );
      
      const newOficioId = result.insertId;

      // --- INSERCIÓN EN TABLA PIVOTE oficio_examen ---
      if (Array.isArray(id_tipos_examen) && id_tipos_examen.length > 0) {
        const examenValues = id_tipos_examen.map(id_examen => [newOficioId, id_examen]);
        await connection.query(
          'INSERT INTO oficio_examen (id_oficio, id_tipo_de_examen) VALUES ?',
          [examenValues]
        );
      }

      // --- INSERCIÓN DEL PRIMER SEGUIMIENTO (CON CONDUCTOR) ---
      await connection.query(
        `INSERT INTO seguimiento_oficio (
          id_oficio, id_usuario, estado_nuevo, id_conductor
        ) VALUES (?, ?, 'CREACION DEL OFICIO', ?)`,
        [newOficioId, oficioPrincipalData.creado_por, oficioPrincipalData.id_usuario_perito_asignado]
      );

      await connection.commit();
      return { 
        success: true, 
        data: { 
          id_oficio: newOficioId,
          numero_oficio: oficioPrincipalData.numero_oficio 
        },
        message: "Oficio creado exitosamente" 
      };

    } catch (error) {
      await connection.rollback();
      console.error('ERROR DETALLADO EN Oficio.create:', error); // <-- LOG DE DEBUG
      return { 
        success: false, 
        message: error.message || "Error desconocido al crear el oficio",
      };
    } finally {
      connection.release();
    }
  }

  static async existsByNumero(numero_oficio) {
    try {
      const [rows] = await db.promise().query(
        `SELECT 1 as found FROM oficio WHERE numero_oficio = ? LIMIT 1`,
        [numero_oficio]
      );
      return { success: true, exists: Array.isArray(rows) && rows.length > 0 };
    } catch (error) {
      console.error('Error en existsByNumero:', error);
      return { success: false, message: 'Error al verificar número de oficio' };
    }
  }

  static async getSeguimiento(id_oficio) {
    try {
      const [seguimiento] = await db.promise().query(
        `SELECT s.*, u.nombre_completo as nombre_usuario
         FROM seguimiento_oficio s
         LEFT JOIN usuario u ON s.id_usuario = u.id_usuario
         WHERE s.id_oficio = ?
         ORDER BY s.fecha_seguimiento ASC`,
        [id_oficio]
      );
      
      return { success: true, data: seguimiento };
    } catch (error) {
      console.error('Error en getSeguimiento:', error);
      return { success: false, message: "Error al obtener el seguimiento" };
    }
  }

  static async findDetalleById(id_oficio) {
    const connection = await db.promise().getConnection();
    try {
      // Iniciar un array de promesas
      const promises = [];

      // Promesa 1: Obtener los datos principales del oficio
      const oficioPromise = connection.query(
        `SELECT 
          o.*, 
          tp.nombre_prioridad, 
          td.nombre_departamento as especialidad,
          u_creador.nombre_completo as nombre_creador,
          u_perito.nombre_completo as nombre_perito_actual
         FROM oficio o
         LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
         LEFT JOIN tipo_departamento td ON o.id_especialidad_requerida = td.id_tipo_departamento
         LEFT JOIN usuario u_creador ON o.creado_por = u_creador.id_usuario
         LEFT JOIN usuario u_perito ON o.id_usuario_perito_asignado = u_perito.id_usuario
         WHERE o.id_oficio = ?`,
        [id_oficio]
      );
      promises.push(oficioPromise);

      // Promesa 2: Obtener el historial de seguimiento completo
      const seguimientoPromise = connection.query(
        `SELECT 
          s.*, 
          u.nombre_completo as nombre_usuario, 
          c.nombre_completo as nombre_conductor,
          sec.nombre as nombre_seccion_usuario
         FROM seguimiento_oficio s
         LEFT JOIN usuario u ON s.id_usuario = u.id_usuario
         LEFT JOIN usuario c ON s.id_conductor = c.id_usuario
         LEFT JOIN usuario_seccion us ON u.id_usuario = us.id_usuario
         LEFT JOIN seccion sec ON us.id_seccion = sec.id_seccion
         WHERE s.id_oficio = ?
         ORDER BY s.fecha_seguimiento ASC`,
        [id_oficio]
      );
      promises.push(seguimientoPromise);

      // Promesa 3: Obtener los tipos de examen asociados
      const examenesPromise = connection.query(
        `SELECT te.nombre 
         FROM oficio_examen oe
         JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen
         WHERE oe.id_oficio = ?`,
        [id_oficio]
      );
      promises.push(examenesPromise);

      // Ejecutar todas las promesas en paralelo
      const [[oficioRows], [seguimientoRows], [examenesRows]] = await Promise.all(promises);

      if (oficioRows.length === 0) {
        return { success: false, message: "Oficio no encontrado" };
      }

      const oficio = oficioRows[0];
      oficio.seguimiento_historial = seguimientoRows;
      oficio.tipos_de_examen = examenesRows.map(e => e.nombre);

      return { success: true, data: oficio };

    } catch (error) {
      console.error('Error en findDetalleById:', error);
      return { success: false, message: "Error al obtener el detalle del oficio" };
    } finally {
      connection.release();
    }
  }

  // Buscar oficios asignados al usuario (por id_usuario o por CIP)
  static async findAssignedToUser({ id_usuario = null, CIP = null, excludeCompleted = true }) {
    try {
      const params = [];
      let userCond = '';
      if (id_usuario) {
        userCond = 'o.id_usuario_perito_asignado = ?';
        params.push(id_usuario);
      }
      if (CIP) {
        if (userCond) userCond += ' OR ';
        userCond += `o.id_usuario_perito_asignado = (SELECT id_usuario FROM usuario WHERE CIP = ?)`;
        params.push(CIP);
      }
      if (!userCond) {
        return { success: false, message: 'Se require id_usuario o CIP' };
      }

      // obtener último seguimiento por oficio
      const query = `
        SELECT o.*,
               tp.nombre_prioridad,
               td.nombre_departamento AS especialidad,
               s.estado_nuevo AS ultimo_estado,
               s.fecha_seguimiento AS ultimo_fecha,
               (SELECT GROUP_CONCAT(te.nombre SEPARATOR ', ') 
                FROM oficio_examen oe 
                JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen 
                WHERE oe.id_oficio = o.id_oficio) AS tipos_de_examen
        FROM oficio o
        LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
        LEFT JOIN tipo_departamento td ON o.id_especialidad_requerida = td.id_tipo_departamento
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo, s1.fecha_seguimiento
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
        WHERE (${userCond})
        ${excludeCompleted ? "AND (s.estado_nuevo IS NULL OR s.estado_nuevo != 'COMPLETADO')" : ""}
        ORDER BY s.fecha_seguimiento DESC, o.fecha_creacion DESC
      `;

      const [rows] = await db.promise().query(query, params);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error en findAssignedToUser:', error);
      return { success: false, message: 'Error al obtener oficios asignados' };
    }
  }

  static async findCasosPorFuncion({ perito, funcion }) {
    try {
      const id_perito = perito.id_usuario;
      const seccion_perito = perito.id_seccion; 

      const SECCIONES = { TOMA_MUESTRA: 1, LABORATORIO: 2, INSTRUMENTALIZACION: 3 };
      const EXAMENES = { TOXICOLOGICO: 1, DOSAJE_ETILICO: 2, SARRO_UNGUEAL: 3 };

      let queryWhere = 'WHERE o.id_usuario_perito_asignado = ?';
      const params = [id_perito];

      const baseQuery = `
        SELECT o.*,
               MAX(tp.nombre_prioridad) as nombre_prioridad,
               MAX(td.nombre_departamento) AS especialidad,
               MAX(s.estado_nuevo) AS ultimo_estado,
               MAX(s.fecha_seguimiento) AS ultimo_fecha,
               (SELECT GROUP_CONCAT(te.nombre SEPARATOR ', ') 
                FROM oficio_examen oe 
                JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen 
                WHERE oe.id_oficio = o.id_oficio) AS tipos_de_examen
        FROM oficio o
        LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
        LEFT JOIN tipo_departamento td ON o.id_especialidad_requerida = td.id_tipo_departamento
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo, s1.fecha_seguimiento
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
      `;

      switch (funcion) {
        // --- Lógica para Perito TM ---
        case 'extraccion':
          queryWhere += ` AND o.tipo_de_muestra = 'TOMA DE MUESTRAS' 
                          AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen != ?)`;
          params.push(EXAMENES.SARRO_UNGUEAL);
          break;
        case 'analisis_tm':
          queryWhere += ` AND o.tipo_de_muestra = 'MUESTRAS REMITIDAS' 
                          AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.SARRO_UNGUEAL);
          break;
        case 'extraccion_y_analisis':
          queryWhere += ` AND o.tipo_de_muestra = 'TOMA DE MUESTRAS' 
                          AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.SARRO_UNGUEAL);
          break;
        
        // --- Lógica para Perito INST ---
        case 'analisis_inst':
          queryWhere += ` AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.DOSAJE_ETILICO);
          break;

        // --- Lógica para Perito LAB ---
        case 'analisis_lab':
           queryWhere += ` AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)
                           AND s.estado_nuevo NOT LIKE 'DERIVADO A:%'`;
          params.push(EXAMENES.TOXICOLOGICO);
          break;
        case 'consolidacion':
          queryWhere += ` AND s.estado_nuevo LIKE 'DERIVADO A: LABORATORIO%'`;
          break;

        default:
          return { success: false, message: 'Función no reconocida' };
      }

      const finalQuery = `
        ${baseQuery}
        ${queryWhere}
        AND (s.estado_nuevo IS NULL OR s.estado_nuevo NOT IN ('COMPLETADO', 'CERRADO'))
        GROUP BY o.id_oficio
        ORDER BY o.fecha_creacion DESC
      `;

      const [rows] = await db.promise().query(finalQuery, params);
      return { success: true, data: rows };

    } catch (error) {
      console.error('Error en findCasosPorFuncion:', error);
      return { success: false, message: 'Error al obtener casos por función' };
    }
  }

  // Agregar seguimiento
  // (MODIFICADO para aceptar transacciones)
  static async addSeguimiento({ id_oficio, id_usuario, estado_anterior = null, estado_nuevo = null }, connection = null) {
    // Si no se pasa una conexión, usa el pool por defecto. Si se pasa, usa la transacción.
    const dbConn = connection || db.promise();
    
    try {
      const [result] = await dbConn.query(
        `INSERT INTO seguimiento_oficio (id_oficio, id_usuario, estado_anterior, estado_nuevo)
         VALUES (?, ?, ?, ?)`,
        [id_oficio, id_usuario, estado_anterior, estado_nuevo]
      );
      
      return { success: true, data: { id_seguimiento: result.insertId } };

    } catch (error) {
      console.error('Error en addSeguimiento:', error);
      // Si estamos en una transacción, solo propagamos el error sin lanzar
      if (connection) throw error; 
      
      return { success: false, message: 'Error al agregar seguimiento' };
    }
    // No liberamos la conexión si es una transacción externa
  }
  /**
   * Reasigna un oficio a un nuevo perito y actualiza el estado de seguimiento.
   * Se ejecuta como una transacción para asegurar la integridad de los datos.
   * @param {number} id_oficio - ID del oficio a reasignar
   * @param {number} id_nuevo_perito - ID del usuario (perito) que recibe el caso
   * @param {number} id_perito_actual - ID del usuario (perito) que deriva el caso
   * @param {string} nombre_seccion_destino - Nombre de la sección a la que se deriva
   */
  static async reasignarPerito(id_oficio, id_nuevo_perito, id_perito_actual, nombre_seccion_destino = 'OTRA SECCIÓN') {
    const connection = await db.promise().getConnection(); // Obtener una conexión para la transacción
    try {
      await connection.beginTransaction(); // Iniciar transacción

      // 1. Obtener los datos del nuevo perito
      const [peritoInfo] = await connection.query(
        'SELECT nombre_completo, CIP FROM usuario WHERE id_usuario = ?',
        [id_nuevo_perito]
      );

      if (peritoInfo.length === 0) {
        throw new Error('El perito de destino no existe (ID: ' + id_nuevo_perito + ')');
      }

      // 2. Actualizar el perito asignado en la tabla principal 'oficio'
      await connection.query(
        `UPDATE oficio SET 
           id_usuario_perito_asignado = ?,
           perito_asignado = ?,
           cip_perito_asignado = ?
         WHERE id_oficio = ?`,
        [
          id_nuevo_perito,
          peritoInfo[0].nombre_completo,
          peritoInfo[0].CIP,
          id_oficio
        ]
      );

      // 3. Añadir un registro en 'seguimiento_oficio'
      const nuevo_estado = `DERIVADO A: ${String(nombre_seccion_destino).toUpperCase()}`;
      
      // Llamamos a addSeguimiento PASÁNDOLE la conexión de la transacción
      await Oficio.addSeguimiento({
        id_oficio: id_oficio,
        id_usuario: id_perito_actual, // El perito que HACE la derivación
        estado_nuevo: nuevo_estado,
        estado_anterior: null // addSeguimiento manejará esto
      }, connection); 

      await connection.commit(); // Confirmar transacción
      
      return { 
        success: true, 
        message: 'Oficio reasignado y seguimiento actualizado.' 
      };

    } catch (error) {
      await connection.rollback(); // Revertir en caso de error
      console.error('Error en Oficio.reasignarPerito:', error);
      throw error; // Propagar el error al controlador
    } finally {
      connection.release(); // Liberar la conexión al pool
    }
  }

  /**
   * Agrega el resultado de un examen de un perito a un oficio.
   * @param {object} resultadoData - Datos del resultado.
   * @param {number} resultadoData.id_oficio - ID del oficio.
   * @param {number} resultadoData.id_perito_responsable - ID del perito que emite el resultado.
   * @param {string} resultadoData.tipo_resultado - Ej: 'TOXICOLOGICO', 'DOSAJE_ETILICO'.
   * @param {object} resultadoData.resultados - Objeto JSON con los hallazgos.
   */
  static async addResultado({ id_oficio, id_perito_responsable, tipo_resultado, resultados }) {
    try {
      // Validar que los datos necesarios están presentes
      if (!id_oficio || !id_perito_responsable || !tipo_resultado || !resultados) {
        throw new Error('Faltan datos requeridos para agregar el resultado.');
      }

      const [result] = await db.promise().query(
        `INSERT INTO oficio_resultados_perito (id_oficio, id_perito_responsable, tipo_resultado, resultados)
         VALUES (?, ?, ?, ?)`,
        [id_oficio, id_perito_responsable, tipo_resultado, JSON.stringify(resultados)]
      );

      return { success: true, data: { id_resultado: result.insertId } };
    } catch (error) {
      console.error('Error en Oficio.addResultado:', error);
      // Lanza el error para que el controlador lo maneje
      throw error;
    }
  }

  /**
   * Busca todos los resultados asociados a un ID de oficio.
   * @param {number} id_oficio - ID del oficio principal
   */
  static async getResultados(id_oficio) {
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
        
        JOIN usuario u ON r.id_perito_responsable = u.id_usuario
        
        LEFT JOIN usuario_seccion us ON u.id_usuario = us.id_usuario
        LEFT JOIN seccion s ON us.id_seccion = s.id_seccion

        WHERE r.id_oficio = ?
        ORDER BY r.fecha_creacion ASC;
      `;

      const [rows] = await db.promise().query(query, [id_oficio]);

      // Devuelve los datos crudos para que el servicio los procese
      return rows;

    } catch (error) {
      console.error('Error en Oficio.getResultados:', error);
      throw error;
    }
  }

  /**
   * Obtiene los nombres de todos los exámenes requeridos para un oficio.
   * @param {number} id_oficio - El ID del oficio.
   * @returns {Promise<string[]>} Un array con los nombres de los exámenes.
   */
  static async getExamenesRequeridos(id_oficio) {
    try {
      const [examenesRows] = await db.promise().query(
        `SELECT te.nombre 
         FROM oficio_examen oe
         JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen
         WHERE oe.id_oficio = ?`,
        [id_oficio]
      );
      return examenesRows.map(e => e.nombre);
    } catch (error) {
      console.error('Error en getExamenesRequeridos:', error);
      throw error;
    }
  }

  /**
   * Encuentra peritos elegibles para la derivación basados en la lógica de negocio del flujo de trabajo.
   * @param {number} id_oficio - El ID del oficio actual.
   */
  static async findPeritosParaDerivacion(id_oficio) {
    const connection = await db.promise().getConnection();
    try {
      // Definir IDs de Secciones y Exámenes para claridad
      const SECCIONES = { TOMA_MUESTRA: 1, LABORATORIO: 2, INSTRUMENTALIZACION: 3 };
      const EXAMENES = { TOXICOLOGICO: 1, DOSAJE_ETILICO: 2, SARRO_UNGUEAL: 3 };

      // Mapa de qué sección se encarga de qué examen
      const examenToSeccionMap = {
        [EXAMENES.TOXICOLOGICO]: SECCIONES.LABORATORIO,
        [EXAMENES.DOSAJE_ETILICO]: SECCIONES.INSTRUMENTALIZACION,
        [EXAMENES.SARRO_UNGUEAL]: SECCIONES.TOMA_MUESTRA, 
      };

      // Paso 1: Obtener los exámenes requeridos para el oficio
      const [examenesReqRows] = await connection.query(
        'SELECT id_tipo_de_examen FROM oficio_examen WHERE id_oficio = ?',
        [id_oficio]
      );
      const examenesRequeridosIds = examenesReqRows.map(r => r.id_tipo_de_examen);

      if (examenesRequeridosIds.length === 0) {
        return { success: false, message: 'El caso no tiene exámenes requeridos.' };
      }

      // Paso 2: Obtener los resultados parciales ya registrados para saber qué falta
      const [resultadosParcialesRows] = await connection.query(
        'SELECT tipo_resultado FROM oficio_resultados_perito WHERE id_oficio = ?',
        [id_oficio]
      );
      // Asumimos que 'tipo_resultado' corresponde al nombre del examen, ej. 'SARRO UNGUEAL'
      const examenesCompletadosNombres = resultadosParcialesRows.map(r => r.tipo_resultado.toUpperCase());

      // Paso 3: Determinar las secciones de los exámenes pendientes
      const seccionesPendientes = new Set();
      for (const idExamen of examenesRequeridosIds) {
        // Necesitamos el nombre del examen para compararlo con los resultados
        const [examenRows] = await connection.query('SELECT nombre FROM tipo_de_examen WHERE id_tipo_de_examen = ?', [idExamen]);
        const nombreExamen = examenRows[0]?.nombre.toUpperCase();

        if (nombreExamen && !examenesCompletadosNombres.includes(nombreExamen)) {
          const idSeccionRequerida = examenToSeccionMap[idExamen];
          if (idSeccionRequerida) {
            seccionesPendientes.add(idSeccionRequerida);
          }
        }
      }

      let idSeccionDestino;
      if (seccionesPendientes.size > 0) {
        // Si hay varias secciones pendientes, derivar a la primera del flujo (TM > LAB > INST)
        if (seccionesPendientes.has(SECCIONES.TOMA_MUESTRA)) {
          idSeccionDestino = SECCIONES.TOMA_MUESTRA;
        } else if (seccionesPendientes.has(SECCIONES.LABORATORIO)) {
          idSeccionDestino = SECCIONES.LABORATORIO;
        } else {
          idSeccionDestino = SECCIONES.INSTRUMENTALIZACION;
        }
      } else {
        // Si no hay exámenes pendientes, todo debe ir a Laboratorio para consolidación final
        idSeccionDestino = SECCIONES.LABORATORIO;
      }

      // Paso 4: Encontrar todos los peritos de la sección destino
      const result = await Perito.findCargaTrabajoPorSeccion(idSeccionDestino);
      return result;

    } catch (error) {
      console.error('Error en findPeritosParaDerivacion:', error);
      return { success: false, message: 'Error al buscar peritos para derivación.' };
    } finally {
            connection.release();
          }
        }
      }
      