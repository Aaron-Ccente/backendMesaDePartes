/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Primero, limpiar datos duplicados para poder añadir la restricción UNIQUE.
  // Nos quedaremos con el registro más reciente para cada id_oficio.
  await knex.raw(`
    DELETE t1 FROM oficio_resultados_metadata t1
    INNER JOIN oficio_resultados_metadata t2 
    WHERE 
        t1.id_metadata < t2.id_metadata AND 
        t1.id_oficio = t2.id_oficio;
  `);
  
  await knex.raw(`
    DELETE t1 FROM actas_apertura t1
    INNER JOIN actas_apertura t2 
    WHERE 
        t1.id_apertura < t2.id_apertura AND 
        t1.id_oficio = t2.id_oficio;
  `);

  // Ahora que no hay duplicados, podemos añadir los índices UNIQUE.
  await knex.schema.alterTable('oficio_resultados_metadata', (table) => {
    table.unique('id_oficio');
  });

  await knex.schema.alterTable('actas_apertura', (table) => {
    table.unique('id_oficio');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('oficio_resultados_metadata', (table) => {
    table.dropUnique('id_oficio');
  });
  
  await knex.schema.alterTable('actas_apertura', (table) => {
    table.dropUnique('id_oficio');
  });
}
