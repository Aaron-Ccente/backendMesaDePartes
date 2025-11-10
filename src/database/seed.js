import db from './db.js'

const deleteAll = `DELETE FROM rol;
                   DELETE FROM estado;
                   DELETE FROM tipo_departamento;
                   DELETE FROM grado;
                   DELETE FROM tipo_de_examen;
                   DELETE FROM tipo_de_examen_departamento;
                   DELETE FROM turno;
                   DELETE FROM usuario;
                   DELETE FROM usuario_rol;
                    `;
const roles = `INSERT INTO rol (id_rol, nombre_rol, descripcion) VALUES 
               (1,'ADMINISTRADOR','Administra a todos los peritos - control total.'), 
               (2,'PERITO', 'Profesional capacitado.'), 
               (3,'CENTRAL','Encargado de dirigir los primeros documentos.');`

const estados = `INSERT INTO estado (id_estado, nombre_estado, descripcion) VALUES
                (1, 'HABILITADO','Usuario que puede realizar acciones en la plataforma.'),
                (2, 'DESHABILITADO','Usuario que no puede realizar acciones en la plataforma.');
                `
const tipos_departamento = `INSERT INTO tipo_departamento (id_tipo_departamento, nombre_departamento, descripcion) VALUES
                (1,'ESCENA DEL CRIMEN','Escena del crimen - descripción'),
                (2,'BALÍSTICA FORENSE','Balistica Forense - descripción'),
                (3,'BIOLOGÍA FORENSE','Biología Forense - descripción'),
                (4,'INGENIERÍA FORENSE','Ingeniería Forense - descripción'),
                (5,'INFORMÁTICA FORENSE','Informática Forense - descripción'),
                (6,'TOXICOLOGÍA FORENSE','TOXICOLOGÍA FORENSE - descripción'),
                (7,'GRAFOTECNIA FORENSE','GRAFOTÉCNIA - descripción'),
                (8,'CONTABILIDAD Y TASACIÓN FORENSE','Contabilidad y Tasación Forense - descripción'),
                (9,'PSICOLOGÍA FORENSE','Psicología Forense - descripción'),
                (10,'IDENTIFICACIÓN CRIMINALÍSTICA','Identificación Criminalísitica - descripción');`

const grados = `INSERT INTO grado (id_grado, nombre) VALUES
                (1,'Coronel'),
                (2,'Comandante'),
                (3,'Mayor'),
                (4,'Capitán'),
                (5,'Teniente'),
                (6,'Alférez'),
                (7,'Suboficial Superior'),
                (8,'Suboficial Brigadier'),
                (9,'Suboficial Técnico de Primera'),
                (10,'Suboficial Técnico de Segunda'),
                (11,'Suboficial Técnico de Tercera'),
                (12,'Suboficial de Primera'),
                (13,'Suboficial de Segunda'),
                (14,'Suboficial de Tercera');`

