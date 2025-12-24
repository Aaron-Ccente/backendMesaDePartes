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

  static async findAllForAdminViewer() {
    try {
      const query = `
        SELECT 
            o.id_oficio,
            o.numero_oficio,
            o.fecha_creacion,
            o.examinado_incriminado,
            s.estado_nuevo AS ultimo_estado
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
        ORDER BY o.fecha_creacion DESC
      `;
      const [oficios] = await db.promise().query(query);
      return { success: true, data: oficios };
    } catch (error) {
      console.error('Error en findAllForAdminViewer:', error);
      return { success: false, message: "Error al obtener la lista de oficios para admin" };
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

  static async getCasosPorCreador({ estado = 'pendiente' }) {
    try {
      let estadoFilter = '';
      if (estado === 'pendiente') {
        estadoFilter = "WHERE s.estado_nuevo IS NULL OR s.estado_nuevo NOT IN ('COMPLETADO', 'CERRADO')";
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
        ${estadoFilter}
        ORDER BY o.fecha_creacion DESC
      `;

      const [rows] = await db.promise().query(query);
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

  static async modificarOficioAdmin(query, params) {
  try {
    console.log('Ejecutando query:', query);
    console.log('Con parámetros:', params);
    
    const [result] = await db.promise().query(query, params);
    
    console.log('Resultado de la query:', result);
    
    if (result.affectedRows === 0) {
      return { success: false, message: 'Oficio no encontrado o sin cambios' };
    }
    return { success: true, message: 'Oficio actualizado correctamente' };
  } catch (error) {
    console.error('Error en modificarOficioAdmin:', error);
    return { 
      success: false, 
      message: 'Error al actualizar el oficio',
      error: error.message 
    };
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
    let userId;
    if (id_usuario) {
      userId = id_usuario;
    } else if (CIP) {
      const queryUser = 'SELECT id_usuario FROM usuario WHERE CIP = ? LIMIT 1';
      const [userRows] = await db.promise().query(queryUser, [CIP]);
      userId = userRows[0]?.id_usuario;
    } else {
      return { success: false, message: 'Se requiere id_usuario o CIP' };
    }

    if (!userId) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    // Se considera solo el ultimo estado
    const query = `
      SELECT COUNT(*) AS count_new_oficios
      FROM oficio o
      WHERE o.id_usuario_perito_asignado = ?
      AND NOT EXISTS (
        -- Subconsulta para obtener el último estado de cada oficio
        SELECT 1 
        FROM seguimiento_oficio so
        WHERE so.id_oficio = o.id_oficio
        AND so.id_seguimiento = (
          SELECT MAX(so2.id_seguimiento)
          FROM seguimiento_oficio so2
          WHERE so2.id_oficio = so.id_oficio
        )
        AND so.estado_nuevo IN (
          'OFICIO VISTO',
          'COMPLETADO', 
          'DICTAMEN_EMITIDO',
          'LISTO_PARA_RECOJO',
          'ENTREGADO_Y_ARCHIVADO'
        )
      )
    `;

    const [rows] = await db.promise().query(query, [userId]);
    return { 
      success: true, 
      data: rows[0].count_new_oficios
    };
  } catch (error) {
    console.error('Error en getCountNewOficios:', error);
    return { success: false, message: "Error al obtener el conteo de nuevos oficios" };
  }
}

  static async findById(id_oficio, connection = null) {
    const conn = connection || db.promise();
    try {
      const [oficios] = await conn.query(
        `SELECT 
            o.*, 
            tp.nombre_prioridad, 
            td.nombre_departamento AS especialidad,
            GROUP_CONCAT(te.nombre SEPARATOR ', ') AS tipos_de_examenes
        FROM oficio o
        LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
        LEFT JOIN tipo_departamento td ON o.id_especialidad_requerida = td.id_tipo_departamento
        LEFT JOIN oficio_examen oe ON o.id_oficio = oe.id_oficio
        LEFT JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen
        WHERE o.id_oficio = ?
        GROUP BY o.id_oficio;
        `,
        [id_oficio]
      );

      if (oficios.length === 0) {
        return { success: false, message: "Oficio no encontrado" };
      }

      return { success: true, data: oficios[0] };
    } catch (error) {
      console.error('Error en findById:', error);
      if (connection) throw error;
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
          numero_oficio, unidad_solicitante, region_fiscalia, celular_conductor,
          tipo_de_muestra, asunto, examinado_incriminado, dni_examinado_incriminado,
          delito, situacion_persona, direccion_implicado, celular_implicado,
          fecha_hora_incidente, especialidad_requerida, id_especialidad_requerida,
          muestra, perito_asignado, cip_perito_asignado, id_usuario_perito_asignado, 
          id_prioridad, creado_por, actualizado_por, numero_de_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          oficioPrincipalData.numero_oficio,
          oficioPrincipalData.unidad_solicitante,
          oficioPrincipalData.region_fiscalia,
          oficioPrincipalData.celular_conductor,
          oficioPrincipalData.tipo_de_muestra,
          oficioPrincipalData.asunto,
          oficioPrincipalData.examinado_incriminado,
          oficioPrincipalData.dni_examinado_incriminado,
          oficioPrincipalData.delito,
          oficioPrincipalData.situacion_persona,
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
          oficioPrincipalData.actualizado_por,
          oficioPrincipalData.numero_de_registro
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
      // Paso 1: Obtener el oficio principal y datos básicos con JOINs seguros.
      const [oficioRows] = await connection.query(
        `SELECT 
          o.*, 
          tp.nombre_prioridad, 
          td.nombre_departamento as especialidad,
          u_creador.nombre_completo as nombre_creador
         FROM oficio o
         LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
         LEFT JOIN tipo_departamento td ON o.id_especialidad_requerida = td.id_tipo_departamento
         LEFT JOIN usuario u_creador ON o.creado_por = u_creador.id_usuario
         WHERE o.id_oficio = ?`,
        [id_oficio]
      );

      if (oficioRows.length === 0) {
        return { success: false, message: "Oficio no encontrado" };
      }
      const oficio = oficioRows[0];

      // Paso 2: Obtener detalles del perito asignado (si existe) en una consulta separada.
      if (oficio.id_usuario_perito_asignado) {
        const [peritoDetailsRows] = await connection.query(
          `SELECT 
            u.nombre_completo as nombre_perito_actual,
            u.CIP as cip_perito,
            u.cqfp,
            u.domicilio_laboral,
            p.dni as dni_perito,
            g.nombre as grado_perito
           FROM usuario u
           LEFT JOIN perito p ON u.id_usuario = p.id_usuario
           LEFT JOIN usuario_grado ug ON u.id_usuario = ug.id_usuario
           LEFT JOIN grado g ON ug.id_grado = g.id_grado
           WHERE u.id_usuario = ?`,
          [oficio.id_usuario_perito_asignado]
        );
        if (peritoDetailsRows.length > 0) {
          Object.assign(oficio, peritoDetailsRows[0]);
        }
      }

      // Paso 3: Obtener datos concurrentes (seguimiento, exámenes, muestras).
      const seguimientoPromise = connection.query(
        `SELECT s.*, u.nombre_completo as nombre_usuario, c.nombre_completo as nombre_conductor, sec.nombre as nombre_seccion_usuario
         FROM seguimiento_oficio s
         LEFT JOIN usuario u ON s.id_usuario = u.id_usuario
         LEFT JOIN usuario c ON s.id_conductor = c.id_usuario
         LEFT JOIN usuario_seccion us ON u.id_usuario = us.id_usuario
         LEFT JOIN seccion sec ON us.id_seccion = sec.id_seccion
         WHERE s.id_oficio = ? ORDER BY s.fecha_seguimiento ASC`,
        [id_oficio]
      );

      const examenesPromise = connection.query(
        `SELECT te.nombre FROM oficio_examen oe JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen WHERE oe.id_oficio = ?`,
        [id_oficio]
      );

      const muestrasPromise = connection.query(
        `SELECT * FROM muestras WHERE id_oficio = ?`,
        [id_oficio]
      );

      const metadataPromise = connection.query(
        `SELECT * FROM oficio_resultados_metadata WHERE id_oficio = ?`,
        [id_oficio]
      );

      const [[seguimientoRows], [examenesRows], [muestrasRows], [metadataRows]] = await Promise.all([
        seguimientoPromise,
        examenesPromise,
        muestrasPromise,
        metadataPromise
      ]);

      // Paso 4: Ensamblar todos los datos.
      oficio.seguimiento_historial = seguimientoRows;
      oficio.tipos_de_examen = examenesRows.map(e => e.nombre);
      oficio.muestras_registradas = muestrasRows.map((m, index) => ({ ...m, index: index + 1 }));
      if (metadataRows.length > 0) {
        Object.assign(oficio, metadataRows[0]);
      }

      // Formateo de fechas para la plantilla
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][d.getMonth()];
        const year = d.getFullYear();
        return `${day}${month}${year}`;
      };

      const formatLongDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      };

      const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      oficio.fecha_oficio_formateada = formatDate(oficio.fecha_creacion);
      oficio.fecha_actual_formateada = formatLongDate(new Date());
      oficio.hora_actual = formatTime(new Date());
      oficio.hora_final_diligencia = formatTime(new Date(Date.now() + 5 * 60000)); // 5 minutos después

      if (oficio.fecha_hora_incidente) {
        const [fechaIncidente, horaIncidente] = oficio.fecha_hora_incidente.split(' ');
        oficio.fecha_incidente_formateada = formatDate(fechaIncidente);
        oficio.hora_incidente = horaIncidente;
      }

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

      const EXAMENES = { TOXICOLOGICO: 1, DOSAJE_ETILICO: 2, SARRO_UNGUEAL: 3 };

      let queryWhere = 'WHERE o.id_usuario_perito_asignado = ?';
      const params = [id_perito];

      // Esta es la subconsulta que obtiene y agrupa todos los datos necesarios
      const baseQuery = `
        SELECT 
               o.id_oficio, o.numero_oficio, o.tipo_de_muestra, o.asunto, o.examinado_incriminado, o.delito, o.fecha_creacion, o.id_usuario_perito_asignado,
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
        GROUP BY o.id_oficio
      `;

      let estadoFilter = '';

      switch (funcion) {
        case 'extraccion':
          queryWhere += ` AND o.tipo_de_muestra = 'TOMA DE MUESTRAS' 
                          AND NOT EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.SARRO_UNGUEAL);
          estadoFilter = "AND (o.ultimo_estado IS NULL OR o.ultimo_estado IN ('CREACION DEL OFICIO', 'EXTRACCION_FINALIZADA'))";
          break;

        case 'analisis_tm':
          queryWhere += ` AND o.tipo_de_muestra = 'MUESTRAS REMITIDAS'
                          AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.SARRO_UNGUEAL);
          estadoFilter = "AND (o.ultimo_estado IS NULL OR o.ultimo_estado IN ('CREACION DEL OFICIO', 'ANALISIS_TM_FINALIZADO'))";
          break;

        case 'extraccion_y_analisis':
          queryWhere += ` AND o.tipo_de_muestra = 'TOMA DE MUESTRAS' 
                          AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.SARRO_UNGUEAL);
          estadoFilter = "AND (o.ultimo_estado IS NULL OR o.ultimo_estado IN ('CREACION DEL OFICIO', 'PENDIENTE_ANALISIS_TM', 'ANALISIS_TM_FINALIZADO'))";
          break;

        case 'analisis_inst':
          queryWhere += ` AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.DOSAJE_ETILICO);
          estadoFilter = "AND (o.ultimo_estado IS NULL OR o.ultimo_estado = 'CREACION DEL OFICIO' OR o.ultimo_estado LIKE 'DERIVADO A%' OR o.ultimo_estado = 'ANALISIS_INST_FINALIZADO')";
          break;

        case 'analisis_lab':
          queryWhere += ` AND EXISTS (SELECT 1 FROM oficio_examen oe WHERE oe.id_oficio = o.id_oficio AND oe.id_tipo_de_examen = ?)`;
          params.push(EXAMENES.TOXICOLOGICO);
          estadoFilter = "AND (o.ultimo_estado IN ('CREACION DEL OFICIO', 'DERIVADO A: LABORATORIO', 'ANALISIS_LAB_FINALIZADO'))";
          break;

        case 'consolidacion_lab':
          queryWhere += ` AND o.ultimo_estado IN ('PENDIENTE_CONSOLIDACION', 'CONSOLIDACION_FINALIZADA')`;
          estadoFilter = "AND (o.ultimo_estado NOT IN ('COMPLETADO', 'CERRADO', 'DICTAMEN_EMITIDO'))";
          break;

        default:
          return { success: false, message: 'Función no reconocida' };
      }

      // La consulta final envuelve la subconsulta y aplica los filtros
      const finalQuery = `
        SELECT * FROM (${baseQuery}) as o
        ${queryWhere}
        ${estadoFilter}
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
  static async addSeguimiento({ id_oficio, id_usuario, estado_anterior = null, estado_nuevo = null, observaciones = null }, connection = null) {
    // Si no se pasa una conexión, usa el pool por defecto. Si se pasa, usa la transacción.
    const dbConn = connection || db.promise();

    try {
      const [result] = await dbConn.query(
        `INSERT INTO seguimiento_oficio (id_oficio, id_usuario, estado_anterior, estado_nuevo, observaciones)
         VALUES (?, ?, ?, ?, ?)`,
        [id_oficio, id_usuario, estado_anterior, estado_nuevo, observaciones]
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
  static async reasignarPerito(id_oficio, id_nuevo_perito, id_perito_actual, nuevo_estado) {
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

      // 3. Añadir un registro en 'seguimiento_oficio' usando el estado específico
      await Oficio.addSeguimiento({
        id_oficio: id_oficio,
        id_usuario: id_perito_actual, // El perito que HACE la derivación
        estado_nuevo: nuevo_estado,   // Usa el estado exacto pasado como parámetro
        estado_anterior: null
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
   * @param {object} connection - Conexión de base de datos opcional para transacciones.
   */
  static async addResultado({ id_oficio, id_perito_responsable, tipo_resultado, resultados }, connection = null) {
    const dbConn = connection || db.promise();
    try {
      // Validar que los datos necesarios están presentes
      if (!id_oficio || !id_perito_responsable || !tipo_resultado || !resultados) {
        throw new Error('Faltan datos requeridos para agregar el resultado.');
      }

      const [result] = await dbConn.query(
        `INSERT INTO oficio_resultados_perito (id_oficio, id_perito_responsable, tipo_resultado, resultados)
         VALUES (?, ?, ?, ?)`,
        [id_oficio, id_perito_responsable, tipo_resultado, JSON.stringify(resultados)]
      );

      return { success: true, data: { id_resultado: result.insertId } };
    } catch (error) {
      console.error('Error en Oficio.addResultado:', error);
      // Si estamos en una transacción, propagamos el error
      if (connection) throw error;
      return { success: false, message: 'Error al agregar resultado' };
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

  static async getSeguimientoDeProcedimiento(id_oficio, estados) {
    if (!id_oficio || !Array.isArray(estados) || estados.length === 0) {
      return null;
    }
    try {
      const placeholders = estados.map(() => '?').join(',');
      const [rows] = await db.promise().query(
        `SELECT estado_nuevo, observaciones 
         FROM seguimiento_oficio 
         WHERE id_oficio = ? AND estado_nuevo IN (${placeholders})
         ORDER BY fecha_seguimiento DESC
         LIMIT 1`,
        [id_oficio, ...estados]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error en getSeguimientoDeProcedimiento:', error);
      throw error;
    }
  }

  static async getCasosCulminados() {
    try {
      const query = `
        SELECT 
          o.id_oficio,
          o.numero_oficio,
          o.fecha_creacion,
          o.asunto,
          o.examinado_incriminado,
          o.delito,
          s.estado_nuevo AS ultimo_estado,
          u.nombre_completo AS perito_asignado,
          (SELECT GROUP_CONCAT(te.nombre SEPARATOR ', ') 
            FROM oficio_examen oe 
            JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen 
            WHERE oe.id_oficio = o.id_oficio) AS tipos_de_examen,
          tp.nombre_prioridad
        FROM oficio o
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo, s1.fecha_seguimiento
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
        LEFT JOIN usuario u ON o.id_usuario_perito_asignado = u.id_usuario
        LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
        WHERE s.estado_nuevo = 'DICTAMEN_EMITIDO'
        ORDER BY s.fecha_seguimiento DESC
      `;

      const [rows] = await db.promise().query(query);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error en getCasosCulminados:', error);
      return { success: false, message: 'Error al obtener los casos culminados' };
    }
  }

  static async getCasosParaRecojo() {
    try {
      const query = `
        SELECT 
          o.id_oficio,
          o.numero_oficio,
          o.fecha_creacion,
          o.asunto,
          o.examinado_incriminado,
          o.delito,
          s.estado_nuevo AS ultimo_estado,
          u.nombre_completo AS perito_asignado,
          (SELECT GROUP_CONCAT(te.nombre SEPARATOR ', ') 
            FROM oficio_examen oe 
            JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen 
            WHERE oe.id_oficio = o.id_oficio) AS tipos_de_examen,
          tp.nombre_prioridad
        FROM oficio o
        LEFT JOIN (
          SELECT s1.id_oficio, s1.estado_nuevo, s1.fecha_seguimiento
          FROM seguimiento_oficio s1
          INNER JOIN (
            SELECT id_oficio, MAX(fecha_seguimiento) AS max_fecha
            FROM seguimiento_oficio
            GROUP BY id_oficio
          ) mx ON s1.id_oficio = mx.id_oficio AND s1.fecha_seguimiento = mx.max_fecha
        ) s ON s.id_oficio = o.id_oficio
        LEFT JOIN usuario u ON o.id_usuario_perito_asignado = u.id_usuario
        LEFT JOIN tipos_prioridad tp ON o.id_prioridad = tp.id_prioridad
        WHERE s.estado_nuevo = 'LISTO_PARA_RECOJO'
        ORDER BY s.fecha_seguimiento DESC
      `;

      const [rows] = await db.promise().query(query);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error en getCasosParaRecojo:', error);
      return { success: false, message: 'Error al obtener los casos listos para recojo' };
    }
  }
}
