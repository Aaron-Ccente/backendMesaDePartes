/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('oficio_resultados_metadata', function(table) {
    table.text('informe_pericial_firmado_path');
    table.text('documentos_finales_escaneados_path');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('oficio_resultados_metadata', function(table) {
    table.dropColumn('informe_pericial_firmado_path');
    table.dropColumn('documentos_finales_escaneados_path');
  });
};