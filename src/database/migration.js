import db from './db.js'

const deleteTables = `
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS 
        tipos_rol, 
        estados_requerimiento,
        tipos_prioridad,
        estados_usuario,
        tipos_departamento,
        especialidad,
        grado,
        seccion,
        departamentos,
        usuarios,
        usuario_especialidad,
        usuario_grado,
        usuario_seccion,
        administradores,
        requerimientos,
        oficios,
        archivos_adjuntos,
        historial_estados,
        auditoria,
        plantillas_notificaciones,
        log_notificaciones,
        configuracion_sistema,
        parametros_operacionales;
    SET FOREIGN_KEY_CHECKS = 1;
`;


// -- BLOQUE 1: Tablas de referencia
// -- Tabla para tipos de roles de usuario
const roles = `CREATE TABLE tipos_rol (
                id_tipo_rol TINYINT PRIMARY KEY AUTO_INCREMENT,
                nombre_rol VARCHAR(20) NOT NULL UNIQUE,
                descripcion TEXT
            );`

// -- Tabla para estados de requerimientos
const estados_requerimientos = `CREATE TABLE estados_requerimiento (
                id_estado TINYINT PRIMARY KEY AUTO_INCREMENT,
                nombre_estado VARCHAR(20) NOT NULL UNIQUE,
                descripcion TEXT
            );`

// -- Tabla para tipos de prioridad
const tipos_prioridad = `CREATE TABLE tipos_prioridad (
                id_prioridad TINYINT PRIMARY KEY AUTO_INCREMENT,
                nombre_prioridad VARCHAR(20) NOT NULL UNIQUE,
                nivel_prioridad TINYINT NOT NULL,
                descripcion TEXT
            );`

// -- Tabla para estados de usuario
const estados_usuario = `CREATE TABLE estados_usuario (
                id_estado_usuario TINYINT PRIMARY KEY AUTO_INCREMENT,
                nombre_estado VARCHAR(20) NOT NULL UNIQUE,
                descripcion TEXT
            );`

// -- Tabla para tipos de departamento
const tipos_departamento = `CREATE TABLE tipos_departamento (
                id_tipo_departamento TINYINT PRIMARY KEY AUTO_INCREMENT,
                nombre_departamento VARCHAR(50) NOT NULL UNIQUE,
                descripcion TEXT
            );`

// -- Tabla para especialidad
const especialidad = `CREATE TABLE especialidad (
                id_especialidad INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(60) UNIQUE NOT NULL
            );`

// -- Tabla para grado
const grado = `CREATE TABLE grado (
                id_grado INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(60) UNIQUE NOT NULL
            );`

// -- Tabla para seccion
const seccion = `CREATE TABLE seccion (
                id_seccion INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(60) UNIQUE NOT NULL
            );`

// -- BLOQUE 2: Gestión de usuarios
// -- Tabla de departamentos
const departamentos = `CREATE TABLE departamentos (
                id_departamento INT PRIMARY KEY AUTO_INCREMENT,
                nombre_departamento VARCHAR(50) NOT NULL UNIQUE,
                descripcion TEXT,
                jefe_departamento VARCHAR(20), -- CIP del jefe
                activo TINYINT(1) DEFAULT 1,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (nombre_departamento) REFERENCES tipos_departamento(nombre_departamento)
            );`

// -- Tabla principal de usuarios con información completa del personal PNP
const usuarios = `CREATE TABLE usuarios (
                id_usuario VARCHAR(20) PRIMARY KEY, -- CIP (Código PNP)
                dni VARCHAR(8) NOT NULL UNIQUE,
                nombres VARCHAR(100) NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(20) NOT NULL,
                estado VARCHAR(20) DEFAULT 'ACTIVO',
                
                -- Información específica PNP
                unidad VARCHAR(100),
                fecha_integracion_pnp DATE,
                fecha_incorporacion DATE,
                codigo_codofin VARCHAR(20),
                domicilio TEXT,
                telefono VARCHAR(15),
                
                -- Formación académica
                cursos_institucionales TEXT, -- JSON en lugar de array
                cursos_extranjero TEXT, -- JSON en lugar de array
                ultimo_censo_pnp DATE,
                
                -- Archivos digitales
                fotografia_url TEXT,
                firma_digital_url TEXT,
                
                -- Departamento asignado
                id_departamento INT,
                
                -- Timestamps
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                ultimo_acceso TIMESTAMP NULL,
                
                -- Constraints
                CONSTRAINT chk_dni_format CHECK (dni REGEXP '^[0-9]{8}$'),
                CONSTRAINT chk_cip_format CHECK (id_usuario REGEXP '^[A-Z0-9]+$'),
                FOREIGN KEY (rol) REFERENCES tipos_rol(nombre_rol),
                FOREIGN KEY (estado) REFERENCES estados_usuario(nombre_estado),
                FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento)
            );`

