import db from '../database/db.js';
import bcrypt from 'bcryptjs';

export class Perito {
  // Función utilitaria para convertir BLOB a Base64
  static blobToBase64(blob) {
    if (!blob) return null;
    if (typeof blob === 'string') return blob;
    if (Buffer.isBuffer(blob)) {
      return blob.toString('base64');
    }
    return null;
  }

  // Función utilitaria para validar Base64 WebP
  static validateWebPBase64(base64String) {
    if (!base64String) return null;
    
    try {
      if (typeof base64String === 'string' && base64String.startsWith('data:image/webp;base64,')) {
        const base64Data = base64String.split(',')[1];
        if (!base64Data) {
          return null;
        }
        try {
          Buffer.from(base64Data, 'base64');
          return base64String;
        } catch (decodeError) {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error validando Base64 WebP:', error);
      return null;
    }
  }

  // Crear nuevo perito
  static async create(peritoData) {
  try {
    const {
      CIP, nombre_completo, email, nombre_usuario, password_hash, dni,
      unidad, fecha_integracion_pnp, fecha_incorporacion, codigo_codofin, domicilio,
      telefono, cursos_institucionales, cursos_extranjero, ultimo_ascenso_pnp,
      fotografia_url, id_especialidad, id_grado, id_seccion, id_turno
    } = peritoData;

    if (!CIP || !nombre_completo || !nombre_usuario || !password_hash || !dni || !fecha_integracion_pnp || !fecha_incorporacion || !codigo_codofin || !domicilio || !telefono || !fotografia_url || !id_especialidad || !id_grado || !id_seccion || !id_turno) {
      throw new Error('Hay campos no rellenados.');
    }

    const existingUser = await this.findByCIPPerito(CIP);
    if (existingUser) {
      throw new Error('Ya existe un usuario con ese CIP');
    }

    const existingDNI = await this.findByDNI(dni);
    if (existingDNI) {
      throw new Error('Ya existe un usuario con el DNI ingresado');
    }
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    const validatedFotografia = fotografia_url ? this.validateWebPBase64(fotografia_url) : null;
    if (fotografia_url && !validatedFotografia) {
      throw new Error('Error validando fotografía, debe ser formato WebP Base64 válido');
    }

    const queryUsuario = `
      INSERT INTO usuario (
        CIP, nombre_completo, nombre_usuario, password_hash
      ) VALUES (?, ?, ?, ?)
    `;
    const queryPerito = `
      INSERT INTO perito (
        id_usuario, dni, email, unidad, fecha_integracion_pnp, fecha_incorporacion,
        codigo_codofin, domicilio, telefono, cursos_institucionales,
        cursos_extranjero, ultimo_ascenso_pnp, fotografia_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const queryRelationsPeritoEspecialidad = `INSERT INTO usuario_especialidad (id_usuario, id_especialidad) VALUES (?,?);`
    const queryRelationsPeritogrado = `INSERT INTO usuario_grado (id_usuario, id_grado) VALUES (?,?);`
    const queryRelationsPeritoTurno = `INSERT INTO usuario_turno (id_usuario, id_turno) VALUES (?,?);`
    const queryRelationsPeritoSeccion = `INSERT INTO usuario_seccion (id_usuario, id_seccion) VALUES (?,?);`
    const queryRelationsPeritoEstado = `INSERT INTO estado_usuario (id_usuario, id_estado) VALUES (?,?);`
    const queryRelationsPeritoRol = `INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?,?);`

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      const [usuarioResult] = await connection.query(queryUsuario, [
        CIP, nombre_completo, nombre_usuario, hashedPassword
      ]);
      const idUsuario = usuarioResult.insertId;

      const [peritoResult] = await connection.query(queryPerito, [
        idUsuario, dni, email || null, unidad || null,
        fecha_integracion_pnp || null, fecha_incorporacion || null,
        codigo_codofin || null, domicilio || null, telefono || null,
        cursos_institucionales ? JSON.stringify(cursos_institucionales) : null,
        cursos_extranjero ? JSON.stringify(cursos_extranjero) : null,
        ultimo_ascenso_pnp || null,
        validatedFotografia
      ]);
      await connection.query(queryRelationsPeritoEstado, [idUsuario, 1]);
      await connection.query(queryRelationsPeritoRol, [idUsuario, 2]);

      if (id_especialidad) {
        await connection.query(queryRelationsPeritoEspecialidad, [idUsuario, id_especialidad]);
      }
      if (id_grado) {
        await connection.query(queryRelationsPeritogrado, [idUsuario, id_grado]);
      }
      if (id_turno) {
        await connection.query(queryRelationsPeritoTurno, [idUsuario, id_turno]);
      }
      if (id_seccion) {
        await connection.query(queryRelationsPeritoSeccion, [idUsuario, id_seccion]);
      }

      await connection.commit();
      connection.release();

      return {
        success: true,
        message: 'Perito creado exitosamente',
        data: {
          id_usuario: idUsuario,
          id_perito: peritoResult.insertId,
          CIP
        }
      };
    } catch (txError) {
      await connection.rollback();
      connection.release();
      throw txError;
    }
  } catch (error) {
    throw error;
  }
}


  static async findByCIPPerito(cip){
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM usuario AS us INNER JOIN usuario_rol AS ur ON us.id_usuario = ur.id_usuario INNER JOIN rol AS r ON ur.id_rol = r.id_rol WHERE CIP = ? AND r.nombre_rol = "PERITO"',
        [cip]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por CIP:', error);
      throw error;
    }
  }

  // Buscar perito por CIP
  static async findByCIP(cip) {
    try {
      const [rows] = await db.promise().query(
      `
      SELECT 
      u.id_usuario,
      u.CIP,
      u.nombre_completo,
      u.nombre_usuario,
      u.password_hash,
      
      -- Datos del perito
      p.dni,
      p.email,
      p.unidad,
      p.fecha_integracion_pnp,
      p.fecha_incorporacion,
      p.codigo_codofin,
      p.domicilio,
      p.telefono,
      p.cursos_institucionales,
      p.cursos_extranjero,
      p.ultimo_ascenso_pnp,
      p.fotografia_url,

      -- Especialidad
      ue.id_especialidad,
      e.nombre AS nombre_especialidad,

      -- Sección y Tipo de Departamento
      usec.id_seccion,
      sec.nombre AS nombre_seccion,
      tds.id_tipo_departamento,
      td.nombre_departamento AS nombre_tipo_departamento,

      -- Grado
      ug.id_grado,
      g.nombre AS nombre_grado,

      -- Turno
      ut.id_turno,
      t.nombre AS nombre_turno

    FROM usuario u
    INNER JOIN perito p ON u.id_usuario = p.id_usuario

    LEFT JOIN usuario_especialidad ue ON u.id_usuario = ue.id_usuario
    LEFT JOIN especialidad e ON ue.id_especialidad = e.id_especialidad

    LEFT JOIN usuario_seccion usec ON u.id_usuario = usec.id_usuario
    LEFT JOIN seccion sec ON usec.id_seccion = sec.id_seccion
    LEFT JOIN tipo_departamento_seccion tds ON sec.id_seccion = tds.id_seccion
    LEFT JOIN tipo_departamento td ON tds.id_tipo_departamento = td.id_tipo_departamento

    LEFT JOIN usuario_grado ug ON u.id_usuario = ug.id_usuario
    LEFT JOIN grado g ON ug.id_grado = g.id_grado

    LEFT JOIN usuario_turno ut ON u.id_usuario = ut.id_usuario
    LEFT JOIN turno t ON ut.id_turno = t.id_turno

    WHERE u.CIP = ?
      `,
      [cip]
    );
      
      if (rows[0]) {
        const perito = rows[0];
        
        // Convertir BLOB a Base64 si es necesario
        if (perito.fotografia_url) {
          try {
            if (typeof perito.fotografia_url === 'string' && perito.fotografia_url.startsWith('data:image/')) {
              // Ya está en formato base64
            } else {
              const base64 = this.blobToBase64(perito.fotografia_url);
              perito.fotografia_url = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            perito.fotografia_url = null;
          }
        }
        
        // Parsear JSON si es necesario
        if (perito.cursos_institucionales && typeof perito.cursos_institucionales === 'string') {
          try {
            perito.cursos_institucionales = JSON.parse(perito.cursos_institucionales);
          } catch (error) {
            perito.cursos_institucionales = [];
          }
        }
        
        if (perito.cursos_extranjero && typeof perito.cursos_extranjero === 'string') {
          try {
            perito.cursos_extranjero = JSON.parse(perito.cursos_extranjero);
          } catch (error) {
            perito.cursos_extranjero = [];
          }
        }
        
        return perito;
      }
      
      return null;
    } catch (error) {
      console.error('Error buscando perito por CIP:', error);
      throw error;
    }
  }

  // Buscar perito por email
  static async findByEmail(email) {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM perito WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por email:', error);
      throw error;
    }
  }

  // Buscar perito por DNI
  static async findByDNI(dni) {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM perito WHERE dni = ?',
        [dni]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por DNI:', error);
      throw error;
    }
  }

  // Obtener todos los peritos
  static async findAll(limit = 10, offset = 0) {
    try {
      const [rows] = await db.promise().query(
        `SELECT *, se.nombre AS nombre_seccion 
        FROM usuario AS a
        LEFT JOIN usuario_rol AS b
        ON a.id_usuario = b.id_usuario 
        LEFT JOIN perito AS pe ON a.id_usuario = pe.id_usuario
        LEFT JOIN usuario_seccion AS us ON a.id_usuario = us.id_usuario
        LEFT JOIN seccion as se ON se.id_seccion = us.id_seccion
        LEFT JOIN tipo_departamento_seccion AS tds ON tds.id_seccion = se.id_seccion
        LEFT JOIN tipo_departamento AS tdp ON tdp.id_tipo_departamento = tds.id_tipo_departamento

        WHERE b.id_rol = 2
        ORDER BY a.nombre_completo
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error obteniendo peritos:', error);
      throw error;
    }
  }

  // Contar total de peritos
  static async count() {
    try {
      const [rows] = await db.promise().query('SELECT COUNT(*) as total FROM perito');
      return rows[0].total;
    } catch (error) {
      console.error('Error contando peritos:', error);
      throw error;
    }
  }

  // Buscar peritos con filtros
  static async search(searchTerm, limit = 10, offset = 0) {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await db.promise().query(
        `SELECT * 
        FROM usuario AS a 
        LEFT JOIN usuario_rol AS b ON a.id_usuario = b.id_usuario
        WHERE (a.CIP LIKE ? OR a.nombre_completo LIKE ?) 
          AND b.id_rol = 2
        ORDER BY a.nombre_completo 
        LIMIT ? OFFSET ?`,
        [searchPattern, searchPattern, limit, offset]
      );
      return rows;

    } catch (error) {
      console.error('Error buscando peritos:', error);
      throw error;
    }
  }

