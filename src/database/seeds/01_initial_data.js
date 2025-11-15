// backend-mesa-de-partes/src/database/seeds/01_initial_data.js
import bcrypt from 'bcryptjs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // --- 1. LIMPIAR TABLAS (en orden inverso de dependencia) ---
  // Deshabilitar la verificación de claves foráneas para un borrado limpio
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  
  // Limpiar todas las tablas que se van a poblar
  await knex('usuario_seccion').del();
  await knex('seccion').del();
  await knex('tipo_de_examen_departamento').del();
  await knex('tipo_de_examen').del();
  await knex('tipos_prioridad').del();
  await knex('usuario_turno').del();
  await knex('turno').del();
  await knex('usuario_grado').del();
  await knex('grado').del();
  await knex('usuario_tipo_departamento').del();
  await knex('tipo_departamento').del();
  await knex('estado_usuario').del();
  await knex('estado').del();
  await knex('perito').del();
  await knex('mesadepartes').del();
  await knex('administrador').del();
  await knex('usuario_rol').del();
  await knex('rol').del();
  await knex('usuario').del();

  // Reiniciar el autoincremento para una base de datos limpia
  await knex.raw('ALTER TABLE usuario AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE rol AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE estado AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE tipo_departamento AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE grado AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE turno AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE tipos_prioridad AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE tipo_de_examen AUTO_INCREMENT = 1');
  await knex.raw('ALTER TABLE seccion AUTO_INCREMENT = 1');

  // Reactivar la verificación de claves foráneas
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // --- 2. INSERTAR DATOS DE REFERENCIA ---

  // Roles
  await knex('rol').insert([
    { id_rol: 1, nombre_rol: 'ADMINISTRADOR', descripcion: 'Administra a todos los peritos - control total.' },
    { id_rol: 2, nombre_rol: 'PERITO', descripcion: 'Profesional capacitado.' },
    { id_rol: 3, nombre_rol: 'CENTRAL', descripcion: 'Encargado de dirigir los primeros documentos.' }
  ]);

  // Estados
  await knex('estado').insert([
    { id_estado: 1, nombre_estado: 'HABILITADO', descripcion: 'Usuario que puede realizar acciones en la plataforma.' },
    { id_estado: 2, nombre_estado: 'DESHABILITADO', descripcion: 'Usuario que no puede realizar acciones en la plataforma.' }
  ]);

  // Tipos de Departamento (sin los obsoletos 11, 12, 13)
  await knex('tipo_departamento').insert([
    { id_tipo_departamento: 1, nombre_departamento: 'ESCENA DEL CRIMEN' },
    { id_tipo_departamento: 2, nombre_departamento: 'BALÍSTICA FORENSE' },
    { id_tipo_departamento: 3, nombre_departamento: 'BIOLOGÍA FORENSE' },
    { id_tipo_departamento: 4, nombre_departamento: 'INGENIERÍA FORENSE' },
    { id_tipo_departamento: 5, nombre_departamento: 'INFORMÁTICA FORENSE' },
    { id_tipo_departamento: 6, nombre_departamento: 'TOXICOLOGÍA FORENSE' },
    { id_tipo_departamento: 7, nombre_departamento: 'GRAFOTECNIA FORENSE' },
    { id_tipo_departamento: 8, nombre_departamento: 'CONTABILIDAD Y TASACIÓN FORENSE' },
    { id_tipo_departamento: 9, nombre_departamento: 'PSICOLOGÍA FORENSE' },
    { id_tipo_departamento: 10, nombre_departamento: 'IDENTIFICACIÓN CRIMINALÍSTICA' },
  ]);

    // Secciones
  await knex('seccion').insert([
    { id_seccion: 1, nombre: 'Toma de Muestra', id_tipo_departamento: 6 },
    { id_seccion: 2, nombre: 'Laboratorio', id_tipo_departamento: 6 },
    { id_seccion: 3, nombre: 'Instrumentalización', id_tipo_departamento: 6 }
  ]);

  // Grados
  await knex('grado').insert([
    { id_grado: 1, nombre: 'Coronel' }, { id_grado: 2, nombre: 'Comandante' }, { id_grado: 3, nombre: 'Mayor' },
    { id_grado: 4, nombre: 'Capitán' }, { id_grado: 5, nombre: 'Teniente' }, { id_grado: 6, nombre: 'Alférez' },
    { id_grado: 7, nombre: 'Suboficial Superior' }, { id_grado: 8, nombre: 'Suboficial Brigadier' },
    { id_grado: 9, nombre: 'Suboficial Técnico de Primera' }, { id_grado: 10, nombre: 'Suboficial Técnico de Segunda' },
    { id_grado: 11, nombre: 'Suboficial Técnico de Tercera' }, { id_grado: 12, nombre: 'Suboficial de Primera' },
    { id_grado: 13, nombre: 'Suboficial de Segunda' }, { id_grado: 14, nombre: 'Suboficial de Tercera' }
  ]);

  // Turnos
  await knex('turno').insert([
    { id_turno: 1, nombre: 'Mañana' }, { id_turno: 2, nombre: 'Tarde' },
    { id_turno: 3, nombre: 'Noche' }, { id_turno: 4, nombre: 'Guardia 24 horas' }
  ]);

  // Prioridades
  await knex('tipos_prioridad').insert([
    { id_prioridad: 1, nombre_prioridad: 'Flagrancia' }, { id_prioridad: 2, nombre_prioridad: 'Flagrancia con detenido' },
    { id_prioridad: 3, nombre_prioridad: 'Alta' }, { id_prioridad: 4, nombre_prioridad: 'Media' }
  ]);

  // Tipos de Examen (lista para pruebas)
  await knex('tipo_de_examen').insert([
    { id_tipo_de_examen: 1, nombre: 'Toxicológico' },
    { id_tipo_de_examen: 2, nombre: 'Dosaje Etílico' },
    { id_tipo_de_examen: 3, nombre: 'Sarro Ungueal' },
    { id_tipo_de_examen: 4, nombre: 'Balistico en armas, Municiones - elementos balísticos o análogos' },
    { id_tipo_de_examen: 5, nombre: 'Balístico en ropas' },
    { id_tipo_de_examen: 6, nombre: 'Inspección Balística' },
    { id_tipo_de_examen: 7, nombre: 'Identidad Balística, Marcas de herramientas, EMC estudio microscópico comparativo' },
    { id_tipo_de_examen: 8, nombre: 'Informes Técnicos, Especializados - Recontrucciones judiciales/Fiscales' },
    { id_tipo_de_examen: 9, nombre: 'Materiales, Insumos, Productos, Artefactos explosivos' },
    { id_tipo_de_examen: 10, nombre: 'Inspección Explosivos' },
    { id_tipo_de_examen: 11, nombre: 'TRICOLÓGICO (cabellos - vellos)' },
    { id_tipo_de_examen: 12, nombre: 'HEMATOLÓGICO' },
    { id_tipo_de_examen: 13, nombre: 'ESPERMATOLÓGICO' },
    { id_tipo_de_examen: 14, nombre: 'SARRO UNGUEAL' },
    { id_tipo_de_examen: 15, nombre: 'HOMOLOGACIÓN DE ADN' },
    { id_tipo_de_examen: 16, nombre: 'FISICO - en armas blancas' },
    { id_tipo_de_examen: 17, nombre: 'FISICO - en prendas de vestir' },
    { id_tipo_de_examen: 18, nombre: 'FISICO - en objetos rígidos (contundentes)' },
    { id_tipo_de_examen: 19, nombre: 'FISICO - en elementos constrictores' },
    { id_tipo_de_examen: 20, nombre: 'FISICO - en sustancias terrosas' },
    { id_tipo_de_examen: 21, nombre: 'FISICO - en artefactos incendiarios de fabricación casera' },
    { id_tipo_de_examen: 22, nombre: 'FISICO - en placas vehiculares' },
    { id_tipo_de_examen: 23, nombre: 'FISICO - en de homologación de pinturas en evidencias trazas' },
    { id_tipo_de_examen: 24, nombre: 'Examen de sustancias químicas impregnadas en prendas de vestir' },
    { id_tipo_de_examen: 25, nombre: 'Examen de hidrocarburos derivados de petróleo y/o aceites impregnados en prendas de vestir' },
    { id_tipo_de_examen: 26, nombre: 'Revenido químico de números de serie en soportes metálicos' },
    { id_tipo_de_examen: 27, nombre: 'Examen de homologación fisica en productos industriales' },
    { id_tipo_de_examen: 28, nombre: 'Examen de absorción atómica para restos de disparo por arma de fuego' },
    { id_tipo_de_examen: 29, nombre: 'Examen para detección de hidrocarburos derivados del petróleo' },
    { id_tipo_de_examen: 30, nombre: 'Exámenes instrumentales de espectrometría de infrarrojo FTIR para la detección de sustancias desconocidas' },
    { id_tipo_de_examen: 31, nombre: 'ANÁLISIS INFORMÁTICO FORENSE' },
    { id_tipo_de_examen: 32, nombre: 'OPERATIVIDAD DE EQUIPO TERMINAL MÓVIL, TARJETA SIM' },
    { id_tipo_de_examen: 33, nombre: 'ANÁLISIS DE ARCHIVOS DE VIDEOGRAMAS E IMAGEN' },
    { id_tipo_de_examen: 34, nombre: 'HOMOLOGACIÓN DE IMÁGENES DE VIDEO' },
    { id_tipo_de_examen: 35, nombre: 'OPERATIVIDAD DE DISPOSITIVOS ELECTRÓNICOS' },
    // { id_tipo_de_examen: 33, nombre: 'TOXICOLÓGICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE' },
    // { id_tipo_de_examen: 34, nombre: 'TOXICOLÓGICO EN MUESTRAS REMITIDAS' },
    // { id_tipo_de_examen: 35, nombre: 'DOSAJE ETÍLICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE' },
    // { id_tipo_de_examen: 36, nombre: 'ADHERENCIA DE DROGAS ILICITA EN MUESTRAS TRASLADADAS AL LABORATORIOY VEHICULOS MOTORIZADOS' },
    // { id_tipo_de_examen: 37, nombre: 'ANÁLISIS DE INSUMOS QUÍMICOS FISCALIZADOS EN MUESTRAS TRASLADADAS AL LABORATORIO' },
    { id_tipo_de_examen: 36, nombre: 'Examen de determinación por adicción o supresión en documentos' },
    { id_tipo_de_examen: 37, nombre: 'Examen de superposición o prelación de trazos, para determinar abuso de firmas en blanco' },
    { id_tipo_de_examen: 38, nombre: 'Examen de entrecruzamiento de trazos, de tintas y dobleces' },
    { id_tipo_de_examen: 39, nombre: 'Examen de procedencia de fotocopias' },
    { id_tipo_de_examen: 40, nombre: 'Examen de determinación de fotomontaje o fotocomposiciones' },
    { id_tipo_de_examen: 41, nombre: 'Examen de autenticidad o falsedad de documentos de identidad' },
    { id_tipo_de_examen: 42, nombre: 'Examen de sistemas de impresión' },
    { id_tipo_de_examen: 43, nombre: 'Examen de papel carbón y papel auto-copiativo' },
    { id_tipo_de_examen: 44, nombre: 'Examen en sobres, embalajes y afines, a fin de establecer posible violación de correspondencia' },
    { id_tipo_de_examen: 45, nombre: 'Anacronismo en el receptor, normativo y tecnológico' },
    { id_tipo_de_examen: 46, nombre: 'Examen de autenticidad o falsedad de firmas' },
    { id_tipo_de_examen: 47, nombre: 'Examen de procedencia - auditoría de manuscritos' },
    { id_tipo_de_examen: 48, nombre: 'Examen de análisis de moneda nacional y/o extranjera' },
    { id_tipo_de_examen: 49, nombre: 'Informe Pericial en Lavado de Activos' },
    { id_tipo_de_examen: 50, nombre: 'Tasación de bienes muebles' },
    { id_tipo_de_examen: 51, nombre: 'Tasaciones de predios urbanos' },
    { id_tipo_de_examen: 52, nombre: 'Tasaciones de predios rústicos, predios erizados y otros bienes agropecuarios' },
    { id_tipo_de_examen: 53, nombre: 'Tasación de propiedad empresarial' },
    { id_tipo_de_examen: 54, nombre: 'Tasaciones en bienes inmuebles en los procesos de adquisición o expropiación' },
    { id_tipo_de_examen: 55, nombre: 'Tasaciones de aeronaves, embarcaciones y yacimientos mineros' },
    { id_tipo_de_examen: 56, nombre: 'Examen Psicológico en Personas' },
    { id_tipo_de_examen: 57, nombre: 'Análisis Psicografológico de Manuscritos' },
    { id_tipo_de_examen: 58, nombre: 'Pronunciamiento Psicológico en Material Diverso' },
    { id_tipo_de_examen: 59, nombre: 'Perfiliación Criminal en la Escena del Crimen' },
    { id_tipo_de_examen: 60, nombre: 'Entrevista Psicológica Retrospectiva (necropsia)' },
    { id_tipo_de_examen: 61, nombre: 'Procesamiento de fragmentos de huellas papilares latentes, para identidad dactilar y/o personal' },
    { id_tipo_de_examen: 62, nombre: 'Identidad dactilar y/o personal en documentos cuestionados' },
    { id_tipo_de_examen: 63, nombre: 'Identidad plena en persona' },
    { id_tipo_de_examen: 64, nombre: 'Enrolamiento biométrico en vivo' },
    { id_tipo_de_examen: 65, nombre: 'Identificación de cadáveres NN' },
    { id_tipo_de_examen: 66, nombre: 'Procesamiento de latentes faciales para identidad facial y/o personal' },
    { id_tipo_de_examen: 67, nombre: 'Homologación facial o identificación facial' },
    { id_tipo_de_examen: 68, nombre: 'Confección de IDENTIFAC' },
    { id_tipo_de_examen: 69, nombre: 'SARRO UNGUEAL' }
  ]);

