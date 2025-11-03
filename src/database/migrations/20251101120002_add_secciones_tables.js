// backend/src/database/migrations/20251101120002_add_secciones_tables.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema
    // 1. Crear la tabla 'seccion'
    .createTable('seccion', (table) => {
      table.increments('id_seccion').primary();
      table.string('nombre', 100).notNullable();
      
      // Relacionar la sección con un departamento (ej. "Laboratorio" -> "Toxicología Forense")
      table.integer('id_tipo_departamento').unsigned().notNullable()
        .references('id_tipo_departamento').inTable('tipo_departamento')
        .onDelete('CASCADE').onUpdate('CASCADE'); // Si se borra el depto, se borra la sección
        
      table.text('descripcion').nullable();
      table.unique(['nombre', 'id_tipo_departamento']); // No permitir secciones duplicadas en el mismo depto
    })
    // 2. Crear la tabla de relación 'usuario_seccion'
    .createTable('usuario_seccion', (table) => {
      table.increments('id_usuario_seccion').primary();
      
      table.integer('id_usuario').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('CASCADE').onUpdate('CASCADE');
        
      table.integer('id_seccion').unsigned().notNullable()
        .references('id_seccion').inTable('seccion')
        .onDelete('CASCADE').onUpdate('CASCADE'); // Si se borra la sección, se borra la asignación
        
      table.timestamp('fecha_asignacion').defaultTo(knex.fn.now());
      table.unique(['id_usuario', 'id_seccion']); // Un usuario no puede estar 2 veces en la misma sección
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema
    .dropTableIfExists('usuario_seccion')
    .dropTableIfExists('seccion');
}
