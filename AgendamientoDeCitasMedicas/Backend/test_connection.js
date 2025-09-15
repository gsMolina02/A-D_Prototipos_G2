const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Probando conexión a Supabase...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada ✅' : 'No configurada ❌');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function probarConexion() {
  try {
    console.log('⏳ Conectando...');
    const client = await pool.connect();
    
    console.log('✅ Conexión exitosa!');
    
    // Probar consulta simple
    const result = await client.query('SELECT NOW()');
    console.log('🕐 Hora del servidor:', result.rows[0].now);
    
    // Verificar tablas
    const tablas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Tablas encontradas:');
    tablas.rows.forEach(tabla => {
      console.log('  - ' + tabla.table_name);
    });
    
    // Verificar usuarios
    const usuarios = await client.query('SELECT name, email, rol FROM users');
    console.log('👥 Usuarios encontrados:');
    usuarios.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.rol}`);
    });
    
    client.release();
    console.log('🎉 Todo funciona correctamente!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔧 Código de error:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Posibles soluciones:');
      console.log('  1. Verificar que la URL sea correcta');
      console.log('  2. Verificar conexión a internet');
      console.log('  3. Probar desde otro DNS (8.8.8.8)');
    }
  } finally {
    await pool.end();
  }
}

probarConexion();
