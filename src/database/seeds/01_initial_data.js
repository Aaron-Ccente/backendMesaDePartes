// backend-mesa-de-partes/src/database/seeds/01_initial_data.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // --- 1. LIMPIAR TABLAS (en orden inverso de dependencia) ---
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  
  await knex('tipo_de_examen_departamento').del();
  await knex('tipo_de_examen').del();
  await knex('grado').del();
  await knex('tipos_prioridad').del();
  await knex('turno').del();
  await knex('tipo_departamento').del();
  await knex('estado').del();
  await knex('rol').del();
  await knex('usuario_turno').del();
  await knex('usuario_tipo_departamento').del();
  await knex('estado_usuario').del();
  await knex('usuario_grado').del();
  await knex('perito').del();
  await knex('usuario_rol').del();
  await knex('usuario').del();
  await knex.raw('ALTER TABLE usuario AUTO_INCREMENT = 1');
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // --- 2. INSERTAR ROLES ---
  await knex('rol').insert([
    { id_rol: 1, nombre_rol: 'ADMINISTRADOR', descripcion: 'Administra a todos los peritos - control total.' },
    { id_rol: 2, nombre_rol: 'PERITO', descripcion: 'Profesional capacitado.' },
    { id_rol: 3, nombre_rol: 'CENTRAL', descripcion: 'Encargado de dirigir los primeros documentos.' }
  ]);

  // --- 3. INSERTAR ESTADOS ---
  await knex('estado').insert([
    { id_estado: 1, nombre_estado: 'HABILITADO', descripcion: 'Usuario que puede realizar acciones en la plataforma.' },
    { id_estado: 2, nombre_estado: 'DESHABILITADO', descripcion: 'Usuario que no puede realizar acciones en la plataforma.' }
  ]);

  // --- 4. INSERTAR TIPOS DE DEPARTAMENTO ---
  await knex('tipo_departamento').insert([
    { id_tipo_departamento: 1, nombre_departamento: 'ESCENA DEL CRIMEN', descripcion: 'Escena del crimen - descripción' },
    { id_tipo_departamento: 2, nombre_departamento: 'BALÍSTICA FORENSE', descripcion: 'Balistica Forense - descripción' },
    { id_tipo_departamento: 3, nombre_departamento: 'BIOLOGÍA FORENSE', descripcion: 'Biología Forense - descripción' },
    { id_tipo_departamento: 4, nombre_departamento: 'INGENIERÍA FORENSE', descripcion: 'Ingeniería Forense - descripción' },
    { id_tipo_departamento: 5, nombre_departamento: 'INFORMÁTICA FORENSE', descripcion: 'Informática Forense - descripción' },
    { id_tipo_departamento: 6, nombre_departamento: 'TOXICOLOGÍA FORENSE', descripcion: 'TOXICOLOGÍA FORENSE - descripción' },
    { id_tipo_departamento: 7, nombre_departamento: 'GRAFOTECNIA FORENSE', descripcion: 'GRAFOTÉCNIA - descripción' },
    { id_tipo_departamento: 8, nombre_departamento: 'CONTABILIDAD Y TASACIÓN FORENSE', descripcion: 'Contabilidad y Tasación Forense - descripción' },
    { id_tipo_departamento: 9, nombre_departamento: 'PSICOLOGÍA FORENSE', descripcion: 'Psicología Forense - descripción' },
    { id_tipo_departamento: 10, nombre_departamento: 'IDENTIFICACIÓN CRIMINALÍSTICA', descripcion: 'Identificación Criminalísitica - descripción' },
    { id_tipo_departamento: 11, nombre_departamento: 'Toma de Muestra', descripcion: 'Departamento para el Flujo 1 de Toxicología' },
    { id_tipo_departamento: 12, nombre_departamento: 'Laboratorio', descripcion: 'Departamento para análisis y consolidación en Toxicología' },
    { id_tipo_departamento: 13, nombre_departamento: 'Instrumentalización', descripcion: 'Departamento para Dosaje Etílico en Toxicología' }
  ]);

  // --- 5. INSERTAR GRADOS ---
  await knex('grado').insert([
    { id_grado: 1, nombre: 'Coronel' },
    { id_grado: 2, nombre: 'Comandante' },
    { id_grado: 3, nombre: 'Mayor' },
    { id_grado: 4, nombre: 'Capitán' },
    { id_grado: 5, nombre: 'Teniente' },
    { id_grado: 6, nombre: 'Alférez' },
    { id_grado: 7, nombre: 'Suboficial Superior' },
    { id_grado: 8, nombre: 'Suboficial Brigadier' },
    { id_grado: 9, nombre: 'Suboficial Técnico de Primera' },
    { id_grado: 10, nombre: 'Suboficial Técnico de Segunda' },
    { id_grado: 11, nombre: 'Suboficial Técnico de Tercera' },
    { id_grado: 12, nombre: 'Suboficial de Primera' },
    { id_grado: 13, nombre: 'Suboficial de Segunda' },
    { id_grado: 14, nombre: 'Suboficial de Tercera' }
  ]);

  // --- 6. INSERTAR TIPOS DE EXAMEN ---
  await knex('tipo_de_examen').insert([
    { id_tipo_de_examen: 1, nombre: 'Balistico en armas, Municiones - elementos balísticos o análogos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 2, nombre: 'Balístico en ropas', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 3, nombre: 'Inspección Balística', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 4, nombre: 'Identidad Balística, Marcas de herramientas, EMC estudio microscópico comparativo', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 5, nombre: 'Informes Técnicos, Especializados - Recontrucciones judiciales/Fiscales', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 6, nombre: 'Materiales, Insumos, Productos, Artefactos explosivos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 7, nombre: 'Inspección Explosivos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 8, nombre: 'TRICOLÓGICO (cabellos - vellos)', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 9, nombre: 'HEMATOLÓGICO', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 10, nombre: 'ESPERMATOLÓGICO', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 11, nombre: 'SARRO UNGUEAL', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 12, nombre: 'HOMOLOGACIÓN DE ADN', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 13, nombre: 'FISICO - en armas blancas', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 14, nombre: 'FISICO - en prendas de vestir', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 15, nombre: 'FISICO - en objetos rígidos (contundentes)', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 16, nombre: 'FISICO - en elementos constrictores', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 17, nombre: 'FISICO - en sustancias terrosas', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 18, nombre: 'FISICO - en artefactos incendiarios de fabricación casera', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 19, nombre: 'FISICO - en placas vehiculares', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 20, nombre: 'FISICO - en de homologación de pinturas en evidencias trazas', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 21, nombre: 'Examen de sustancias químicas impregnadas en prendas de vestir', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 22, nombre: 'Examen de hidrocarburos derivados de petróleo y/o aceites impregnados en prendas de vestir', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 23, nombre: 'Revenido químico de números de serie en soportes metálicos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 24, nombre: 'Examen de homologación fisica en productos industriales', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 25, nombre: 'Examen de absorción atómica para restos de disparo por arma de fuego', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 26, nombre: 'Examen para detección de hidrocarburos derivados del petróleo', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 27, nombre: 'Exámenes instrumentales de espectrometría de infrarrojo FTIR para la detección de sustancias desconocidas', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 28, nombre: 'ANÁLISIS INFORMÁTICO FORENSE', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 29, nombre: 'OPERATIVIDAD DE EQUIPO TERMINAL MÓVIL, TARJETA SIM', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 30, nombre: 'ANÁLISIS DE ARCHIVOS DE VIDEOGRAMAS E IMAGEN', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 31, nombre: 'HOMOLOGACIÓN DE IMÁGENES DE VIDEO', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 32, nombre: 'OPERATIVIDAD DE DISPOSITIVOS ELECTRÓNICOS', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 33, nombre: 'TOXICOLÓGICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 34, nombre: 'TOXICOLÓGICO EN MUESTRAS REMITIDAS', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 35, nombre: 'DOSAJE ETÍLICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 36, nombre: 'ADHERENCIA DE DROGAS ILICITA EN MUESTRAS TRASLADADAS AL LABORATORIOY VEHICULOS MOTORIZADOS', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 37, nombre: 'ANÁLISIS DE INSUMOS QUÍMICOS FISCALIZADOS EN MUESTRAS TRASLADADAS AL LABORATORIO', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 38, nombre: 'Examen de determinación por adicción o supresión en documentos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 39, nombre: 'Examen de superposición o prelación de trazos, para determinar abuso de firmas en blanco', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 40, nombre: 'Examen de entrecruzamiento de trazos, de tintas y dobleces', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 41, nombre: 'Examen de procedencia de fotocopias', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 42, nombre: 'Examen de determinación de fotomontaje o fotocomposiciones', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 43, nombre: 'Examen de autenticidad o falsedad de documentos de identidad', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 44, nombre: 'Examen de sistemas de impresión', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 45, nombre: 'Examen de papel carbón y papel auto-copiativo', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 46, nombre: 'Examen en sobres, embalajes y afines, a fin de establecer posible violación de correspondencia', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 47, nombre: 'Anacronismo en el receptor, normativo y tecnológico', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 48, nombre: 'Examen de autenticidad o falsedad de firmas', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 49, nombre: 'Examen de procedencia - auditoría de manuscritos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 50, nombre: 'Examen de análisis de moneda nacional y/o extranjera', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 51, nombre: 'Informe Pericial en Lavado de Activos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 52, nombre: 'Tasación de bienes muebles', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 53, nombre: 'Tasaciones de predios urbanos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 54, nombre: 'Tasaciones de predios rústicos, predios erizados y otros bienes agropecuarios', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 55, nombre: 'Tasación de propiedad empresarial', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 56, nombre: 'Tasaciones en bienes inmuebles en los procesos de adquisición o expropiación', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 57, nombre: 'Tasaciones de aeronaves, embarcaciones y yacimientos mineros', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 58, nombre: 'Examen Psicológico en Personas', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 59, nombre: 'Análisis Psicografológico de Manuscritos', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 60, nombre: 'Pronunciamiento Psicológico en Material Diverso', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 61, nombre: 'Perfiliación Criminal en la Escena del Crimen', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 62, nombre: 'Entrevista Psicológica Retrospectiva (necropsia)', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 63, nombre: 'Procesamiento de fragmentos de huellas papilares latentes, para identidad dactilar y/o personal', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 64, nombre: 'Identidad dactilar y/o personal en documentos cuestionados', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 65, nombre: 'Identidad plena en persona', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 66, nombre: 'Enrolamiento biométrico en vivo', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 67, nombre: 'Identificación de cadáveres NN', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 68, nombre: 'Procesamiento de latentes faciales para identidad facial y/o personal', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 69, nombre: 'Homologación facial o identificación facial', descripcion: 'Balistico en armas - descripción' },
    { id_tipo_de_examen: 70, nombre: 'Confección de IDENTIFAC', descripcion: 'Balistico en armas - descripción' }
  ]);

  // --- 7. INSERTAR TURNOS ---
  await knex('turno').insert([
    { id_turno: 1, nombre: 'Mañana' },
    { id_turno: 2, nombre: 'Tarde' },
    { id_turno: 3, nombre: 'Noche' },
    { id_turno: 4, nombre: 'Guardia 24 horas' }
  ]);

  // --- 8. INSERTAR PRIORIDADES DE OFICIO ---
  await knex('tipos_prioridad').insert([
    { id_prioridad: 1, nombre_prioridad: 'Flagrancia' },
    { id_prioridad: 2, nombre_prioridad: 'Flagrancia con detenido' },
    { id_prioridad: 3, nombre_prioridad: 'Alta' },
    { id_prioridad: 4, nombre_prioridad: 'Media' }
  ]);

  // --- 9. INSERTAR RELACIONES TIPO_EXAMEN <-> DEPARTAMENTO ---
  await knex('tipo_de_examen_departamento').insert([
    { id_tipo_departamento: 2, id_tipo_de_examen: 1 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 2 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 3 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 4 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 5 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 6 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 7 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 8 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 9 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 10 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 11 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 12 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 13 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 14 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 15 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 16 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 17 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 18 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 19 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 20 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 21 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 23 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 24 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 25 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 26 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 27 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 28 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 29 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 30 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 31 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 32 },
    { id_tipo_departamento: 6, id_tipo_de_examen: 33 },
    { id_tipo_departamento: 6, id_tipo_de_examen: 34 },
    { id_tipo_departamento: 6, id_tipo_de_examen: 35 },
    { id_tipo_departamento: 6, id_tipo_de_examen: 36 },
    { id_tipo_departamento: 6, id_tipo_de_examen: 37 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 38 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 39 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 40 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 41 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 42 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 43 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 44 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 45 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 46 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 47 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 48 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 49 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 50 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 51 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 52 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 53 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 54 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 55 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 56 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 57 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 58 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 59 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 60 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 61 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 62 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 63 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 64 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 65 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 66 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 67 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 68 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 69 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 70 },

    // --- ASIGNACIONES FALTANTES ---
    // ESCENA DEL CRIMEN (ID 1)
    { id_tipo_departamento: 1, id_tipo_de_examen: 3 },  // Inspección Balística
    { id_tipo_departamento: 1, id_tipo_de_examen: 7 },  // Inspección Explosivos
    { id_tipo_departamento: 1, id_tipo_de_examen: 61 }, // Perfiliación Criminal en la Escena del Crimen
    { id_tipo_departamento: 1, id_tipo_de_examen: 63 }, // Procesamiento de fragmentos de huellas papilares

    // Toma de Muestra (ID 11)
    { id_tipo_departamento: 11, id_tipo_de_examen: 33 }, // TOXICOLÓGICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE
    { id_tipo_departamento: 11, id_tipo_de_examen: 35 }, // DOSAJE ETÍLICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE

    // Laboratorio (ID 12)
    { id_tipo_departamento: 12, id_tipo_de_examen: 34 }, // TOXICOLÓGICO EN MUESTRAS REMITIDAS
    { id_tipo_departamento: 12, id_tipo_de_examen: 36 }, // ADHERENCIA DE DROGAS ILICITA
    { id_tipo_departamento: 12, id_tipo_de_examen: 37 }, // ANÁLISIS DE INSUMOS QUÍMICOS FISCALIZADOS

    // Instrumentalización (ID 13)
    { id_tipo_departamento: 13, id_tipo_de_examen: 25 }, // Examen de absorción atómica
    { id_tipo_departamento: 13, id_tipo_de_examen: 27 }  // Exámenes instrumentales de espectrometría
  ]);
  // --- 10. INSERTAR USUARIO DE MESA DE PARTES Y SU ROL---  (CUENTA POR DEFECTO PARA PRUEBAS USAR 2023 :) )
  await knex('usuario').insert([
    { id_usuario: 3, CIP: '2023', nombre_completo: 'mesa de partes', nombre_usuario: 'Ccente',password_hash: '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK' },
    { id_usuario: 4, CIP: '2024', nombre_completo: 'mesa de partes 2', nombre_usuario: 'Ccente 2',password_hash: '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK' },
    { id_usuario: 5, CIP: '2025', nombre_completo: 'mesa de partes 3', nombre_usuario: 'Ccente 3',password_hash: '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK' },
    { id_usuario: 6, CIP: '2026', nombre_completo: 'mesa de partes 4', nombre_usuario: 'Ccente 4',password_hash: '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK' }
  ]);
  await knex('usuario_rol').insert([
    { id_usuario: 3, id_rol: 3 },
    { id_usuario: 4, id_rol: 3 },
    { id_usuario: 5, id_rol: 3 },
    { id_usuario: 6, id_rol: 3 }
  ]);

  // --- 11. INSERTAR USUARIO ADMINISTRADOR Y SU ROL---(CUENTA POR DEFECTO PARA PRUEBAS USAR 2021 :) )

  await knex('usuario').insert([
    { id_usuario: 1, CIP: '2021', nombre_completo: 'admin', nombre_usuario: 'admin', password_hash: '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK' }
  ]);

  await knex('usuario_rol').insert([
    { id_usuario: 1, id_rol: 1 }
  ]);

  // --- 12. INSERTAR USUARIO PERITO Y SU ROL--- (CUENTA POR DEFECTO PARA PRUEBAS USAR 2022 :) )

  await knex('usuario').insert([
    { id_usuario: 2, CIP: '2022', nombre_completo: 'perito', nombre_usuario: 'perito', password_hash: '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK' }
  ]);
  // rol de perito
  await knex('usuario_rol').insert([
    { id_usuario: 2, id_rol: 2 }
  ]);
   // datos adicionales de perito
    await knex('perito').insert([
    { id_perito: 1, id_usuario: 2, dni: '74985252', email: 'aronccente@gmail.com', unidad: 'oficri', fecha_integracion_pnp: '2025-10-01',fecha_incorporacion: '2025-10-01', codigo_codofin: 'COD1234',domicilio: 'Av. Siempre Viva 123', telefono: '987654321',cursos_institucionales: 'Curso de Prueba',cursos_extranjero: 'Curso de Prueba',ultimo_ascenso_pnp: '2025-10-01',fotografia_url: 'http://example.com/foto.jpg'}
  ]);
  // Grado del perito
  await knex('usuario_grado').insert([
    { id_usuario_grado: 1, id_usuario: 2, id_grado: 3 }
  ]);
  // Estado del usuario (HABILITADO o DESHABILITADO)
  await knex('estado_usuario').insert([
    { id_estado_usuario: 1, id_usuario: 2, id_estado: 1 }
  ]);
  // Departamento del perito
  await knex('usuario_tipo_departamento').insert([
    { id_usuario_tipo_departamento: 1, id_usuario: 2, id_tipo_departamento: 6 }
  ]);
  // Turno del perito
  await knex('usuario_turno').insert([
    { id_usuario_turno: 1, id_usuario: 2, id_turno: 1 }
  ]);

  // --- 13. INSERTAR USUARIOS PERSONALIZADOS DEL CLIENTE ---
  const customUserPassword = '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK'; // Corresponde a "123456"
  await knex('usuario').insert([
    { id_usuario: 110, CIP: '110', nombre_completo: 'Usuario Mesa de Partes', nombre_usuario: 'mesapartes110', password_hash: customUserPassword },
    { id_usuario: 112, CIP: '112', nombre_completo: 'Usuario Administrador', nombre_usuario: 'admin112', password_hash: customUserPassword },
    { id_usuario: 111, CIP: '111', nombre_completo: 'Perito Toma Muestra', nombre_usuario: 'perito111', password_hash: customUserPassword },
    { id_usuario: 222, CIP: '222', nombre_completo: 'Perito Laboratorio', nombre_usuario: 'perito222', password_hash: customUserPassword },
    { id_usuario: 333, CIP: '333', nombre_completo: 'Perito Instrumentalizacion', nombre_usuario: 'perito333', password_hash: customUserPassword },
  ]);

  // Asignar roles
  await knex('usuario_rol').insert([
    { id_usuario: 110, id_rol: 3 }, // Mesa de Partes
    { id_usuario: 112, id_rol: 1 }, // Admin
    { id_usuario: 111, id_rol: 2 }, // Perito
    { id_usuario: 222, id_rol: 2 }, // Perito
    { id_usuario: 333, id_rol: 2 }, // Perito
  ]);

  // Asignar a tablas de rol específicas
  await knex('mesadepartes').insert([{id_usuario: 110}]);
  await knex('administrador').insert([{id_usuario: 112}]);
  await knex('perito').insert([
      { id_usuario: 111, dni: '11111111' },
      { id_usuario: 222, dni: '22222222' },
      { id_usuario: 333, dni: '33333333' },
  ]);

  // Asignar peritos a sus departamentos
  await knex('usuario_tipo_departamento').insert([
      { id_usuario: 111, id_tipo_departamento: 11 }, // Perito 111 -> Toma de Muestra (ID 11)
      { id_usuario: 222, id_tipo_departamento: 12 }, // Perito 222 -> Laboratorio (ID 12)
      { id_usuario: 333, id_tipo_departamento: 13 }, // Perito 333 -> Instrumentalización (ID 13)
  ]);
}