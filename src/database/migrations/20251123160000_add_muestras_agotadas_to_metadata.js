/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('oficio_resultados_metadata', (table) => {
    table.boolean('muestras_agotadas').notNullable().defaultTo(false).after('metodo_utilizado');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('oficio_resultados_metadata', (table) => {
    table.dropColumn('muestras_agotadas');
  });
}
