import mysql2 from 'mysql2'
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from '../config/config.js'

const db = mysql2.createConnection({
    host:DB_HOST,
    user:DB_USER,
    password:DB_PASSWORD,
    database:DB_NAME,
    port:DB_PORT
})
export default db