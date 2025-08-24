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
        FechaIntegracion, FechaIncorporacion, CodigoCodofin, Domicilio,
        Seccion, Especialidad, Grado, Telefono, UltimoCenso, Fotografia, Firma
      } = peritoData;

      // Validar campos requeridos
      if (!CIP || !Nombres || !Apellidos || !Email || !NombreUsuario || !Contrasena || !DNI || !CodigoCodofin) {
        throw new Error('Todos los campos marcados con * son requeridos');
      }

      // Verificar si el CIP ya existe
      const existingPerito = await this.findByCIP(CIP);
      if (existingPerito) {
        throw new Error('Ya existe un perito con ese CIP');
      }

      // Verificar si el nombre de usuario ya existe
      const existingUsername = await this.findByUsername(NombreUsuario);
      if (existingUsername) {
        throw new Error('Ya existe un perito con ese nombre de usuario');
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(Contrasena, 10);

      // Preparar valores para inserción
      const values = [
        CIP, Nombres, Apellidos, Email, NombreUsuario, hashedPassword, DNI,
        FechaIntegracion || null, FechaIncorporacion || null, CodigoCodofin,
        Domicilio || null, Seccion || null, Especialidad || null, Grado || null,
        Telefono || null, UltimoCenso || null, 
        this.validateWebPBase64(Fotografia), 
        this.validateWebPBase64(Firma)
      ];

      // Verificar que las validaciones de imagen fueron exitosas
      const fotoIndex = 16;
      const firmaIndex = 17;
      
      if (Fotografia && !values[fotoIndex]) {
        throw new Error('Error validando fotografía, debe ser formato WebP Base64 válido');
      }
      if (Firma && !values[firmaIndex]) {
        throw new Error('Error validando firma, debe ser formato WebP Base64 válido');
      }

      // Query de inserción
      const query = `
        INSERT INTO Perito (
          CIP, Nombres, Apellidos, Email, NombreUsuario, Contrasena, DNI,
          FechaIntegracion, FechaIncorporacion, CodigoCodofin, Domicilio,
          Seccion, Especialidad, Grado, Telefono, UltimoCenso, Fotografia, Firma
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.promise().query(query, values);
      return {
        success: true,
        message: 'Perito creado exitosamente',
        data: { CIP, insertId: result.insertId }
      };
    } catch (error) {
      throw error;
    }
  }

  // Buscar perito por CIP
  static async findByCIP(cip) {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM Perito WHERE CIP = ?',
        [cip]
      );
      
      if (rows[0]) {
        const perito = rows[0];
        // Mostrar foto y firma
        if (perito.Fotografia) {
          try {
            if (typeof perito.Fotografia === 'string' && perito.Fotografia.startsWith('data:image/')) {
            } else {
              const base64 = this.blobToBase64(perito.Fotografia);
              perito.Fotografia = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            perito.Fotografia = null;
          }
        }
        if (perito.Firma) {
          try {
            // Si ya es Base64, usarlo directamente
            if (typeof perito.Firma === 'string' && perito.Firma.startsWith('data:image/')) {
              console.log('Firma ya está en formato Base64');
            } else {
              // convertirlo a Base64
              const base64 = this.blobToBase64(perito.Firma);
              perito.Firma = `data:image/webp;base64,${base64}`;
            }
          } catch (error) {
            console.error('Error procesando firma:', error);
            perito.Firma = null;
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