/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('configuracion_sistema', (table) => {
    table.increments('id_config').primary();
    table.string('clave', 100).notNullable().unique();
    table.text('valor').notNullable();
    table.string('categoria', 50).notNullable();
    table.string('descripcion', 255).nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Seed initial data
  const configs = [
    // INSTITUCIONAL
    {
      clave: 'ANIO_LEMA',
      valor: 'Año de la Recuperación y Consolidación de la Economía Peruana',
      categoria: 'INSTITUCIONAL',
      descripcion: 'Lema del año que aparece en la parte superior de los documentos.'
    },
    {
      clave: 'MEMBRETE_COMANDO',
      valor: 'IV MACRO REGION POLICIAL JUNIN',
      categoria: 'INSTITUCIONAL',
      descripcion: 'Primera línea del membrete institucional.'
    },
    {
      clave: 'MEMBRETE_DIRECCION',
      valor: 'REGPOL-JUNIN',
      categoria: 'INSTITUCIONAL',
      descripcion: 'Segunda línea del membrete institucional.'
    },
    {
      clave: 'MEMBRETE_REGION',
      valor: 'DIVINCRI-HYO/OFICRI',
      categoria: 'INSTITUCIONAL',
      descripcion: 'Tercera línea del membrete institucional.'
    },
    {
      clave: 'SUFIJO_OFICIO',
      valor: 'IV-MACREPOL-JUN-DIVINCRI/OFICRI.',
      categoria: 'INSTITUCIONAL',
      descripcion: 'Sufijo que acompaña al número de oficio.'
    },

    // CONTACTO
    {
      clave: 'SEDE_NOMBRE',
      valor: 'Oficina de Criminalística Huancayo',
      categoria: 'CONTACTO',
      descripcion: 'Nombre de la sede en el pie de página.'
    },
    {
      clave: 'SEDE_DIRECCION',
      valor: 'Jr. Cuzco N° 666',
      categoria: 'CONTACTO',
      descripcion: 'Dirección física en el pie de página.'
    },
    {
      clave: 'SEDE_TELEFONO',
      valor: '064212453',
      categoria: 'CONTACTO',
      descripcion: 'Teléfono fijo de contacto.'
    },
    {
      clave: 'SEDE_CELULAR',
      valor: '980122629',
      categoria: 'CONTACTO',
      descripcion: 'Número de celular de contacto.'
    },
    {
      clave: 'SEDE_EMAIL',
      valor: 'rpi.dic.ificri@policia.gob.pe',
      categoria: 'CONTACTO',
      descripcion: 'Correo electrónico de contacto.'
    },

    // DOCUMENTOS
    {
      clave: 'FIRMANTE_CARGO_DEF',
      valor: 'PERITO QUIMICO FORENSE',
      categoria: 'DOCUMENTOS',
      descripcion: 'Cargo por defecto del firmante si no se especifica.'
    },
    {
      clave: 'FIRMANTE_DEP_DEF',
      valor: 'OFICRI-PNP-HYO',
      categoria: 'DOCUMENTOS',
      descripcion: 'Dependencia del firmante por defecto.'
    },
    {
      clave: 'TEXTO_LEGAL_INFORME',
      valor: 'Le recordamos que los informes periciales constituyen el sustento científico de toda la investigación policial, por consiguiente, su omisión en la remisión a la autoridad competente, infringe normas vigentes que conllevan responsabilidad administrativa, disciplinaria y penal.',
      categoria: 'DOCUMENTOS',
      descripcion: 'Texto legal obligatorio al final de los informes.'
    },
    {
      clave: 'TEXTO_DESPEDIDA',
      valor: 'Es propicia la oportunidad para reiterarle los sentimientos de mi especial consideración y deferente estima',
      categoria: 'DOCUMENTOS',
      descripcion: 'Párrafo de despedida formal.'
    },
    {
      clave: 'TEXTO_DIOS_GUARDE',
      valor: 'Dios guarde a Ud.',
      categoria: 'DOCUMENTOS',
      descripcion: 'Cierre formal del documento.'
    }
  ];

  await knex('configuracion_sistema').insert(configs);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('configuracion_sistema');
}