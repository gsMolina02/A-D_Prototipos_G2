const pool = require('./src/db/db.js');

async function verificarUsuarios() {
    try {
        console.log('🔍 Verificando usuarios en la base de datos...');
        const result = await pool.query('SELECT id, name, apellido, email, rol FROM users ORDER BY id');
        
        console.log('📋 Usuarios encontrados:');
        result.rows.forEach(user => {
            console.log(`ID: ${user.id} | Nombre: ${user.name} ${user.apellido} | Email: ${user.email} | Rol: ${user.rol}`);
        });
        
        console.log('\n🔑 Credenciales de prueba según database_setup.sql:');
        console.log('Doctor: axeldoge4@gmail.com / doctor123');
        console.log('Paciente: juan.perez@email.com / 123456');
        
        // Verificar si las contraseñas están correctamente hasheadas
        const hashedResult = await pool.query('SELECT email, password FROM users WHERE email IN ($1, $2)', 
            ['axeldoge4@gmail.com', 'juan.perez@email.com']);
        
        console.log('\n🔐 Verificación de contraseñas hasheadas:');
        hashedResult.rows.forEach(user => {
            console.log(`Email: ${user.email}`);
            console.log(`Password hash: ${user.password.substring(0, 20)}...`);
        });
        
        pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        pool.end();
    }
}

verificarUsuarios();
