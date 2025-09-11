import db from '../database/db.js';
import bcrypt from 'bcryptjs';

export class Perito {
  // Función utilitaria para convertir BLOB a Base64 (solo para lectura)
  static blobToBase64(blob) {
    if (!blob) return null;
    if (typeof blob === 'string') return blob; // Si ya es Base64, devolverlo
    if (Buffer.isBuffer(blob)) {
      return blob.toString('base64');
    }
    return null;
  }

  // Función utilitaria para validar Base64 WebP (sin convertir a BLOB)
  static validateWebPBase64(base64String) {
    if (!base64String) return null;
    
    try {
      if (typeof base64String === 'string' && base64String.startsWith('data:image/webp;base64,')) {
        // Validar que sea Base64 WebP válido
        const base64Data = base64String.split(',')[1];
        if (!base64Data) {
          return null;
        }
        
        // Verificar que se pueda decodificar
        try {
          Buffer.from(base64Data, 'base64');
          return base64String; // Devolver el string completo
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
      CIP, Nombres, Apellidos, Email, NombreUsuario, Contrasena, DNI,
      Unidad, FechaIntegracion, FechaIncorporacion, CodigoCodofin, Domicilio,
      Telefono, CursosInstitucionales, CursosExtranjero, UltimoAscensoPNP,
      Fotografia
    } = peritoData;

    // Validar campos requeridos
    if (!CIP || !Nombres || !Apellidos || !NombreUsuario || !Contrasena || !DNI) {
      throw new Error('Todos los campos marcados con * son requeridos');
    }

    // Verificar si el CIP ya existe en usuario
    const existingUser = await this.findByCIP(CIP);
    if (existingUser) {
      throw new Error('Ya existe un usuario con ese CIP');
    }

    // Verificar si el nombre de usuario ya existe
    const existingUsername = await this.findByUsername(NombreUsuario);
    if (existingUsername) {
      throw new Error('Ya existe un usuario con ese nombre de usuario');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    // Concatenar nombre completo
    const nombreCompleto = `${Nombres} ${Apellidos}`;

    // --- 1. Crear usuario ---
    const queryUsuario = `
      INSERT INTO usuario (
        CIP, nombre_completo, nombre_usuario, password_hash
      ) VALUES (?, ?, ?, ?)
    `;
    const [usuarioResult] = await db.promise().query(queryUsuario, [
      CIP, nombreCompleto, NombreUsuario, hashedPassword
    ]);

    const idUsuario = usuarioResult.insertId;

    // --- 2. Crear perito ---
    const queryPerito = `
      INSERT INTO perito (
        id_usuario, dni, email, unidad, fecha_integracion_pnp, fecha_incorporacion,
        codigo_codofin, domicilio, telefono, cursos_institucionales,
        cursos_extranjero, ultimo_ascenso_pnp, fotografia_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [peritoResult] = await db.promise().query(queryPerito, [
      idUsuario, DNI, Email || null, Unidad || null,
      FechaIntegracion || null, FechaIncorporacion || null,
      CodigoCodofin || null, Domicilio || null, Telefono || null,
      CursosInstitucionales ? JSON.stringify(CursosInstitucionales) : null,
      CursosExtranjero ? JSON.stringify(CursosExtranjero) : null,
      UltimoAscensoPNP || null,
      this.validateWebPBase64(Fotografia)
    ]);

    // Validar imagen (fotografía)
    if (Fotografia && !this.validateWebPBase64(Fotografia)) {
      throw new Error('Error validando fotografía, debe ser formato WebP Base64 válido');
    }

    return {
      success: true,
      message: 'Perito creado exitosamente',
      data: {
        id_usuario: idUsuario,
        id_perito: peritoResult.insertId,
        CIP
      }
    };
  } catch (error) {
    throw error;
  }
}


  // Buscar perito por CIP
  static async findByCIP(cip) {
    try {
      const [rows] = await db.promise().query(
      `
      SELECT 
        a.id_usuario,
        a.CIP,
        a.nombre_completo,
        a.nombre_usuario,

        -- Especialidad
        b.id_usuario_especialidad,
        b.id_especialidad,
        b.fecha_asignacion AS fecha_asignacion_especialidad,
        c.nombre AS nombre_especialidad,

        -- Departamento (tipo_departamento)
        ud.id_usuario_departamento,
        ud.id_tipo_departamento,
        td.nombre_departamento AS nombre_tipo_departamento,

        -- Grado
        ug.id_usuario_grado,
        g.id_grado,
        g.nombre AS nombre_grado,

        -- Turno
        ut.id_usuario_turno,
        t.id_turno,
        t.nombre AS nombre_turno

      FROM usuario AS a
      LEFT JOIN usuario_especialidad AS b 
        ON a.id_usuario = b.id_usuario
      LEFT JOIN especialidad AS c 
        ON b.id_especialidad = c.id_especialidad

      LEFT JOIN usuario_departamento AS ud 
        ON a.id_usuario = ud.id_usuario
      LEFT JOIN tipo_departamento AS td 
        ON ud.id_tipo_departamento = td.id_tipo_departamento

      LEFT JOIN usuario_grado AS ug 
        ON a.id_usuario = ug.id_usuario
      LEFT JOIN grado AS g 
        ON ug.id_grado = g.id_grado

      LEFT JOIN usuario_turno AS ut
        ON a.id_usuario = ut.id_usuario
      LEFT JOIN turno AS t
        ON ut.id_turno = t.id_turno

      WHERE a.CIP = ?
      `,
      [cip]
    );
      
      if (rows[0]) {
        const perito = rows[0];
        if (perito.fotografia_url) {
          try {
            if (typeof perito.fotografia_url === 'string' && perito.fotografia_url.startsWith('data:image/')) {
            } else {
              const base64 = this.blobToBase64(perito.fotografia_url);
              perito.fotografia_url = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            perito.fotografia_url = null;
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
        'SELECT * FROM Perito WHERE Email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por email:', error);
      throw error;
    }
  }

  // Buscar perito por nombre de usuario
  static async findByUsername(username) {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM Perito WHERE NombreUsuario = ?',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por username:', error);
      throw error;
    }
  }

  // Buscar perito por DNI
  static async findByDNI(dni) {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM Perito WHERE DNI = ?',
        [dni]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por DNI:', error);
      throw error;
    }
  }

  // Obtener todos los peritos
  static async findAll(limit = 50, offset = 0) {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM Perito ORDER BY Nombres, Apellidos LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      // Convertir BLOB a Base64 para todas las imágenes
      return rows.map(perito => {
        if (perito.Fotografia) {
          try {
            // Si ya es Base64, usarlo directamente
            if (typeof perito.Fotografia === 'string' && perito.Fotografia.startsWith('data:image/')) {
              // Ya está en Base64
            } else {
              // Si es BLOB, convertirlo a Base64
              const base64 = this.blobToBase64(perito.Fotografia);
              perito.Fotografia = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            console.error('Error procesando foto a Base64:', error);
            perito.Fotografia = null;
          }
        }
        if (perito.Firma) {
          try {
            // Si ya es Base64, usarlo directamente
            if (typeof perito.Firma === 'string' && perito.Firma.startsWith('data:image/')) {
              // Ya está en Base64
            } else {
              // Si es BLOB, convertirlo a Base64
              const base64 = this.blobToBase64(perito.Firma);
              perito.Firma = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            console.error('Error procesando firma a Base64:', error);
            perito.Firma = null;
          }
        }
        return perito;
      });
    } catch (error) {
      console.error('Error obteniendo peritos:', error);
      throw error;
    }
  }

  // Contar total de peritos
  static async count() {
    try {
      const [rows] = await db.promise().query('SELECT COUNT(*) as total FROM Perito');
      return rows[0].total;
    } catch (error) {
      console.error('Error contando peritos:', error);
      throw error;
    }
  }

  // Buscar peritos con filtros
  static async search(searchTerm, limit = 50, offset = 0) {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await db.promise().query(
        `SELECT * FROM Perito 
         WHERE CIP LIKE ? OR Nombres LIKE ? OR Apellidos LIKE ? OR DNI LIKE ?
         ORDER BY Nombres, Apellidos 
         LIMIT ? OFFSET ?`,
        [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]
      );
      
      // Convertir BLOB a Base64 para todas las imágenes
      return rows.map(perito => {
        if (perito.Fotografia) {
          try {
            // Si ya es Base64, usarlo directamente
            if (typeof perito.Fotografia === 'string' && perito.Fotografia.startsWith('data:image/')) {
              // Ya está en Base64
            } else {
              // Si es BLOB, convertirlo a Base64
              const base64 = this.blobToBase64(perito.Fotografia);
              perito.Fotografia = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            console.error('Error procesando foto a Base64:', error);
            perito.Fotografia = null;
          }
        }
        if (perito.Firma) {
          try {
            // Si ya es Base64, usarlo directamente
            if (typeof perito.Firma === 'string' && perito.Firma.startsWith('data:image/')) {
              // Ya está en Base64
            } else {
              // Si es BLOB, convertirlo a Base64
              const base64 = this.blobToBase64(perito.Firma);
              perito.Firma = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            console.error('Error procesando firma a Base64:', error);
            perito.Firma = null;
          }
        }
        return perito;
      });
    } catch (error) {
      console.error('Error buscando peritos:', error);
      throw error;
    }
  }

  // Actualizar perito
  static async update(cip, updateData) {
    try {
      const allowedFields = [
        'Nombres', 'Apellidos', 'Email', 'DNI', 'FechaIntegracion',
        'FechaIncorporacion', 'CodigoCodofin', 'Domicilio', 'Seccion',
        'Especialidad', 'Grado', 'Telefono', 'UltimoCenso', 'Fotografia', 'Firma'
      ];

      const fieldsToUpdate = [];
      const values = [];

      // Solo actualizar campos permitidos
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          fieldsToUpdate.push(`${key} = ?`);
          
          // Convertir Base64 a BLOB para imágenes
          if (key === 'Fotografia' || key === 'Firma') {
            if (value && typeof value === 'string' && value.startsWith('data:image/webp;base64,')) {
              // Es Base64 WebP, validarlo y guardarlo directamente
              const validatedBase64 = this.validateWebPBase64(value);
              if (validatedBase64) {
                values.push(validatedBase64);
              } else {
                console.warn(`Campo ${key} no es Base64 WebP válido, ignorando`);
                continue;
              }
            } else if (value === null) {
              // Si es null, mantener null
              values.push(null);
            } else {
              // Si no es Base64 WebP válido, ignorar el campo
              continue;
            }
          } else {
            values.push(value);
          }
        }
      }

      if (fieldsToUpdate.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      values.push(cip);

      const query = `UPDATE Perito SET ${fieldsToUpdate.join(', ')} WHERE CIP = ?`;
      const [result] = await db.promise().query(query, values);

      if (result.affectedRows === 0) {
        throw new Error('Perito no encontrado');
      }

      return {
        success: true,
        message: 'Perito actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error actualizando perito:', error);
      throw error;
    }
  }

  // Cambiar contraseña
  static async changePassword(cip, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const [result] = await db.promise().query(
        'UPDATE Perito SET Contrasena = ? WHERE CIP = ?',
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
        'DELETE FROM Perito WHERE CIP = ?',
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
      const [totalPeritos] = await db.promise().query('SELECT COUNT(*) as total FROM Perito');
      const [peritosPorSeccion] = await db.promise().query(
        'SELECT Seccion, COUNT(*) as count FROM Perito WHERE Seccion IS NOT NULL GROUP BY Seccion'
      );
      const [peritosPorGrado] = await db.promise().query(
        'SELECT Grado, COUNT(*) as count FROM Perito WHERE Grado IS NOT NULL GROUP BY Grado'
      );

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