// -- Tablas de relación para especialidad, grado y sección
const usuario_especialidad = `CREATE TABLE usuario_especialidad (
                id_usuario_especialidad INT PRIMARY KEY AUTO_INCREMENT,
                id_usuario VARCHAR(20) NOT NULL,
                id_especialidad INT NOT NULL,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad)
            );`

const usuario_grado = `CREATE TABLE usuario_grado (
                id_usuario_grado INT PRIMARY KEY AUTO_INCREMENT,
                id_usuario VARCHAR(20) NOT NULL,
                id_grado INT NOT NULL,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (id_grado) REFERENCES grado(id_grado)
            );`

const usuario_seccion = `CREATE TABLE usuario_seccion (
                id_usuario_seccion INT PRIMARY KEY AUTO_INCREMENT,
                id_usuario VARCHAR(20) NOT NULL,
                id_seccion INT NOT NULL,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (id_seccion) REFERENCES seccion(id_seccion)
            );`

// -- Tabla para administradores
const administradores = `CREATE TABLE administradores (
                CIP VARCHAR(20) PRIMARY KEY, -- CIP
                nombres VARCHAR(100) NOT NULL,
                nombre_usuario VARCHAR(60) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                estado VARCHAR(20) DEFAULT 'ACTIVO',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                ultimo_acceso TIMESTAMP NULL,
                FOREIGN KEY (estado) REFERENCES estados_usuario(nombre_estado)
            );`

// -- BLOQUE 3: Gestión de requerimientos y oficios
// -- Tabla principal de requerimientos

const requerimientos = `CREATE TABLE requerimientos (
                id_requerimiento CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                numero_expediente VARCHAR(50) UNIQUE NOT NULL, -- Número único de expediente
                
                -- Información del caso
                descripcion_caso TEXT NOT NULL,
                tipo_delito VARCHAR(200),
                lugar_hecho TEXT,
                fecha_hecho TIMESTAMP NULL,
                
                -- Información de la muestra (visible para peritos)
                descripcion_muestra TEXT,
                tipo_muestra VARCHAR(100),
                cantidad_muestra VARCHAR(50),
                estado_muestra VARCHAR(100),
                observaciones_muestra TEXT,
                
                -- Información confidencial (NO visible para peritos)
                datos_persona_encrypted TEXT, -- Datos encriptados de personas involucradas
                informacion_confidencial_encrypted TEXT, -- Otra información sensible encriptada
                
                -- Control de flujo
                estado VARCHAR(20) DEFAULT 'REGISTRADO',
                prioridad VARCHAR(20) NOT NULL,
                departamento_origen VARCHAR(50) DEFAULT 'MESA_PARTES',
                departamento_asignado INT,
                perito_asignado VARCHAR(20),
                
                -- Fechas importantes
                fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_limite TIMESTAMP NULL,
                fecha_asignacion TIMESTAMP NULL,
                fecha_completion TIMESTAMP NULL,
                
                -- Control de versiones y trazabilidad
                creado_por VARCHAR(20) NOT NULL,
                actualizado_por VARCHAR(20),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Metadatos adicionales
                tags TEXT, -- JSON en lugar de array
                notas_internas TEXT,
                
                -- Constraints
                CONSTRAINT chk_fechas_logicas CHECK (
                    fecha_limite > fecha_ingreso AND 
                    (fecha_completion IS NULL OR fecha_completion >= fecha_ingreso)
                ),
                FOREIGN KEY (estado) REFERENCES estados_requerimiento(nombre_estado),
                FOREIGN KEY (prioridad) REFERENCES tipos_prioridad(nombre_prioridad),
                FOREIGN KEY (departamento_origen) REFERENCES tipos_departamento(nombre_departamento),
                FOREIGN KEY (departamento_asignado) REFERENCES departamentos(id_departamento),
                FOREIGN KEY (perito_asignado) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (actualizado_por) REFERENCES usuarios(id_usuario)
            );`

