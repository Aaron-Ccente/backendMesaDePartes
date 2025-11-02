// backend-mesa-de-partes/src/database/migrations/20251101120001_add_hoja_de_ruta_tables.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema
    // Tabla para almacenar los resultados de cada perito en la hoja de ruta
    .createTable('oficio_resultados_perito', (table) => {
      table.increments('id_resultado').primary();
      
      table.integer('id_oficio').unsigned().notNullable()
        .references('id_oficio').inTable('oficio')
        .onDelete('CASCADE').onUpdate('CASCADE');
        
      table.integer('id_perito_responsable').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('NO ACTION').onUpdate('CASCADE');
        
      table.string('tipo_resultado', 100).notNullable()
        .comment('Ej. "TOXICOLOGICO", "DOSAJE_ETILICO", "TOMA_MUESTRA"');
        
      table.text('resultados').nullable()
        .comment('Resultados en formato JSON, ej: {"Alcaloide Cocaína": "NEGATIVO"}');
        
      table.timestamp('fecha_creacion').defaultTo(knex.fn.now());
      
      table.index(['id_oficio', 'tipo_resultado']);
    })
    
    // Tabla para almacenar los archivos adjuntos (ejem: PDF final firmado)
    .createTable('oficio_archivos', (table) => {
      table.increments('id_archivo').primary();
      
      table.integer('id_oficio').unsigned().notNullable()
        .references('id_oficio').inTable('oficio')
        .onDelete('CASCADE').onUpdate('CASCADE');
        
      table.string('id_archivo_google_drive', 255).nullable();
      table.string('nombre_archivo', 255).notNullable();
      
      table.enum('tipo_archivo', [
        'EVIDENCIA_INICIAL', 
        'DOCUMENTO_FINAL_FIRMADO', 
        'OTRO'
      ]).notNullable().defaultTo('OTRO');
      
      table.integer('subido_por').unsigned().notNullable()
        .references('id_usuario').inTable('usuario')
        .onDelete('NO ACTION').onUpdate('CASCADE');
        
      table.text('datos_receptor').nullable()
        .comment('JSON con datos de la persona que recoge el documento final');
        
      table.timestamp('fecha_subida').defaultTo(knex.fn.now());
      
      table.index('id_oficio');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema
    .dropTableIfExists('oficio_archivos')
    .dropTableIfExists('oficio_resultados_perito');
}
