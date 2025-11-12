/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.table('seguimiento_oficio', (table) => {
    table.integer('id_conductor').unsigned().nullable().after('id_usuario');
    table.foreign('id_conductor').references('id_usuario').inTable('usuario').onDelete('SET NULL');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.table('seguimiento_oficio', (table) => {
    // Se debe eliminar primero la foreign key antes de la columna
    table.dropForeign('id_conductor');
    table.dropColumn('id_conductor');
  });
}