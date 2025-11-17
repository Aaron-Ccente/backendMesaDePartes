/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('cadena_de_custodia', (table) => {
    table.increments('id_evento_custodia').primary();
    
    table.integer('id_muestra').unsigned().notNullable();
    table.foreign('id_muestra').references('id_muestra').inTable('muestras').onDelete('CASCADE');

    table.integer('id_perito_entrega').unsigned().notNullable();
    table.foreign('id_perito_entrega').references('id_usuario').inTable('usuario');

    table.integer('id_perito_recibe').unsigned().nullable();
    table.foreign('id_perito_recibe').references('id_usuario').inTable('usuario');

    table.timestamp('fecha_transferencia').defaultTo(knex.fn.now());
    table.string('proposito', 255).notNullable(); // Ej: 'CREACIÓN', 'DERIVACIÓN', 'ANÁLISIS'
    table.text('observaciones').nullable();
    
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('cadena_de_custodia');
}