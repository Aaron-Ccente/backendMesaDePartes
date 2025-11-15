/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.table('oficio', (table) => {
    table.string('delito', 255).nullable();
    table.string('direccion_implicado', 255).nullable();
    table.string('celular_implicado', 20).nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.table('oficio', (table) => {
    table.dropColumn('delito');
    table.dropColumn('direccion_implicado');
    table.dropColumn('celular_implicado');
  });
}