const tipo_de_examen = `INSERT INTO tipo_de_examen (id_tipo_de_examen, nombre, descripcion) VALUES 
                (1, 'Balistico en armas, Municiones - elementos balísticos o análogos', 'Balistico en armas - descripción'),
                (2, 'Balístico en ropas', 'Balistico en armas - descripción'),
                (3, 'Inspección Balística', 'Balistico en armas - descripción'),
                (4, 'Identidad Balística, Marcas de herramientas, EMC estudio microscópico comparativo', 'Balistico en armas - descripción'),
                (5, 'Informes Técnicos, Especializados - Recontrucciones judiciales/Fiscales', 'Balistico en armas - descripción'),
                (6, 'Materiales, Insumos, Productos, Artefactos explosivos', 'Balistico en armas - descripción'),
                (7, 'Inspección Explosivos', 'Balistico en armas - descripción'),
                (8, 'TRICOLÓGICO (cabellos - vellos)', 'Balistico en armas - descripción'),
                (9, 'HEMATOLÓGICO', 'Balistico en armas - descripción'),
                (10, 'ESPERMATOLÓGICO', 'Balistico en armas - descripción'),
                (11, 'SARRO UNGUEAL', 'Balistico en armas - descripción'),
                (12, 'HOMOLOGACIÓN DE ADN', 'Balistico en armas - descripción'),
                (13, 'FISICO - en armas blancas', 'Balistico en armas - descripción'),
                (14, 'FISICO - en prendas de vestir', 'Balistico en armas - descripción'),
                (15, 'FISICO - en objetos rígidos (contundentes)', 'Balistico en armas - descripción'),
                (16, 'FISICO - en elementos constrictores', 'Balistico en armas - descripción'),
                (17, 'FISICO - en sustancias terrosas', 'Balistico en armas - descripción'),
                (18, 'FISICO - en artefactos incendiarios de fabricación casera', 'Balistico en armas - descripción'),
                (19, 'FISICO - en placas vehiculares', 'Balistico en armas - descripción'),
                (20, 'FISICO - en de homologación de pinturas en evidencias trazas', 'Balistico en armas - descripción'),
                (21, 'Examen de sustancias químicas impregnadas en prendas de vestir', 'Balistico en armas - descripción'),
                (22, 'Examen de hidrocarburos derivados de petróleo y/o aceites impregnados en prendas de vestir', 'Balistico en armas - descripción'),
                (23, 'Revenido químico de números de serie en soportes metálicos', 'Balistico en armas - descripción'),
                (24, 'Examen de homologación fisica en productos industriales', 'Balistico en armas - descripción'),
                (25, 'Examen de absorción atómica para restos de disparo por arma de fuego', 'Balistico en armas - descripción'),
                (26, 'Examen para detección de hidrocarburos derivados del petróleo', 'Balistico en armas - descripción'),
                (27, 'Exámenes instrumentales de espectrometría de infrarrojo FTIR para la detección de sustancias desconocidas', 'Balistico en armas - descripción'),
                (28, 'ANÁLISIS INFORMÁTICO FORENSE', 'Balistico en armas - descripción'),
                (29, 'OPERATIVIDAD DE EQUIPO TERMINAL MÓVIL, TARJETA SIM', 'Balistico en armas - descripción'),
                (30, 'ANÁLISIS DE ARCHIVOS DE VIDEOGRAMAS E IMAGEN', 'Balistico en armas - descripción'),
                (31, 'HOMOLOGACIÓN DE IMÁGENES DE VIDEO', 'Balistico en armas - descripción'),
                (32, 'OPERATIVIDAD DE DISPOSITIVOS ELECTRÓNICOS', 'Balistico en armas - descripción'),
                (33, 'TOXICOLÓGICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE', 'Balistico en armas - descripción'),
                (34, 'TOXICOLÓGICO EN MUESTRAS REMITIDAS', 'Balistico en armas - descripción'),
                (35, 'DOSAJE ETÍLICO EN MUESTRAS BIOLÓGICAS TOMADAS DIRECTAMENTE', 'Balistico en armas - descripción'),
                (36, 'ADHERENCIA DE DROGAS ILICITA EN MUESTRAS TRASLADADAS AL LABORATORIOY VEHICULOS MOTORIZADOS', 'Balistico en armas - descripción'),
                (37, 'ANÁLISIS DE INSUMOS QUÍMICOS FISCALIZADOS EN MUESTRAS TRASLADADAS AL LABORATORIO', 'Balistico en armas - descripción'),
                (38, 'Examen de determinación por adicción o supresión en documentos', 'Balistico en armas - descripción'),
                (39, 'Examen de superposición o prelación de trazos, para determinar abuso de firmas en blanco', 'Balistico en armas - descripción'),
                (40, 'Examen de entrecruzamiento de trazos, de tintas y dobleces', 'Balistico en armas - descripción'),
                (41, 'Examen de procedencia de fotocopias', 'Balistico en armas - descripción'),
                (42, 'Examen de determinación de fotomontaje o fotocomposiciones', 'Balistico en armas - descripción'),
                (43, 'Examen de autenticidad o falsedad de documentos de identidad', 'Balistico en armas - descripción'),
                (44, 'Examen de sistemas de impresión', 'Balistico en armas - descripción'),
                (45, 'Examen de papel carbón y papel auto-copiativo', 'Balistico en armas - descripción'),
                (46, 'Examen en sobres, embalajes y afines, a fin de establecer posible violación de correspondencia', 'Balistico en armas - descripción'),
                (47, 'Anacronismo en el receptor, normativo y tecnológico', 'Balistico en armas - descripción'),
                (48, 'Examen de autenticidad o falsedad de firmas', 'Balistico en armas - descripción'),
                (49, 'Examen de procedencia - auditoría de manuscritos', 'Balistico en armas - descripción'),
                (50, 'Examen de análisis de moneda nacional y/o extranjera', 'Balistico en armas - descripción'),
                (51, 'Informe Pericial en Lavado de Activos', 'Balistico en armas - descripción'),
                (52, 'Tasación de bienes muebles', 'Balistico en armas - descripción'),
                (53, 'Tasaciones de predios urbanos', 'Balistico en armas - descripción'),
                (54, 'Tasaciones de predios rústicos, predios erizados y otros bienes agropecuarios', 'Balistico en armas - descripción'),
                (55, 'Tasación de propiedad empresarial', 'Balistico en armas - descripción'),
                (56, 'Tasaciones en bienes inmuebles en los procesos de adquisición o expropiación', 'Balistico en armas - descripción'),
                (57, 'Tasaciones de aeronaves, embarcaciones y yacimientos mineros', 'Balistico en armas - descripción'),
                (58, 'Examen Psicológico en Personas', 'Balistico en armas - descripción'),
                (59, 'Análisis Psicografológico de Manuscritos', 'Balistico en armas - descripción'),
                (60, 'Pronunciamiento Psicológico en Material Diverso', 'Balistico en armas - descripción'),
                (61, 'Perfiliación Criminal en la Escena del Crimen', 'Balistico en armas - descripción'),
                (62, 'Entrevista Psicológica Retrospectiva (necropsia)', 'Balistico en armas - descripción'),
                (63, 'Procesamiento de fragmentos de huellas papilares latentes, para identidad dactilar y/o personal', 'Balistico en armas - descripción'),
                (64, 'Identidad dactilar y/o personal en documentos cuestionados', 'Balistico en armas - descripción'),
                (65, 'Identidad plena en persona', 'Balistico en armas - descripción'),
                (66, 'Enrolamiento biométrico en vivo', 'Balistico en armas - descripción'),
                (67, 'Identificación de cadáveres NN', 'Balistico en armas - descripción'),
                (68, 'Procesamiento de latentes faciales para identidad facial y/o personal', 'Balistico en armas - descripción'),
                (69, 'Homologación facial o identificación facial', 'Balistico en armas - descripción'),
                (70, 'Confección de IDENTIFAC', 'Balistico en armas - descripción');`