  // Actualizar perito
static async update(cip, updateData) {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    const {
      nombre_completo, email, nombre_usuario, password_hash, dni,
      unidad, fecha_integracion_pnp, fecha_incorporacion, codigo_codofin, domicilio,
      telefono, cursos_institucionales, cursos_extranjero, ultimo_ascenso_pnp,
      fotografia_url, id_especialidad, id_grado, id_seccion, id_turno
    } = updateData;

    // Actualizar tabla usuario
    const usuarioFields = [];
    const usuarioValues = [];
    
    if (nombre_completo !== undefined) {
      usuarioFields.push('nombre_completo = ?');
      usuarioValues.push(nombre_completo);
    }
    
    if (nombre_usuario !== undefined) {
      usuarioFields.push('nombre_usuario = ?');
      usuarioValues.push(nombre_usuario);
    }
    
    if (password_hash !== undefined) {
      const hashedPassword = await bcrypt.hash(password_hash, 10);
      usuarioFields.push('password_hash = ?');
      usuarioValues.push(hashedPassword);
    }
    
    if (usuarioFields.length > 0) {
      usuarioValues.push(cip);
      const queryUsuario = `UPDATE usuario SET ${usuarioFields.join(', ')} WHERE CIP = ?`;
      await connection.query(queryUsuario, usuarioValues);
    }

    // Actualizar tabla perito
    const peritoFields = [];
    const peritoValues = [];
    
    if (dni !== undefined) {
      peritoFields.push('dni = ?');
      peritoValues.push(dni);
    }
    
    if (email !== undefined) {
      peritoFields.push('email = ?');
      peritoValues.push(email);
    }
    
    if (unidad !== undefined) {
      peritoFields.push('unidad = ?');
      peritoValues.push(unidad);
    }
    
    if (fecha_integracion_pnp !== undefined) {
      peritoFields.push('fecha_integracion_pnp = ?');
      peritoValues.push(fecha_integracion_pnp);
    }
    
    if (fecha_incorporacion !== undefined) {
      peritoFields.push('fecha_incorporacion = ?');
      peritoValues.push(fecha_incorporacion);
    }
    
    if (codigo_codofin !== undefined) {
      peritoFields.push('codigo_codofin = ?');
      peritoValues.push(codigo_codofin);
    }
    
    if (domicilio !== undefined) {
      peritoFields.push('domicilio = ?');
      peritoValues.push(domicilio);
    }
    
    if (telefono !== undefined) {
      peritoFields.push('telefono = ?');
      peritoValues.push(telefono);
    }
    
    if (cursos_institucionales !== undefined) {
      peritoFields.push('cursos_institucionales = ?');
      peritoValues.push(JSON.stringify(cursos_institucionales));
    }
    
    if (cursos_extranjero !== undefined) {
      peritoFields.push('cursos_extranjero = ?');
      peritoValues.push(JSON.stringify(cursos_extranjero));
    }
    
    if (ultimo_ascenso_pnp !== undefined) {
      peritoFields.push('ultimo_ascenso_pnp = ?');
      peritoValues.push(ultimo_ascenso_pnp);
    }
    
    if (fotografia_url !== undefined) {
      const validatedFotografia = this.validateWebPBase64(fotografia_url);
      peritoFields.push('fotografia_url = ?');
      peritoValues.push(validatedFotografia);
    }
    
    if (peritoFields.length > 0) {
      peritoValues.push(cip);
      const queryPerito = `
        UPDATE perito p
        JOIN usuario u ON p.id_usuario = u.id_usuario
        SET ${peritoFields.join(', ')}
        WHERE u.CIP = ?
      `;
      await connection.query(queryPerito, peritoValues);
    }

    // Actualizar relaciones
    if (id_especialidad !== undefined) {
      await connection.query(`
        UPDATE usuario_especialidad 
        SET id_especialidad = ? 
        WHERE id_usuario = (SELECT id_usuario FROM usuario WHERE CIP = ?)
      `, [id_especialidad, cip]);
    }
    
    if (id_grado !== undefined) {
      await connection.query(`
        UPDATE usuario_grado 
        SET id_grado = ? 
        WHERE id_usuario = (SELECT id_usuario FROM usuario WHERE CIP = ?)
      `, [id_grado, cip]);
    }
    
    if (id_turno !== undefined) {
      await connection.query(`
        UPDATE usuario_turno 
        SET id_turno = ? 
        WHERE id_usuario = (SELECT id_usuario FROM usuario WHERE CIP = ?)
      `, [id_turno, cip]);
    }
    
    if (id_seccion !== undefined) {
      await connection.query(`
        UPDATE usuario_seccion 
        SET id_seccion = ? 
        WHERE id_usuario = (SELECT id_usuario FROM usuario WHERE CIP = ?)
      `, [id_seccion, cip]);
    }

    await connection.commit();
    connection.release();

    return {
      success: true,
      message: 'Perito actualizado exitosamente'
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

  // Cambiar contraseña
  static async changePassword(cip, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const [result] = await db.promise().query(
        'UPDATE usuario SET Contrasena = ? WHERE CIP = ?',
        [hashedPassword, cip]
      );

      if (result.affectedRows === 0) {
        throw new Error('Perito no encontrado');
      }

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  // Eliminar perito
  static async delete(cip) {
    try {
      const [result] = await db.promise().query(
        'DELETE FROM usuario WHERE CIP = ?',
        [cip]
      );

      if (result.affectedRows === 0) {
        throw new Error('Perito no encontrado');
      }

      return {
        success: true,
        message: 'Perito eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error eliminando perito:', error);
      throw error;
    }
  }

  // Verificar credenciales de login
  static async verifyCredentials(username, password) {
    try {
      const perito = await this.findByUsername(username);
      if (!perito) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, perito.Contrasena);
      if (!isValidPassword) {
        return null;
      }

      // No retornar la contraseña
      const { Contrasena, ...peritoWithoutPassword } = perito;
      return peritoWithoutPassword;
    } catch (error) {
      console.error('Error verificando credenciales:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  static async getStats() {
    try {
      const [totalPeritos] = await db.promise().query('SELECT COUNT(*) as total FROM perito');
      // Peritos por Sección
      const [peritosPorSeccion] = await db.promise().query(`
        SELECT s.nombre AS seccion, COUNT(p.id_perito) AS count
        FROM perito p
        INNER JOIN usuario_seccion us ON p.id_usuario = us.id_usuario
        INNER JOIN seccion s ON us.id_seccion = s.id_seccion
        GROUP BY s.id_seccion, s.nombre
        ORDER BY count DESC
      `);

      // Peritos por Grado
      const [peritosPorGrado] = await db.promise().query(`
        SELECT g.nombre AS grado, COUNT(p.id_perito) AS count
        FROM perito p
        INNER JOIN usuario_grado ug ON p.id_usuario = ug.id_usuario
        INNER JOIN grado g ON ug.id_grado = g.id_grado
        GROUP BY g.id_grado, g.nombre
        ORDER BY count DESC
      `);

      return {
        totalPeritos: totalPeritos[0].total,
        peritosPorSeccion,
        peritosPorGrado
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}