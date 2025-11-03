// backend-mesa-de-partes/knexfile.js
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from './src/config/config.js';

// Configuración para obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = {
  development: {
    client: 'mysql2',
    connection: {
      host: DB_HOST || 'localhost',
      port: DB_PORT || 3306,
      user: DB_USER || 'root',
      password: DB_PASSWORD || '',
      database: DB_NAME || 'mesadepartespnp'
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations',
      extension: 'js',
      stub: path.join(__dirname, 'src/database/migration_stub.js') // Opcional
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
      extension: 'js'
    },
    useNullAsDefault: true
  },

  // Configuración de producción
  production: {
    client: 'mysql2',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds')
    },
    useNullAsDefault: true
  }
};

export default config;
