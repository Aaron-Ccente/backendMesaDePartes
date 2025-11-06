// backend/src/database/migrations/20251101120003_create_workflow_users.js
import bcrypt from 'bcryptjs';

// Contiene los usuarios de flujo de trabajo requeridos para las pruebas de Fase 2.

// ID 6 = TOXICOLOGÍA FORENSE (según el seed 01_initial_data.js)
const ID_DEPTO_TOXICOLOGIA = 6;

// Hash para la contraseña '123456' (para los usuarios de flujo)
const HASHED_PASSWORD_FLUJO = bcrypt.hashSync('123456', 10);

// Hash para el Admin '112' (proporcionado por el usuario)
const HASHED_PASSWORD_ADMIN = '$2b$10$IGFdkc4eY5ZKuTzjzt1kQOgiUjma6psaYbuRD4DA0kTgHQflOfmd2';


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {

  // --- 1. Crear las Secciones ---
  // (Estas secciones pertenecen al departamento de Toxicología)
  const [seccionTomaMuestraId] = await knex('seccion')
    .insert({
      nombre: 'Toma de Muestra',
      id_tipo_departamento: ID_DEPTO_TOXICOLOGIA
    });

  const [seccionLaboratorioId] = await knex('seccion')
    .insert({
      nombre: 'Laboratorio',
      id_tipo_departamento: ID_DEPTO_TOXICOLOGIA
    });

  const [seccionInstrumentalizacionId] = await knex('seccion')
    .insert({
      nombre: 'Instrumentalización',
      id_tipo_departamento: ID_DEPTO_TOXICOLOGIA
    });

  // --- 2. Crear Usuarios (en orden) ---
  // Usamos knex.raw para ignorar el error si ya existe.
  try {
    const [userAdminId] = await knex('usuario')
      .insert({
        CIP: '112',
        nombre_completo: 'Jos Oso',
        nombre_usuario: 'Jos',
        password_hash: HASHED_PASSWORD_ADMIN
      });
    
    // Solo insertamos relaciones si el usuario fue creado (no falló por duplicado)
    if (userAdminId) {
      await knex('administrador').insert({ id_usuario: userAdminId });
      await knex('usuario_rol').insert({ id_usuario: userAdminId, id_rol: 1 }); // 1 = ADMINISTRADOR
      await knex('estado_usuario').insert({ id_usuario: userAdminId, id_estado: 1 }); // 1 = HABILITADO
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Advertencia: El usuario Administrador (112) ya existe. Omitiendo creación.');
      // Si ya existe, actualizamos su hash por si acaso (opcional pero seguro)
      await knex('usuario').where('CIP', '112').update('password_hash', HASHED_PASSWORD_ADMIN);
    } else {
      throw error; // Lanzar otros errores
    }
  }


  // --- 2.2 Usuario: Mesa de Partes (110) ---
  const [userMesaId] = await knex('usuario')
    .insert({
      CIP: '110',
      nombre_completo: 'Usuario Mesa de Partes',
      nombre_usuario: 'mesapartes110',
      password_hash: HASHED_PASSWORD_FLUJO
    });
  
  await knex('mesadepartes').insert({ id_usuario: userMesaId });
  await knex('usuario_rol').insert({ id_usuario: userMesaId, id_rol: 3 }); // 3 = CENTRAL
  await knex('estado_usuario').insert({ id_usuario: userMesaId, id_estado: 1 }); // 1 = HABILITADO

  // --- 2.3 Perito: Toma de Muestra (111) ---
  const [userTomaMuestraId] = await knex('usuario')
    .insert({
      CIP: '111',
      nombre_completo: 'Perito Toma de Muestra',
      nombre_usuario: 'perito111',
      password_hash: HASHED_PASSWORD_FLUJO
    });

  await knex('perito').insert({
    id_usuario: userTomaMuestraId,
    dni: '11111111',
    email: 'perito111@pnp.gob.pe',
    unidad: 'OFICRI HYO',
    fecha_integracion_pnp: '2020-01-01',
    fecha_incorporacion: '2020-01-01',
    codigo_codofin: 'COD-111',
    domicilio: 'Av. Perito 111',
    telefono: '987654111'
  });
  await knex('usuario_rol').insert({ id_usuario: userTomaMuestraId, id_rol: 2 }); // 2 = PERITO
  await knex('estado_usuario').insert({ id_usuario: userTomaMuestraId, id_estado: 1 }); // 1 = HABILITADO
  await knex('usuario_grado').insert({ id_usuario: userTomaMuestraId, id_grado: 14 }); // 14 = Suboficial de Tercera
  await knex('usuario_turno').insert({ id_usuario: userTomaMuestraId, id_turno: 1 }); // 1 = Mañana
  await knex('usuario_tipo_departamento').insert({ id_usuario: userTomaMuestraId, id_tipo_departamento: ID_DEPTO_TOXICOLOGIA });
  await knex('usuario_seccion').insert({ id_usuario: userTomaMuestraId, id_seccion: seccionTomaMuestraId });

  // --- 2.4 Perito: Laboratorio (222) ---
  const [userLaboratorioId] = await knex('usuario')
    .insert({
      CIP: '222',
      nombre_completo: 'Perito Laboratorio (Consolidador)',
      nombre_usuario: 'perito222',
      password_hash: HASHED_PASSWORD_FLUJO
    });

  await knex('perito').insert({
    id_usuario: userLaboratorioId,
    dni: '22222222',
    email: 'perito222@pnp.gob.pe',
    unidad: 'OFICRI HYO',
    fecha_integracion_pnp: '2019-01-01',
    fecha_incorporacion: '2019-01-01',
    codigo_codofin: 'COD-222',
    domicilio: 'Av. Perito 222',
    telefono: '987654222'
  });
  await knex('usuario_rol').insert({ id_usuario: userLaboratorioId, id_rol: 2 }); // 2 = PERITO
  await knex('estado_usuario').insert({ id_usuario: userLaboratorioId, id_estado: 1 }); // 1 = HABILITADO
  await knex('usuario_grado').insert({ id_usuario: userLaboratorioId, id_grado: 9 }); // 9 = Suboficial Técnico de Primera
  await knex('usuario_turno').insert({ id_usuario: userLaboratorioId, id_turno: 1 }); // 1 = Mañana
  await knex('usuario_tipo_departamento').insert({ id_usuario: userLaboratorioId, id_tipo_departamento: ID_DEPTO_TOXICOLOGIA });
  await knex('usuario_seccion').insert({ id_usuario: userLaboratorioId, id_seccion: seccionLaboratorioId });

  // --- 2.5 Perito: Instrumentalización (333) ---
  const [userInstrumentalId] = await knex('usuario')
    .insert({
      CIP: '333',
      nombre_completo: 'Perito Instrumentalización',
      nombre_usuario: 'perito333',
      password_hash: HASHED_PASSWORD_FLUJO
    });

  await knex('perito').insert({
    id_usuario: userInstrumentalId,
    dni: '33333333',
    email: 'perito333@pnp.gob.pe',
    unidad: 'OFICRI HYO',
    fecha_integracion_pnp: '2018-01-01',
    fecha_incorporacion: '2018-01-01',
    codigo_codofin: 'COD-333',
    domicilio: 'Av. Perito 333',
    telefono: '987654333'
  });
  await knex('usuario_rol').insert({ id_usuario: userInstrumentalId, id_rol: 2 }); // 2 = PERITO
  await knex('estado_usuario').insert({ id_usuario: userInstrumentalId, id_estado: 1 }); // 1 = HABILITADO
  await knex('usuario_grado').insert({ id_usuario: userInstrumentalId, id_grado: 8 }); // 8 = Suboficial Brigadier
  await knex('usuario_turno').insert({ id_usuario: userInstrumentalId, id_turno: 2 }); // 2 = Tarde
  await knex('usuario_tipo_departamento').insert({ id_usuario: userInstrumentalId, id_tipo_departamento: ID_DEPTO_TOXICOLOGIA });
  await knex('usuario_seccion').insert({ id_usuario: userInstrumentalId, id_seccion: seccionInstrumentalizacionId });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Elimina en orden inverso
  await knex('usuario').whereIn('CIP', ['110', '111', '222', '333']).del();
  await knex('seccion').whereIn('nombre', [
    'Toma de Muestra',
    'Laboratorio',
    'Instrumentalización'
  ]).del();
  // Las tablas relacionadas (perito, mesadepartes, usuario_rol, etc.) se borran en CASCADA gracias a la DB.
}

// --- USUARIOS DE PRUEBA ---
// 110 - Usuario Mesa de Partes
// 111 - Perito Toma de Muestra
// 222 - Perito Laboratorio (Consolidador)
// 333 - Perito Instrumentalización
// Contraseña para todos: '123456'