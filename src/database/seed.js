import db from './db.js'

const deleteAll = `DELETE FROM rol;
                   DELETE FROM estado;
                   DELETE FROM tipo_departamento;
                   DELETE FROM especialidad;
                   DELETE FROM grado;
                   DELETE FROM turno;
                   DELETE FROM seccion;
                   DELETE FROM tipo_departamento_seccion;
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

const secciones = `INSERT INTO seccion (id_seccion, nombre, descripcion) VALUES
                (1, 'Análisis', 'Seccion para los análisis'),
                (2, 'Prueba', 'Seccion para los pruebas');`

const especialidades = `INSERT INTO especialidad (id_especialidad, nombre) VALUES
                (1,'Levantamiento de evidencias físicas'),
                (2,'Fotografía forense'),
                (3,'Planimetría forense'),
                (4,'Preservación de la escena'),
                (5,'Identificación de armas de fuego'),
                (6,'Análisis de proyectiles y casquillos'),
                (7,'Trayectoria balística'),
                (8,'Balística comparativa'),
                (9,'Análisis de ADN'),
                (10,'Serología forense'),
                (11,'Identificación genética'),
                (12,'Botánica forense'),
                (13,'Accidentología vial'),
                (14,'Mecánica forense'),
                (15,'Eléctrica y electrónica forense'),
                (16,'Reconstrucción de hechos'),
                (17,'Análisis de dispositivos electrónicos'),
                (18,'Recuperación de datos'),
                (19,'Ciberseguridad y rastreo digital'),
                (20,'Análisis de redes'),
                (21,'Análisis de drogas de abuso'),
                (22,'Alcoholimetría'),
                (23,'Envenenamientos y sustancias químicas'),
                (24,'Toxicología ambiental'),
                (25,'Pericia caligráfica'),
                (26,'Documentoscopía'),
                (27,'Análisis de firmas y rúbricas'),
                (28,'Tinta y papel forense'),
                (29,'Auditoría forense'),
                (30,'Lavado de activos'),
                (31,'Tasación de bienes'),
                (32,'Fraudes contables'),
                (33,'Perfilación criminal'),
                (34,'Evaluación psicológica'),
                (35,'Psicología del testimonio'),
                (36,'Psicología penitenciaria'),
                (37,'Dactiloscopía'),
                (38,'Odontología forense'),
                (39,'Antropología forense'),
                (40,'Retrato hablado');`

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

const turnos = `INSERT INTO turno (id_turno, nombre) VALUES
                (1,'Mañana'),
                (2,'Tarde'),
                (3,'Noche'),
                (4,'Guardia 24 horas');`

const tipo_departamento_seccion = `INSERT INTO tipo_departamento_seccion (id_tipo_departamento_seccion, id_tipo_departamento, id_seccion) VALUES
                (1, 1, 1),
                (2, 1, 2)`

const dbseed = `  
                ${deleteAll}
                ${roles}              
                ${estados}                
                ${tipos_departamento}                
                ${especialidades}                
                ${secciones}                
                ${grados}                
                ${turnos}                
                ${tipo_departamento_seccion}                
`;

db.query(dbseed, (err, result)=>{
    if(err){
        console.log('Error al insertar los datos: ', err)
    }
    else{
        console.log("Datos insertados correctamente.", result)
    }
})