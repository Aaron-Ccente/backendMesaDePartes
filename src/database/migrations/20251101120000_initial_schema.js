// backend/src/database/migrations/20251101120000_initial_schema.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema
    // ------------------------------------
    // TABLAS DE REFERENCIA (SIN FKs)
    // ------------------------------------

    // Tabla: rol
    .createTable('rol', (table) => {
      // .increments() crea un INT UNSIGNED por defecto en MySQL
      table.increments('id_rol').primary(); 
      table.string('nombre_rol', 20).notNullable().unique();
      table.text('descripcion').nullable();
    })

    // Tabla: tipos_prioridad
    .createTable('tipos_prioridad', (table) => {
      // .increments() crea un INT UNSIGNED por defecto en MySQL
      table.increments('id_prioridad').primary();
      table.string('nombre_prioridad', 100).notNullable().unique();
    })

    // Tabla: estado
    .createTable('estado', (table) => {
      // .increments() crea un INT UNSIGNED por defecto en MySQL
      table.increments('id_estado').primary();
      table.string('nombre_estado', 20).notNullable().unique();
      table.text('descripcion').nullable();
    })

    // Tabla: tipo_departamento
    .createTable('tipo_departamento', (table) => {
      table.increments('id_tipo_departamento').primary();
      table.string('nombre_departamento', 50).notNullable().unique();
      table.text('descripcion').nullable();
    })

    // Tabla: grado
    .createTable('grado', (table) => {
      table.increments('id_grado').primary();
      table.string('nombre', 60).notNullable().unique();
    })

    // Tabla: turno
    .createTable('turno', (table) => {
      table.increments('id_turno').primary();
      table.string('nombre', 60).notNullable().unique();
    })

    // Tabla: tipo_de_examen
    .createTable('tipo_de_examen', (table) => {
      table.increments('id_tipo_de_examen').primary();
      table.string('nombre', 300).notNullable();
      table.text('descripcion').nullable();
    })

    // ------------------------------------
    // TABLA CENTRAL DE USUARIOS
    // ------------------------------------

    // Tabla: usuario (Central)
    .createTable('usuario', (table) => {
      table.increments('id_usuario').primary();
      table.string('CIP', 20).notNullable().unique();
      table.string('nombre_completo', 200).notNullable();
      table.string('nombre_usuario', 150).notNullable();
      table.string('password_hash', 255).notNullable();
      table.timestamp('fecha_creacion').defaultTo(knex.fn.now());
      table.timestamp('fecha_actualizacion').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      table.timestamp('ultimo_acceso').nullable();
      // Constraint chk_cip_format (MySQL no soporta CHECK constraints por defecto, se maneja a nivel de app)
    })

    // ------------------------------------
    // TABLAS DE ROLES ESPECIALIZADOS (FK a usuario)
    // ------------------------------------

    // Tabla: administrador
    .createTable('administrador', (table) => {
      table.increments('id_administrador').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
    })

    // Tabla: mesadepartes
    .createTable('mesadepartes', (table) => {
      table.increments('id_mesadepartes').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
    })

    // Tabla: perito
    .createTable('perito', (table) => {
      table.increments('id_perito').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
      table.string('dni', 8).notNullable().unique();
      table.string('email', 100).nullable().unique();
      table.string('unidad', 100).nullable();
      table.date('fecha_integracion_pnp').nullable();
      table.date('fecha_incorporacion').nullable();
      table.string('codigo_codofin', 20).nullable();
      table.text('domicilio').nullable();
      table.string('telefono', 15).nullable();
      table.text('cursos_institucionales').nullable(); // JSON guardado como TEXT
      table.text('cursos_extranjero').nullable(); // JSON guardado como TEXT
      table.date('ultimo_ascenso_pnp').nullable();
      table.text('fotografia_url').nullable(); // Guardará el Base64 WebP
      // Constraint chk_dni_format (MySQL no soporta CHECK, se maneja a nivel de app)
    })

    // ------------------------------------
    // TABLAS DE RELACIÓN (Muchos a Muchos / Relaciones de Usuario)
    // ------------------------------------

    // Tabla: usuario_grado
    .createTable('usuario_grado', (table) => {
      table.increments('id_usuario_grado').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
      table.integer('id_grado').unsigned().notNullable()
        .references('id_grado').inTable('grado')
        .onDelete('RESTRICT').onUpdate('CASCADE');
      table.timestamp('fecha_asignacion').defaultTo(knex.fn.now());
    })

    // Tabla: usuario_rol
    .createTable('usuario_rol', (table) => {
      table.increments('id_usuario_rol').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
      
      // CORRECCIÓN: Cambiado de tinyint() a integer() para que coincida con id_rol de la tabla 'rol'
      table.integer('id_rol').unsigned().notNullable() 
        .references('id_rol').inTable('rol')
        .onDelete('CASCADE').onUpdate('CASCADE');
    })

    // Tabla: usuario_turno
    .createTable('usuario_turno', (table) => {
      table.increments('id_usuario_turno').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
      table.integer('id_turno').unsigned().notNullable()
        .references('id_turno').inTable('turno')
        .onDelete('RESTRICT').onUpdate('CASCADE');
      table.timestamp('fecha_asignacion').defaultTo(knex.fn.now());
    })

    // Tabla: estado_usuario
    .createTable('estado_usuario', (table) => {
      table.increments('id_estado_usuario').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
      
      // CORRECCIÓN: Cambiado de tinyint() a integer() para que coincida con id_estado de la tabla 'estado'
      table.integer('id_estado').unsigned().notNullable() 
        .references('id_estado').inTable('estado')
        .onDelete('RESTRICT').onUpdate('CASCADE');
      table.timestamp('fecha_actualizacion').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      table.string('motivo', 300).notNullable().defaultTo('Usuario habilitado hasta dar motivo de inhabilitación.');
    })

    // Tabla: usuario_tipo_departamento (Relación Perito <-> Departamento)
    .createTable('usuario_tipo_departamento', (table) => {
      table.increments('id_usuario_tipo_departamento').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
      table.integer('id_tipo_departamento').unsigned().notNullable()
        .references('id_tipo_departamento').inTable('tipo_departamento')
        .onDelete('RESTRICT').onUpdate('CASCADE');
    })

    // Tabla: tipo_de_examen_departamento (Relación Examen <-> Departamento)
    .createTable('tipo_de_examen_departamento', (table) => {
      table.increments('id_tipo_de_examen_departamento').primary();
      table.integer('id_tipo_departamento').unsigned().notNullable()
        .references('id_tipo_departamento').inTable('tipo_departamento')
        .onDelete('RESTRICT').onUpdate('CASCADE');
      table.integer('id_tipo_de_examen').unsigned().notNullable()
        .references('id_tipo_de_examen').inTable('tipo_de_examen')
        .onDelete('RESTRICT').onUpdate('CASCADE');
    })

    // Tabla: historial_usuario (Log de Entradas/Salidas)
    .createTable('historial_usuario', (table) => {
      table.increments('id_historial_usuario').primary();
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario');
      table.enum('tipo_historial', ['ENTRADA', 'SALIDA']).notNullable();
      table.timestamp('fecha_historial').defaultTo(knex.fn.now());
    })

    // ------------------------------------
    // TABLAS PRINCIPALES (OFICIO Y SEGUIMIENTO)
    // ------------------------------------

    // Tabla: oficio
    .createTable('oficio', (table) => {
      table.increments('id_oficio').primary();
      table.string('numero_oficio', 20).notNullable().unique();
      table.timestamp('fecha_creacion').defaultTo(knex.fn.now());
      table.timestamp('fecha_actualizacion').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

      table.string('unidad_solicitante', 150).notNullable();
      table.string('celular_conductor', 20);
      table.string('situacion_persona', 40);
      table.string('region_fiscalia', 150);
      table.enum('tipo_de_muestra', ['MUESTRAS REMITIDAS', 'TOMA DE MUESTRAS']).notNullable();
      table.string('asunto', 400);

      table.string('examinado_incriminado', 200).nullable();
      table.string('dni_examinado_incriminado', 15).nullable();
      table.string('fecha_hora_incidente', 50).notNullable();

      table.string('especialidad_requerida', 200).notNullable();
      table.integer('id_especialidad_requerida').unsigned().notNullable()
        .references('id_tipo_departamento').inTable('tipo_departamento');
      
      table.string('tipo_examen', 300).notNullable();
      table.integer('id_tipo_examen').unsigned().notNullable()
        .references('id_tipo_de_examen').inTable('tipo_de_examen');

      table.string('muestra', 250).notNullable();
      table.string('perito_asignado', 250).notNullable();
      table.string('cip_perito_asignado', 20).notNullable();
      table.integer('id_usuario_perito_asignado').unsigned().notNullable()
        .references('id_usuario').inTable('usuario');

      // CORRECCIÓN: Cambiado de tinyint() a integer() para que coincida con id_prioridad de la tabla 'tipos_prioridad'
      table.integer('id_prioridad').unsigned().notNullable()
        .references('id_prioridad').inTable('tipos_prioridad');

      table.integer('creado_por').unsigned().notNullable()
        .references('id_usuario').inTable('usuario');
      table.integer('actualizado_por').unsigned().notNullable()
        .references('id_usuario').inTable('usuario');
    })

    // Tabla: seguimiento_oficio
    .createTable('seguimiento_oficio', (table) => {
      table.increments('id_seguimiento').primary();
      table.integer('id_oficio').unsigned().notNullable()
        .references('id_oficio').inTable('oficio');
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario');
      table.timestamp('fecha_seguimiento').defaultTo(knex.fn.now());
      table.string('estado_anterior', 150).nullable();
      table.string('estado_nuevo', 150).nullable();
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Deshabilitar temporalmente la verificación de claves foráneas para permitir borrado
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  
  await knex.schema
    .dropTableIfExists('seguimiento_oficio')
    .dropTableIfExists('oficio')
    .dropTableIfExists('historial_usuario')
    .dropTableIfExists('tipo_de_examen_departamento')
    .dropTableIfExists('usuario_tipo_departamento')
    .dropTableIfExists('estado_usuario')
    .dropTableIfExists('usuario_turno')
    .dropTableIfExists('usuario_rol')
    .dropTableIfExists('usuario_grado')
    .dropTableIfExists('perito')
    .dropTableIfExists('mesadepartes')
    .dropTableIfExists('administrador')
    .dropTableIfExists('usuario')
    // .dropTableIfExists('departamentos') // Esta tabla no está en tu migración UP, la comento
    .dropTableIfExists('tipo_de_examen')
    .dropTableIfExists('turno')
    .dropTableIfExists('grado')
    .dropTableIfExists('tipo_departamento')
    .dropTableIfExists('estado')
    .dropTableIfExists('tipos_prioridad')
    .dropTableIfExists('rol');

  // Reactivar la verificación de claves foráneas
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
}

