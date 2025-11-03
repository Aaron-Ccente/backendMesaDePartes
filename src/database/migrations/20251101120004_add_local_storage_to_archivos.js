// backend/src/database/migrations/20251101120004_add_local_storage_to_archivos.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('oficio_archivos', (table) => {
    // Añadimos la columna para guardar la ruta del archivo en el servidor local
    // (ej: '/uploads/oficios/informe_112_firmado.pdf')
    // Es 'nullable' porque la otra opción (id_archivo_google_drive) también es 'nullable'.
    // Un archivo debe tener una ruta local O una ruta de Google Drive.
    table.string('ruta_archivo_local', 512).nullable().after('id_archivo_google_drive');
    
    // Hacemos que la columna de Google Drive también sea 'nullable' por si las dudas
    table.string('id_archivo_google_drive', 255).nullable().alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('oficio_archivos', (table) => {
    // Para deshacer, simplemente eliminamos la columna
    table.dropColumn('ruta_archivo_local');
    
    // (Opcional: revertir el cambio a nullable de Google Drive si es necesario para funcionalida de Google Drive)
  });
}

