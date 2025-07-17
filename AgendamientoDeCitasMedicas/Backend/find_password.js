const { Pool } = require('pg');

const testPasswords = ['12345678', '123456', 'admin', 'password', '1234', 'root', 'postgres'];

const testConnection = async (password) => {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'credenciales_de_usuarios',
    password: password,
    port: 5432,
  });
  
  try {
    const result = await pool.query('SELECT 1');
    console.log(`✅ SUCCESS with password: "${password}"`);
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED with password: "${password}" - ${error.message}`);
    await pool.end();
    return false;
  }
};

const findWorkingPassword = async () => {
  console.log('Testing different PostgreSQL passwords...\n');
  
  for (const password of testPasswords) {
    const works = await testConnection(password);
    if (works) {
      console.log(`\n🎉 Found working password: "${password}"`);
      return password;
    }
  }
  
  console.log('\n❌ No working password found. Please check your PostgreSQL installation.');
  return null;
};

findWorkingPassword();
