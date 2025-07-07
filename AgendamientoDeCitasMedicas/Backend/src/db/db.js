const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });
// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,        // Usar variable de entorno
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT || 5432, // Puerto por defecto
});

// Función para hacer consultas
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = { query };
