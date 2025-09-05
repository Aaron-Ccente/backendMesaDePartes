import db from './db.js'

const deleteAll = `DELETE FROM rol;
                   DELETE FROM estado;
                    `;
const roles = `INSERT INTO rol (id_rol, nombre_rol, descripcion) VALUES 
               (1,'ADMINISTRADOR','Administra a todos los peritos - control total.'), 
               (2,'PERITO', 'Profesional capacitado.'), 
               (3,'CENTRAL','Encargado de dirigir los primeros documentos.');`

const estados = `INSERT INTO estado (id_estado, nombre_estado, descripcion) VALUES
                (1, 'HABILITADO','Usuario que puede realizar acciones en la plataforma.'),
                (2, 'DESHABILITADO','Usuario que no puede realizar acciones en la plataforma.');
                `

const dbseed = `  
                ${deleteAll}
                ${roles}              
                ${estados}                
`;

db.query(dbseed, (err, result)=>{
    if(err){
        console.log('Error al insertar los datos: ', err)
    }
    else{
        console.log("Datos insertados correctamente.", result)
    }
})