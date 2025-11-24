/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('oficio_resultados_perito', (table) => {
    // Añadir una restricción UNIQUE compuesta para asegurar que solo haya
    // un tipo de resultado por oficio. Esto previene el bug del "historial".
    table.unique(['id_oficio', 'tipo_resultado']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('oficio_resultados_perito', (table) => {
    // Eliminar la restricción UNIQUE si se necesita revertir.
    // El nombre de la restricción puede variar según la base de datos,
    // pero Knex lo maneja si se especifica la misma firma.
    table.dropUnique(['id_oficio', 'tipo_resultado']);
  });
}
