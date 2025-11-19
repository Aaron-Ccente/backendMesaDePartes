/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    // 1. Añadir campos a la tabla 'usuario'
    .alterTable('usuario', (table) => {
      table.string('cqfp', 50).nullable();
      table.string('domicilio_laboral', 255).nullable();
    })
    // 2. Añadir campo a la tabla 'muestras'
    .alterTable('muestras', (table) => {
      table.text('descripcion_detallada').nullable();
    })
    // 3. Crear nueva tabla para metadatos de resultados
    .createTable('oficio_resultados_metadata', (table) => {
      table.increments('id_metadata').primary();
      table.integer('id_oficio').unsigned().notNullable().references('id_oficio').inTable('oficio').onDelete('CASCADE');
      table.text('objeto_pericia').nullable();
      table.text('metodo_utilizado').nullable();
      table.timestamps(true, true);
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTableIfExists('oficio_resultados_metadata')
    .alterTable('muestras', (table) => {
      table.dropColumn('descripcion_detallada');
    })
    .alterTable('usuario', (table) => {
      table.dropColumn('cqfp');
      table.dropColumn('domicilio_laboral');
    });
}
