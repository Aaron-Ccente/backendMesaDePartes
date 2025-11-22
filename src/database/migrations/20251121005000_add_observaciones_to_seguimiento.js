/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('seguimiento_oficio', (table) => {
    // Añade la columna para observaciones, permitiendo que sea nula.
    table.text('observaciones').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // En caso de rollback, elimina la columna.
  await knex.schema.alterTable('seguimiento_oficio', (table) => {
    table.dropColumn('observaciones');
  });
}
