/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('muestras', (table) => {
    table.increments('id_muestra').primary();
    table.integer('id_oficio').unsigned().notNullable();
    table.text('descripcion').notNullable();
    table.string('cantidad', 100);
    table.timestamp('fecha_recoleccion').defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.foreign('id_oficio').references('id_oficio').inTable('oficio').onDelete('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('muestras');
}