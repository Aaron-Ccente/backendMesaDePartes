/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.table('oficio', function(table) {
    // Agregamos la columna como string (VARCHAR) y nullable por si hay registros viejos
    table.string('numero_de_registro', 100).nullable().after('numero_oficio');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.table('oficio', function(table) {
    table.dropColumn('numero_de_registro');
  });
}
