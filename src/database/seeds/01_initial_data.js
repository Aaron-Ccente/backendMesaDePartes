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

  // Tipos de Examen (lista completa)
  await knex('tipo_de_examen').insert([
    { id_tipo_de_examen: 1, nombre: 'Toxicológico' },
    { id_tipo_de_examen: 2, nombre: 'Dosaje Etílico' },
    { id_tipo_de_examen: 3, nombre: 'Sarro Ungueal' },
    // ... (se pueden añadir más exámenes si es necesario)
  ]);

  // Relaciones Examen <-> Departamento (enfocado en Toxicología)
  const ID_DEPTO_TOXICOLOGIA = 6;
  await knex('tipo_de_examen_departamento').insert([
    { id_tipo_departamento: ID_DEPTO_TOXICOLOGIA, id_tipo_de_examen: 1 }, // Toxicológico
    { id_tipo_departamento: ID_DEPTO_TOXICOLOGIA, id_tipo_de_examen: 2 }, // Dosaje Etílico
    { id_tipo_departamento: ID_DEPTO_TOXICOLOGIA, id_tipo_de_examen: 3 }, // Sarro Ungueal
  ]);

  // --- 3. HASHEAR CONTRASEÑAS ---
  const hashOtherDev = bcrypt.hashSync('123', 10); // Para usuarios 2021, 2022, etc.
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
