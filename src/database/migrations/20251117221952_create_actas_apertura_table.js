/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('actas_apertura', (table) => {
    table.increments('id_apertura').primary();
    
    table.integer('id_oficio').unsigned().notNullable();
    table.foreign('id_oficio').references('id_oficio').inTable('oficio').onDelete('CASCADE');

    table.integer('id_perito').unsigned().notNullable();
    table.foreign('id_perito').references('id_usuario').inTable('usuario');

    table.timestamp('fecha_apertura').defaultTo(knex.fn.now());
    table.text('descripcion_paquete').notNullable(); // Descripción de cómo se recibió el paquete sellado
    table.text('observaciones').nullable(); // Observaciones adicionales durante la apertura
    
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('actas_apertura');
}