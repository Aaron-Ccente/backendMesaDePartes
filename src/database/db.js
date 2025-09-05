import mysql2 from 'mysql2'
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from '../config/config.js'

const db = mysql2.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    multipleStatements: true,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
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