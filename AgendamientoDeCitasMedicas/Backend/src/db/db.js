const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../../.env' });

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  // Si existe DATABASE_URL (Supabase/producción), úsala
  connectionString: process.env.DATABASE_URL,
  
  // Si no, usar configuración individual (desarrollo local)
  ...(!process.env.DATABASE_URL && {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: process.env.DB_PORT || 5432,
  }),
  
  // Configuración SSL para producción
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Función para hacer consultas
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = { query, pool };
