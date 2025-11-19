/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('muestras', (table) => {
    // Añadir nuevos campos estructurados
    table.string('tipo_muestra', 255).notNullable();
    table.string('codigo_muestra', 255).notNullable().unique();
    table.boolean('esta_lacrado').notNullable().defaultTo(true);

    // Hacer la descripción original opcional
    table.text('descripcion').nullable().alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('muestras', (table) => {
    // Revertir los cambios en orden inverso
    table.text('descripcion').notNullable().alter();
    table.dropColumn('esta_lacrado');
    table.dropColumn('codigo_muestra');
    table.dropColumn('tipo_muestra');
  });
}