// -- Tabla de oficios
const oficios = `CREATE TABLE oficios (
                numero_registro INT PRIMARY KEY AUTO_INCREMENT,
                id_requerimiento CHAR(36) NOT NULL,
                prioridad ENUM('Con detenido - Flagrancia', 'Flagrancia', 'Normal') NOT NULL,
                estado ENUM('Proceso', 'Tomo de muestra', 'Diligencia') NOT NULL,
                departamento_header VARCHAR(100) NOT NULL,
                sede_header VARCHAR(100) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_requerimiento) REFERENCES requerimientos(id_requerimiento)
            );`

// -- BLOQUE 4: Gestión de archivos
// -- Tabla de archivos adjuntos
const archivos_adjuntos = `CREATE TABLE archivos_adjuntos (
                id_archivo CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                id_requerimiento CHAR(36) NOT NULL,
                
                -- Información del archivo
                nombre_archivo VARCHAR(255) NOT NULL,
                nombre_original VARCHAR(255) NOT NULL,
                tipo_mime VARCHAR(100) NOT NULL,
                tamanio_bytes BIGINT NOT NULL,
                ruta_archivo TEXT NOT NULL,
                
                -- Categorización
                categoria VARCHAR(50) NOT NULL, -- 'OFICIO', 'CADENA_CUSTODIA', 'INFORME', 'EVIDENCIA', 'RESULTADO'
                descripcion TEXT,
                
                -- Control de acceso
                visible_para_perito TINYINT(1) DEFAULT 0,
                requiere_autorizacion TINYINT(1) DEFAULT 0,
                
                -- Metadatos de seguridad
                hash_archivo VARCHAR(64) NOT NULL, -- SHA-256 para integridad
                subido_por VARCHAR(20) NOT NULL,
                fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT chk_tamanio_positivo CHECK (tamanio_bytes > 0),
                FOREIGN KEY (id_requerimiento) REFERENCES requerimientos(id_requerimiento) ON DELETE CASCADE,
                FOREIGN KEY (subido_por) REFERENCES usuarios(id_usuario)
            );`

// -- BLOQUE 5: Auditoría y trazabilidad
// -- Tabla de historial de estados
const historial_estados = `CREATE TABLE historial_estados (
                id_historial CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                id_requerimiento CHAR(36) NOT NULL,
                
                -- Cambio de estado
                estado_anterior VARCHAR(20),
                estado_nuevo VARCHAR(20) NOT NULL,
                
                -- Información del cambio
                motivo_cambio TEXT,
                observaciones TEXT,
                
                -- Trazabilidad
                cambiado_por VARCHAR(20) NOT NULL,
                fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                direccion_ip VARCHAR(45),
                user_agent TEXT,
                
                FOREIGN KEY (id_requerimiento) REFERENCES requerimientos(id_requerimiento) ON DELETE CASCADE,
                FOREIGN KEY (estado_anterior) REFERENCES estados_requerimiento(nombre_estado),
                FOREIGN KEY (estado_nuevo) REFERENCES estados_requerimiento(nombre_estado),
                FOREIGN KEY (cambiado_por) REFERENCES usuarios(id_usuario)
            );`

// -- Tabla de auditoría general
const auditoria = `CREATE TABLE auditoria (
                id_auditoria CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                
                -- Información de la acción
                tabla_afectada VARCHAR(50) NOT NULL,
                accion VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'SELECT_SENSITIVE'
                registro_id VARCHAR(100), -- ID del registro afectado
                
                -- Datos del cambio
                datos_anteriores JSON,
                datos_nuevos JSON,
                
                -- Información del usuario y contexto
                usuario_id VARCHAR(20),
                descripcion_accion TEXT NOT NULL,
                modulo_origen VARCHAR(50), -- Módulo del sistema que generó la acción
                
                -- Metadatos técnicos
                direccion_ip VARCHAR(45),
                user_agent TEXT,
                session_id VARCHAR(255),
                
                -- Timestamp
                fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Clasificación de seguridad
                nivel_criticidad VARCHAR(20) DEFAULT 'MEDIO',
                
                -- Constraints
                CONSTRAINT chk_nivel_criticidad CHECK (nivel_criticidad IN ('BAJO', 'MEDIO', 'ALTO', 'CRÍTICO')),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
            );`

// -- BLOQUE 6: Sistema de notificaciones
// -- Tabla de plantillas de notificaciones
const plantillas_notificaciones = `CREATE TABLE plantillas_notificaciones (
                id_plantilla INT PRIMARY KEY AUTO_INCREMENT,
                nombre_plantilla VARCHAR(100) NOT NULL UNIQUE,
                asunto VARCHAR(200) NOT NULL,
                contenido_plantilla TEXT NOT NULL,
                variables_disponibles TEXT, -- JSON en lugar de array
                activa TINYINT(1) DEFAULT 1,
                creada_por VARCHAR(20) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (creada_por) REFERENCES usuarios(id_usuario)
            );`

