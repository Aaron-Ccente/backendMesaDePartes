import db from '../database/db.js';

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

      try {
        // verificar si existe el número de oficio
        const [existingOficio] = await connection.query(
          'SELECT numero_oficio FROM oficio WHERE numero_oficio = ?',
          [oficioData.numero_oficio]
        );

        if (existingOficio.length > 0) {
          return {
            success: false,
            error: 'DUPLICATE_ENTRY',
            message: `Ya existe un oficio registrado con el número: ${oficioData.numero_oficio}`
          };
        }

        // Verificar existencia del perito
        const [perito] = await connection.query(
          'SELECT id_usuario FROM usuario WHERE id_usuario = ?',
          [oficioData.id_usuario_perito_asignado]
        );

        if (perito.length === 0) {
          return {
            success: false,
            error: 'INVALID_PERITO',
            message: 'El perito asignado no existe en el sistema'
          };
        }

        // Verificar existencia de la especialidad
        const [especialidad] = await connection.query(
          'SELECT id_tipo_departamento FROM tipo_departamento WHERE id_tipo_departamento = ?',
          [oficioData.id_especialidad_requerida]
        );

        if (especialidad.length === 0) {
          return {
            success: false,
            error: 'INVALID_ESPECIALIDAD',
            message: 'La especialidad requerida no existe en el sistema'
          };
        }

        // Verificar existencia del tipo de examen
        const [tipoExamen] = await connection.query(
          'SELECT id_tipo_de_examen FROM tipo_de_examen WHERE id_tipo_de_examen = ?',
          [oficioData.id_tipo_examen]
        );

        if (tipoExamen.length === 0) {
          return {
            success: false,
            error: 'INVALID_TIPO_EXAMEN',
            message: 'El tipo de examen seleccionado no existe en el sistema'
          };
        }

        // Verificar existencia de la prioridad
        const [prioridad] = await connection.query(
          'SELECT id_prioridad FROM tipos_prioridad WHERE id_prioridad = ?',
          [oficioData.id_prioridad]
        );

        if (prioridad.length === 0) {
          return {
            success: false,
            error: 'INVALID_PRIORIDAD',
            message: 'El tipo de prioridad seleccionado no existe en el sistema'
          };
        }

        // Si todas las validaciones pasan, insertar oficio
        const [result] = await connection.query(
          `INSERT INTO oficio (
            numero_oficio, unidad_solicitante, unidad_remitente, region_fiscalia,
            tipo_de_muestra, asunto, examinado_incriminado, dni_examinado_incriminado,
            fecha_hora_incidente, especialidad_requerida, id_especialidad_requerida,
            tipo_examen, id_tipo_examen, muestra, perito_asignado,
            cip_perito_asignado, id_usuario_perito_asignado, id_prioridad,
            creado_por, actualizado_por
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            oficioData.numero_oficio,
            oficioData.unidad_solicitante,
            oficioData.unidad_remitente,
            oficioData.region_fiscalia,
            oficioData.tipo_de_muestra,
            oficioData.asunto,
            oficioData.examinado_incriminado,
            oficioData.dni_examinado_incriminado,
            oficioData.fecha_hora_incidente,
            oficioData.especialidad_requerida,
            oficioData.id_especialidad_requerida,
            oficioData.tipo_examen,
            oficioData.id_tipo_examen,
            oficioData.muestra,
            oficioData.perito_asignado,
            oficioData.cip_perito_asignado,
            oficioData.id_usuario_perito_asignado,
            oficioData.id_prioridad,
            oficioData.creado_por,
            oficioData.creado_por
          ]
        );

        // Crear primer seguimiento
        await connection.query(
          `INSERT INTO seguimiento_oficio (
            id_oficio, id_usuario, estado_anterior, estado_nuevo
          ) VALUES (?, ?, NULL, 'CREACION DEL OFICIO')`,
          [result.insertId, oficioData.creado_por]
        );

        await connection.commit();
        return { 
          success: true, 
          data: { 
            id_oficio: result.insertId,
            numero_oficio: oficioData.numero_oficio 
          },
          message: "Oficio creado exitosamente" 
        };

      } catch (error) {
        // Manejar otros tipos de errores SQL
        if (error.code === 'ER_DUP_ENTRY') {
          if (error.message.includes('numero_oficio')) {
            return {
              success: false,
              error: 'DUPLICATE_ENTRY',
              message: `Ya existe un oficio registrado con el número: ${oficioData.numero_oficio}`
            };
          }
        }
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
          // Identificar qué foreign key falló
          if (error.message.includes('id_usuario_perito_asignado')) {
            return {
              success: false,
              error: 'INVALID_PERITO',
              message: 'El perito asignado no existe en el sistema'
            };
          }
          if (error.message.includes('id_especialidad_requerida')) {
            return {
              success: false,
              error: 'INVALID_ESPECIALIDAD',
              message: 'La especialidad requerida no existe en el sistema'
            };
          }
          if (error.message.includes('id_tipo_examen')) {
            return {
              success: false,
              error: 'INVALID_TIPO_EXAMEN',
              message: 'El tipo de examen seleccionado no existe en el sistema'
            };
          }
          if (error.message.includes('id_prioridad')) {
            return {
              success: false,
              error: 'INVALID_PRIORIDAD',
              message: 'El tipo de prioridad seleccionado no existe en el sistema'
            };
          }
        }

        throw error;
      }

    } catch (error) {
      await connection.rollback();
      console.error('Error en create:', error);
      
      return { 
        success: false, 
        error: error.error || 'UNKNOWN_ERROR',
        message: error.message || "Error desconocido al crear el oficio",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
               s.fecha_seguimiento AS ultimo_fecha
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

  // Agregar seguimiento
  static async addSeguimiento({ id_oficio, id_usuario, estado_anterior = null, estado_nuevo = null }) {
    try {
      const [result] = await db.promise().query(
        `INSERT INTO seguimiento_oficio (id_oficio, id_usuario, estado_anterior, estado_nuevo)
         VALUES (?, ?, ?, ?)`,
        [id_oficio, id_usuario, estado_anterior, estado_nuevo]
      );
      return { success: true, data: { id_seguimiento: result.insertId } };
    } catch (error) {
      console.error('Error en addSeguimiento:', error);
      return { success: false, message: 'Error al agregar seguimiento' };
    }
  }
}