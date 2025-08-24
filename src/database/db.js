import mysql2 from 'mysql2'
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from '../config/config.js'

const db = mysql2.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
})

// Manejar errores de conexión
db.on('error', (err) => {
    console.error('Error de conexión a la base de datos:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Conexión a la base de datos perdida. Reintentando...');
    } else {
        throw err;
    }
});

export default db