// -- Tabla de log de notificaciones
const log_notificaciones = `CREATE TABLE log_notificaciones (
                id_notificacion CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                
                -- Destinatario y remitente
                usuario_destinatario VARCHAR(20) NOT NULL,
                usuario_remitente VARCHAR(20),
                
                -- Contenido de la notificación
                tipo_notificacion VARCHAR(50) NOT NULL, -- 'ASIGNACION', 'VENCIMIENTO', 'SISTEMA', 'URGENTE'
                asunto VARCHAR(200) NOT NULL,
                mensaje TEXT NOT NULL,
                
                -- Contexto
                id_requerimiento CHAR(36),
                id_plantilla INT,
                
                -- Estado de la notificación
                leida TINYINT(1) DEFAULT 0,
                fecha_lectura TIMESTAMP NULL,
                archivada TINYINT(1) DEFAULT 0,
                
                -- Configuración de entrega
                prioridad VARCHAR(20) DEFAULT 'NORMAL',
                requiere_confirmacion TINYINT(1) DEFAULT 0,
                confirmada TINYINT(1) DEFAULT 0,
                fecha_confirmacion TIMESTAMP NULL,
                
                -- Timestamps
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_programada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_entrega TIMESTAMP NULL,
                
                -- Metadatos
                datos_adicionales JSON,
                
                -- Constraints
                CONSTRAINT chk_fechas_notificacion CHECK (
                    fecha_programada >= fecha_creacion AND 
                    (fecha_lectura IS NULL OR fecha_lectura >= fecha_entrega)
                ),
                CONSTRAINT chk_prioridad_notificacion CHECK (prioridad IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE')),
                FOREIGN KEY (usuario_destinatario) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (usuario_remitente) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (id_requerimiento) REFERENCES requerimientos(id_requerimiento),
                FOREIGN KEY (id_plantilla) REFERENCES plantillas_notificaciones(id_plantilla)
            );`

// -- BLOQUE 7: Configuración del sistema
// -- Tabla de configuración del sistema
const configuracion_sistema = `CREATE TABLE configuracion_sistema (
                id_config INT PRIMARY KEY AUTO_INCREMENT,
                categoria VARCHAR(50) NOT NULL,
                clave VARCHAR(100) NOT NULL,
                valor TEXT NOT NULL,
                descripcion TEXT,
                tipo_dato VARCHAR(20) DEFAULT 'TEXT',
                editable TINYINT(1) DEFAULT 1,
                requiere_reinicio TINYINT(1) DEFAULT 0,
                actualizado_por VARCHAR(20),
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                UNIQUE(categoria, clave),
                CONSTRAINT chk_tipo_dato CHECK (tipo_dato IN ('TEXT', 'NUMBER', 'BOOLEAN', 'JSON')),
                FOREIGN KEY (actualizado_por) REFERENCES usuarios(id_usuario)
            );`

// -- Tabla de parámetros operacionales
const parametros_operacionales = `CREATE TABLE parametros_operacionales (
                id_parametro INT PRIMARY KEY AUTO_INCREMENT,
                nombre_parametro VARCHAR(100) NOT NULL UNIQUE,
                valor_parametro TEXT NOT NULL,
                descripcion TEXT,
                unidad_medida VARCHAR(20), -- días, horas, MB, etc.
                valor_minimo NUMERIC,
                valor_maximo NUMERIC,
                activo TINYINT(1) DEFAULT 1,
                modificable_por TEXT, -- JSON en lugar de array
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`

const createTables = `
                      ${deleteTables}
                      ${roles}
                      ${estados_requerimientos}
                      ${tipos_prioridad}
                      ${estados_usuario}
                      ${tipos_departamento}
                      ${especialidad}
                      ${grado}
                      ${seccion}
                      ${departamentos}
                      ${usuarios}
                      ${usuario_especialidad}
                      ${usuario_grado}
                      ${usuario_seccion}
                      ${administradores}
                      ${requerimientos}
                      ${oficios}
                      ${archivos_adjuntos}
                      ${historial_estados}
                      ${auditoria}
                      ${plantillas_notificaciones}
                      ${log_notificaciones}
                      ${configuracion_sistema}
                      ${parametros_operacionales}
`

db.query(createTables, (err, result)=>{
    if(err){
        console.log('Error al crear tablas', err)
    }
    else{
        console.log('Tablas creadas correctamente', result)
    }
})
