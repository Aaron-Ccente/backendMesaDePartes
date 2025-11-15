import db from '../database/db.js';
import bcrypt from 'bcryptjs';

export class Admin {
  // Crear un nuevo administrador
  static async create(adminData) {
    const connection = await db.promise().getConnection();
    try {
      const { CIP, nombre_usuario, password_hash, nombre_completo } = adminData;
      if (!CIP || !nombre_usuario || !password_hash || !nombre_completo) {
        throw new Error('Todos los campos son obligatorios');
      }
      const [existingAdmin] = await connection.query(
        'SELECT id_usuario FROM usuario WHERE CIP = ?',
        [CIP]
      );

      if (existingAdmin.length > 0) {
        throw new Error('El CIP ya está registrados');
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);
      await connection.beginTransaction();
      // Insertar el nuevo usuario adminstrador
      const [result] = await connection.query(
        'INSERT INTO usuario (CIP, nombre_usuario, password_hash, nombre_completo) VALUES (?, ?, ?, ?)',
        [CIP, nombre_usuario, hashedPassword, nombre_completo]
      );
      const id_usuario = result.insertId;
      // Insertar el id del usuario en la tabla de administradores.
      await connection.query(
        'INSERT INTO administrador (id_usuario) VALUES (?)',
        [id_usuario]
      );
      // 1 es ADMINISTRADOR (rol del usuario)
      await connection.query(
        'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
        [id_usuario, 1]
      );
      // Insertar estado (HABILITADO o DESHABILITADO)
      await connection.query(
        'INSERT INTO estado_usuario (id_usuario, id_estado) VALUES (?, ?)',
        [id_usuario, 1]
      );
      // Confirmar transacción si ocurre algun error
      await connection.commit();
      return {
        id_usuario,
        CIP,
        nombre_usuario,
        nombre_completo
      };
    } catch (error) {
      // Rollback en caso alguna consulta falla (usuario_rol, estado_usuario)
      await connection.rollback();

      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un registro con ese CIP o nombre de usuario');
      }

      throw new Error(`Error al crear administrador: ${error.message}`);
    } finally {
      connection.release();
    }
  }
  
  static async enableDisable({ id_estado, id_usuario, motivo }) {
    try {
      await db.promise().query(
        'INSERT INTO estado_usuario (id_estado, id_usuario, motivo) VALUES (?, ?, ?)',
        [id_estado, id_usuario, motivo]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Logout para administradores
  static async logOutAdmin({id_usuario}){
      try {
      const [result] = await db.promise().query(
        'INSERT INTO historial_usuario (id_usuario, tipo_historial) VALUES (?, ?)',
        [id_usuario, 'SALIDA']
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get admin by Cip
  static async findbyCIP(CIP) {
    try {
      const [rows] = await db.promise().query(`
      SELECT 
        us.id_usuario,
        us.CIP,
        us.nombre_usuario,
        us.nombre_completo
      FROM usuario AS us WHERE us.CIP = ?`,[CIP]
    );
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar administrador por CIP - enable o disable 
  static async findByCIP(CIP) {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        us.id_usuario,
        us.CIP,
        us.nombre_usuario,
        us.password_hash,
        us.nombre_completo,
        eu.id_estado,
        eu.motivo,
        eu.fecha_actualizacion
      FROM usuario AS us
      LEFT JOIN usuario_rol AS ur ON us.id_usuario = ur.id_usuario
      LEFT JOIN rol AS r ON ur.id_rol = r.id_rol
      LEFT JOIN (
        SELECT e1.*
        FROM estado_usuario e1
        INNER JOIN (
          SELECT id_usuario, MAX(fecha_actualizacion) AS max_fecha
          FROM estado_usuario
          GROUP BY id_usuario
        ) e2 
        ON e1.id_usuario = e2.id_usuario 
        AND e1.fecha_actualizacion = e2.max_fecha
      ) eu ON eu.id_usuario = us.id_usuario
      WHERE us.CIP = ? 
      AND r.nombre_rol = "ADMINISTRADOR"
      LIMIT 1
    `, [CIP]);

    const user = rows[0];
    if (!user) return null;

    // Usuario suspendido
    if (user.id_estado === 2) {

      // Formatear fecha
      const fecha = new Date(user.fecha_actualizacion);
      const fechaFormateada = fecha.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      return {
        suspended: true,
        message: `El usuario ha sido suspendido.\nMotivo: ${user.motivo}\nFecha: ${fechaFormateada}`
      };
    }

    return {
      ...user,
      suspended: false
    };

  } catch (error) {
    throw error;
  }
}

  
  // Buscar administrador por nombre de usuario
  static async findByUsername(NombreUsuario) {
    try {
      const [rows] = await db.promise().query(
        'SELECT CIP, nombre_usuario, password_hash, nombre_completo FROM usuario WHERE nombre_usuario = ?',
        [NombreUsuario]
      );
      
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
  
  // Verificar credenciales
  static async verifyCredentials(CIP, password_hash_compare) {
    try {
      const admin = await this.findByCIP(CIP);
      
      if (!admin) {
        return null;
      }

      if (admin.suspended) {
      throw new Error(admin.message);
    }
      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password_hash_compare, admin.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Insertar el timpo exacto de login del usuario para auditoria
      await this.logLogin(admin.id_usuario);
      // Retornar datos del administrador sin la contraseña
      const { password_hash, ...adminData } = admin;
      return adminData;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener todos los administradores (para administración)
  static async findAll() {
    try {
      const [rows] = await db.promise().query(`
        SELECT
          u.CIP,
          u.id_usuario,
          u.nombre_usuario,
          u.nombre_completo,
          eu.id_estado,
          eu.motivo,
          eu.fecha_actualizacion
        FROM usuario AS u
        LEFT JOIN usuario_rol AS ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN rol AS r ON ur.id_rol = r.id_rol
        INNER JOIN estado_usuario AS eu ON u.id_usuario = eu.id_usuario
        INNER JOIN (
          SELECT id_usuario, MAX(fecha_actualizacion) AS max_fecha
          FROM estado_usuario
          GROUP BY id_usuario
        ) latest ON eu.id_usuario = latest.id_usuario
                AND eu.fecha_actualizacion = latest.max_fecha
        WHERE r.nombre_rol = 'ADMINISTRADOR';
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  // Actualizar administrador
  static async update(CIP, updateData) {
    try {
      const { nombre_completo, nombre_usuario } = updateData;
      const [result] = await db.promise().query(
        'UPDATE usuario SET nombre_completo = ?, nombre_usuario = ? WHERE CIP = ?',
        [nombre_completo, nombre_usuario, CIP]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Eliminar administrador
  static async delete(CIP) {
    try {
      const [result] = await db.promise().query(
        'DELETE FROM usuario WHERE CIP = ?',
        [CIP]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Agregar login para la auditoria del usuario
  static async logLogin(id_usuario) {
    try {
      const [result] = await db.promise().query(
        'INSERT INTO historial_usuario (id_usuario, tipo_historial) VALUES (?, ?)',
        [id_usuario, 'ENTRADA']
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}