const turnos = `INSERT INTO turno (id_turno, nombre) VALUES
                (1,'Mañana'),
                (2,'Tarde'),
                (3,'Noche'),
                (4,'Guardia 24 horas');`

const tipos_prioridad_oficio = `INSERT INTO tipos_prioridad (id_prioridad, nombre_prioridad) VALUES (1, 'Flagrancia'), (2, 'Flagrancia con detenido'), (3, 'Alta'), (4, 'Media');`

const user_default_admin = `INSERT INTO usuario (id_usuario, CIP, nombre_completo, nombre_usuario, password_hash) VALUES (1, '2021', 'Admin', 'Ccente', '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK');
                            INSERT INTO usuario_rol (id_usuario_rol, id_usuario, id_rol) VALUES (1,1,1);`

const user_default_perito = `
                            INSERT INTO usuario (id_usuario, CIP, nombre_completo, nombre_usuario, password_hash) VALUES 
                            (2, '2022', 'Perito', 'Ccente', '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK');
                            INSERT INTO usuario_rol (id_usuario, id_rol) VALUES 
                            (2, 2);
                            INSERT INTO perito (id_perito, id_usuario, dni, email, unidad, fecha_integracion_pnp, fecha_incorporacion, codigo_codofin, domicilio, telefono, cursos_institucionales, cursos_extranjero, ultimo_ascenso_pnp, fotografia_url) VALUES 
                            (1, 2, '74985252', 'aronccente@gmail.com', 'oficri', '2025-10-01', '2025-10-01', 'COD1234', 'domicilio', '959085123', 'aaaaa', 'bbbbb', '2025-10-01', 'url');
                            INSERT INTO usuario_grado (id_usuario, id_grado) VALUES 
                            (2, 3);
                            INSERT INTO estado_usuario (id_usuario, id_estado) VALUES 
                            (2, 1);
                            INSERT INTO usuario_tipo_departamento (id_usuario, id_tipo_departamento) VALUES 
                            (2, 6);
                            INSERT INTO usuario_turno (id_usuario, id_turno) VALUES 
                            (2, 1);

                            -- perito 2
                            INSERT INTO usuario (id_usuario, CIP, nombre_completo, nombre_usuario, password_hash) VALUES 
                            (10, '202510', 'Perito Juan Perez', 'jperez', '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK');
                            INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (10, 2);
                            INSERT INTO perito (id_perito, id_usuario, dni, email, unidad, fecha_integracion_pnp, fecha_incorporacion, codigo_codofin, domicilio, telefono, cursos_institucionales, cursos_extranjero, ultimo_ascenso_pnp, fotografia_url)
                            VALUES (2, 10, '74985253', 'jperez@gmail.com', 'oficri', '2025-09-15', '2025-09-20', 'COD1235', 'domicilio 2', '959085124', 'curso A', 'curso B', '2025-09-25', 'url2');
                            INSERT INTO usuario_grado (id_usuario, id_grado) VALUES (10, 3);
                            INSERT INTO estado_usuario (id_usuario, id_estado) VALUES (10, 1);
                            INSERT INTO usuario_tipo_departamento (id_usuario, id_tipo_departamento) VALUES (10, 6);
                            INSERT INTO usuario_turno (id_usuario, id_turno) VALUES (10, 1);

                            -- perito 3
                            INSERT INTO usuario (id_usuario, CIP, nombre_completo, nombre_usuario, password_hash) VALUES 
                            (11, '202511', 'Perito Maria Gomez', 'mgomez', '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK');
                            INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (11, 2);
                            INSERT INTO perito (id_perito, id_usuario, dni, email, unidad, fecha_integracion_pnp, fecha_incorporacion, codigo_codofin, domicilio, telefono, cursos_institucionales, cursos_extranjero, ultimo_ascenso_pnp, fotografia_url)
                            VALUES (3, 11, '74985254', 'mgomez@gmail.com', 'oficri', '2025-09-16', '2025-09-21', 'COD1236', 'domicilio 3', '959085125', 'curso C', 'curso D', '2025-09-26', 'url3');
                            INSERT INTO usuario_grado (id_usuario, id_grado) VALUES (11, 3);
                            INSERT INTO estado_usuario (id_usuario, id_estado) VALUES (11, 1);
                            INSERT INTO usuario_tipo_departamento (id_usuario, id_tipo_departamento) VALUES (11, 6);
                            INSERT INTO usuario_turno (id_usuario, id_turno) VALUES (11, 1);
                            `;
