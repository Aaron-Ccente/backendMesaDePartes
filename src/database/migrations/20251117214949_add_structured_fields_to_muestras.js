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
export async function down(knex) {
  // Paso 1: Actualizar todos los valores NULL en 'descripcion' a un valor por defecto.
  await knex('muestras').whereNull('descripcion').update({ descripcion: '' });

  // Paso 2: Ahora que no hay NULLs, se puede alterar la tabla de forma segura.
  return knex.schema.alterTable('muestras', (table) => {
    // Revertir los cambios en orden inverso
    table.text('descripcion').notNullable().alter();
    table.dropColumn('esta_lacrado');
    table.dropColumn('codigo_muestra');
    table.dropColumn('tipo_muestra');
  });
}