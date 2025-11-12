/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('oficio_examen', (table) => {
    table.increments('id').primary();
    table.integer('id_oficio').unsigned().notNullable().references('id_oficio').inTable('oficio').onDelete('CASCADE');
    table.integer('id_tipo_de_examen').unsigned().notNullable().references('id_tipo_de_examen').inTable('tipo_de_examen').onDelete('CASCADE');
    
    // Para evitar duplicados
    table.unique(['id_oficio', 'id_tipo_de_examen']);
  });

  await knex.schema.table('oficio', (table) => {
    // Primero se debe eliminar la restricción de la clave foránea
    table.dropForeign('id_tipo_examen');
    
    // Ahora sí se pueden eliminar las columnas
    table.dropColumn('id_tipo_examen');
    table.dropColumn('tipo_examen');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('oficio_examen');

  await knex.schema.table('oficio', (table) => {
    // Volvemos a añadir las columnas si se revierte la migración
    table.string('tipo_examen', 300).notNullable().defaultTo('N/A');
    table.integer('id_tipo_examen').unsigned().nullable();
    
    // Y volvemos a crear la restricción de clave foránea
    table.foreign('id_tipo_examen').references('id_tipo_de_examen').inTable('tipo_de_examen');
  });
}