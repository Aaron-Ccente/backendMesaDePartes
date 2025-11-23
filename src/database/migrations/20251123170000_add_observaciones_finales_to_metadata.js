/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('oficio_resultados_metadata', (table) => {
    table.text('observaciones_finales').nullable().after('muestras_agotadas');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('oficio_resultados_metadata', (table) => {
    table.dropColumn('observaciones_finales');
  });
}