const ID_DEPTO_TOXICOLOGIA = 6;
await knex('tipo_de_examen_departamento').insert([
    { id_tipo_departamento: ID_DEPTO_TOXICOLOGIA, id_tipo_de_examen: 1 }, // Toxicológico
    { id_tipo_departamento: ID_DEPTO_TOXICOLOGIA, id_tipo_de_examen: 2 }, // Dosaje Etílico
    { id_tipo_departamento: ID_DEPTO_TOXICOLOGIA, id_tipo_de_examen: 3 }, // Sarro Ungueal
    { id_tipo_departamento: 2, id_tipo_de_examen: 4 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 5 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 6 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 7 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 8 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 9 },
    { id_tipo_departamento: 2, id_tipo_de_examen: 10 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 11 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 12 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 13 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 14 },
    { id_tipo_departamento: 3, id_tipo_de_examen: 15 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 16 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 17 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 18 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 19 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 20 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 21 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 22 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 23 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 24 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 25 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 26 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 27 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 28 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 29 },
    { id_tipo_departamento: 4, id_tipo_de_examen: 30 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 31 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 32 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 33 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 34 },
    { id_tipo_departamento: 5, id_tipo_de_examen: 35 },
    // { id_tipo_departamento: 6, id_tipo_de_examen: 33 }, // Toxicológico en muestras tomadas directamente
    // { id_tipo_departamento: 6, id_tipo_de_examen: 34 }, // Toxicológico en muestras remitidas
    // { id_tipo_departamento: 6, id_tipo_de_examen: 35 }, // Dosaje Etílico en muestras tomadas directamente
    // { id_tipo_departamento: 6, id_tipo_de_examen: 36 },
    // { id_tipo_departamento: 6, id_tipo_de_examen: 37 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 36 },
    { id_tipo_departamento: 7, id_tipo_de_examen: 37 },
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
    { id_tipo_departamento: 8, id_tipo_de_examen: 49 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 50 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 51 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 52 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 53 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 54 },
    { id_tipo_departamento: 8, id_tipo_de_examen: 55 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 56 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 57 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 58 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 59 },
    { id_tipo_departamento: 9, id_tipo_de_examen: 60 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 61 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 62 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 63 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 64 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 65 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 66 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 67 },
    { id_tipo_departamento: 10, id_tipo_de_examen: 68 },
    // { id_tipo_departamento: 6, id_tipo_de_examen: 69 } // Sarro Ungueal
  ]);

  // --- 3. HASHEAR CONTRASEÑAS ---
  const hashOtherDev = bcrypt.hashSync('123456', 10); // Para usuarios 2021, 2022, etc.
  const hashMainTest = bcrypt.hashSync('123456', 10); // Para usuarios 110, 111, etc.

  // --- 4. INSERTAR USUARIOS ---

  // --- 4.1. Usuarios del otro desarrollador ---
  const [otherAdminId] = await knex('usuario').insert({ CIP: '2021', nombre_completo: 'admin', nombre_usuario: 'admin', password_hash: hashOtherDev }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: otherAdminId, id_rol: 1 });
  await knex('administrador').insert({ id_usuario: otherAdminId });
  await knex('estado_usuario').insert({ id_usuario: otherAdminId, id_estado: 1 });

  const [otherPeritoId] = await knex('usuario').insert({ CIP: '2022', nombre_completo: 'perito', nombre_usuario: 'perito', password_hash: hashOtherDev }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: otherPeritoId, id_rol: 2 });
  await knex('perito').insert({ id_usuario: otherPeritoId, dni: '74985252', email: 'aronccente@gmail.com', unidad: 'oficri', domicilio: 'Av. Siempre Viva 123', telefono: '987654321' });
  await knex('usuario_grado').insert({ id_usuario: otherPeritoId, id_grado: 3 });
  await knex('estado_usuario').insert({ id_usuario: otherPeritoId, id_estado: 1 });
  await knex('usuario_tipo_departamento').insert({ id_usuario: otherPeritoId, id_tipo_departamento: ID_DEPTO_TOXICOLOGIA });
  await knex('usuario_turno').insert({ id_usuario: otherPeritoId, id_turno: 1 });

  const [otherMesaId] = await knex('usuario').insert({ CIP: '2023', nombre_completo: 'mesa de partes', nombre_usuario: 'Ccente', password_hash: hashOtherDev }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: otherMesaId, id_rol: 3 });
  await knex('mesadepartes').insert({ id_usuario: otherMesaId });
  await knex('estado_usuario').insert({ id_usuario: otherMesaId, id_estado: 1 });

  // --- 4.2. Usuarios de prueba principales ---

  // Usuario 112 (Admin)
  const [admin112Id] = await knex('usuario').insert({ CIP: '112', nombre_completo: 'Jos Oso (Admin)', nombre_usuario: 'Jos', password_hash: hashMainTest }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: admin112Id, id_rol: 1 });
  await knex('administrador').insert({ id_usuario: admin112Id });
  await knex('estado_usuario').insert({ id_usuario: admin112Id, id_estado: 1 });

  // Usuario 110 (Mesa de Partes)
  const [mesa110Id] = await knex('usuario').insert({ CIP: '110', nombre_completo: 'Usuario Mesa de Partes', nombre_usuario: 'mesapartes110', password_hash: hashMainTest }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: mesa110Id, id_rol: 3 });
  await knex('mesadepartes').insert({ id_usuario: mesa110Id });
  await knex('estado_usuario').insert({ id_usuario: mesa110Id, id_estado: 1 });

  // --- Peritos de Flujo de Toxicología ---
  
  // Obtener IDs de las secciones de toxicología
  const seccionTomaMuestra = await knex('seccion').where({ nombre: 'Toma de Muestra', id_tipo_departamento: ID_DEPTO_TOXICOLOGIA }).first();
  const seccionLaboratorio = await knex('seccion').where({ nombre: 'Laboratorio', id_tipo_departamento: ID_DEPTO_TOXICOLOGIA }).first();
  const seccionInstrumentalizacion = await knex('seccion').where({ nombre: 'Instrumentalización', id_tipo_departamento: ID_DEPTO_TOXICOLOGIA }).first();

  // Usuario 111 (Perito Toma de Muestra)
  const [perito111Id] = await knex('usuario').insert({ CIP: '111', nombre_completo: 'Perito Toma de Muestra', nombre_usuario: 'perito111', password_hash: hashMainTest }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: perito111Id, id_rol: 2 });
  await knex('perito').insert({ id_usuario: perito111Id, dni: '11111111', email: 'perito111@pnp.gob.pe', unidad: 'OFICRI HYO', domicilio: 'Av. Perito 111', telefono: '987654111' });
  await knex('usuario_grado').insert({ id_usuario: perito111Id, id_grado: 14 }); // S.O. de 3ra
  await knex('usuario_turno').insert({ id_usuario: perito111Id, id_turno: 1 }); // Mañana
  await knex('estado_usuario').insert({ id_usuario: perito111Id, id_estado: 1 });
  await knex('usuario_tipo_departamento').insert({ id_usuario: perito111Id, id_tipo_departamento: ID_DEPTO_TOXICOLOGIA });
  if (seccionTomaMuestra) {
    await knex('usuario_seccion').insert({ id_usuario: perito111Id, id_seccion: seccionTomaMuestra.id_seccion });
  }

  // Usuario 222 (Perito Laboratorio)
  const [perito222Id] = await knex('usuario').insert({ CIP: '222', nombre_completo: 'Perito Laboratorio', nombre_usuario: 'perito222', password_hash: hashMainTest }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: perito222Id, id_rol: 2 });
  await knex('perito').insert({ id_usuario: perito222Id, dni: '22222222', email: 'perito222@pnp.gob.pe', unidad: 'OFICRI HYO', domicilio: 'Av. Perito 222', telefono: '987654222' });
  await knex('usuario_grado').insert({ id_usuario: perito222Id, id_grado: 9 }); // S.T. de 1ra
  await knex('usuario_turno').insert({ id_usuario: perito222Id, id_turno: 1 }); // Mañana
  await knex('estado_usuario').insert({ id_usuario: perito222Id, id_estado: 1 });
  await knex('usuario_tipo_departamento').insert({ id_usuario: perito222Id, id_tipo_departamento: ID_DEPTO_TOXICOLOGIA });
  if (seccionLaboratorio) {
    await knex('usuario_seccion').insert({ id_usuario: perito222Id, id_seccion: seccionLaboratorio.id_seccion });
  }

  // Usuario 333 (Perito Instrumentalización)
  const [perito333Id] = await knex('usuario').insert({ CIP: '333', nombre_completo: 'Perito Instrumentalización', nombre_usuario: 'perito333', password_hash: hashMainTest }).returning('id_usuario');
  await knex('usuario_rol').insert({ id_usuario: perito333Id, id_rol: 2 });
  await knex('perito').insert({ id_usuario: perito333Id, dni: '33333333', email: 'perito333@pnp.gob.pe', unidad: 'OFICRI HYO', domicilio: 'Av. Perito 333', telefono: '987654333' });
  await knex('usuario_grado').insert({ id_usuario: perito333Id, id_grado: 8 }); // S. Brigadier
  await knex('usuario_turno').insert({ id_usuario: perito333Id, id_turno: 2 }); // Tarde
  await knex('estado_usuario').insert({ id_usuario: perito333Id, id_estado: 1 });
  await knex('usuario_tipo_departamento').insert({ id_usuario: perito333Id, id_tipo_departamento: ID_DEPTO_TOXICOLOGIA });
  if (seccionInstrumentalizacion) {
    await knex('usuario_seccion').insert({ id_usuario: perito333Id, id_seccion: seccionInstrumentalizacion.id_seccion });
  }
}
