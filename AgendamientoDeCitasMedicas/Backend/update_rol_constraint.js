const { query } = require('./src/db/db');

async function updateRolConstraint() {
  try {
    console.log('Eliminando constraint anterior...');
    await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rol_check`);
    
    console.log('Creando nuevo constraint con rol asistente...');
    await query(`ALTER TABLE users ADD CONSTRAINT users_rol_check CHECK (rol IN ('paciente', 'doctor', 'asistente'))`);
    
    console.log('✅ Constraint actualizado exitosamente!');
    console.log('Ahora puedes registrar usuarios con rol "asistente"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateRolConstraint();
