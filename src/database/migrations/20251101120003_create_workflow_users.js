// backend/src/database/migrations/20251101120003_create_workflow_users.js
// THIS MIGRATION IS NOW ONLY FOR CREATING SECTIONS. USER SEEDING IS HANDLED IN 01_initial_data.js

// ID 6 = TOXICOLOGÍA FORENSE (según el seed 01_initial_data.js)
const ID_DEPTO_TOXICOLOGIA = 6;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // --- 1. Crear las Secciones ---
  // (Estas secciones pertenecen al departamento de Toxicología)
  // Se usa .onConflict().ignore() para evitar errores si ya existen en un entorno de desarrollo.
  await knex('seccion')
    .insert([
      { nombre: 'Toma de Muestra', id_tipo_departamento: ID_DEPTO_TOXICOLOGIA },
      { nombre: 'Laboratorio', id_tipo_departamento: ID_DEPTO_TOXICOLOGIA },
      { nombre: 'Instrumentalización', id_tipo_departamento: ID_DEPTO_TOXICOLOGIA }
    ])
    .onConflict(['nombre', 'id_tipo_departamento'])
    .ignore();
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Elimina las secciones creadas
  await knex('seccion').where({ id_tipo_departamento: ID_DEPTO_TOXICOLOGIA }).del();
}