const user_default_mesadepartesa = `INSERT INTO usuario (id_usuario, CIP, nombre_completo, nombre_usuario, password_hash) VALUES (3, '2023', 'mesa de partes', 'Ccente', '$2b$10$JHXf44agcX8shOGDCGdtOujKn.1lpptSrUpqP1yAv6bJbdqw2XgWK');
                            INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (3,3);
                            `

const tipo_examen_departamento = `INSERT INTO tipo_de_examen_departamento (id_tipo_departamento, id_tipo_de_examen) VALUES
                            (2, 1),
                            (2, 2),
                            (2, 3),
                            (2, 4),
                            (2, 5),
                            (2, 6),
                            (2, 7),
                            (3, 8),
                            (3, 9),
                            (3, 10),
                            (3, 11),
                            (3, 12),
                            (4, 13),
                            (4, 14),
                            (4, 15),
                            (4, 16),
                            (4, 17),
                            (4, 18),
                            (4, 19),
                            (4, 20),
                            (4, 21),
                            (4, 23),
                            (4, 24),
                            (4, 25),
                            (4, 26),
                            (4, 27),
                            (5, 28),
                            (5, 29),
                            (5, 30),
                            (5, 31),
                            (5, 32),
                            (6, 33),
                            (6, 34),
                            (6, 35),
                            (6, 36),
                            (6, 37),
                            (7, 38),
                            (7, 39),
                            (7, 40),
                            (7, 41),
                            (7, 42),
                            (7, 43),
                            (7, 44),
                            (7, 45),
                            (7, 46),
                            (7, 47),
                            (7, 48),
                            (7, 49),
                            (7, 50),
                            (8, 51),
                            (8, 52),
                            (8, 53),
                            (8, 54),
                            (8, 55),
                            (8, 56),
                            (8, 57),
                            (9, 58),
                            (9, 59),
                            (9, 60),
                            (9, 61),
                            (9, 62),
                            (10, 63),
                            (10, 64),
                            (10, 65),
                            (10, 66),
                            (10, 67),
                            (10, 68),
                            (10, 69),
                            (10, 70);`

const dbseed = `  
                ${deleteAll}
                ${roles}              
                ${estados}                
                ${tipos_departamento}                
                ${tipos_prioridad_oficio}                                            
                ${grados}                
                ${tipo_de_examen}                
                ${turnos}                               
                ${user_default_admin}                
                ${user_default_perito}                
                ${tipo_examen_departamento}                
                ${user_default_mesadepartesa}                
`;

db.query(dbseed, (err, result)=>{
    if(err){
        console.log('Error al insertar los datos: ', err)
    }
    else{
        console.log("Datos insertados correctamente.", result)
    }
})