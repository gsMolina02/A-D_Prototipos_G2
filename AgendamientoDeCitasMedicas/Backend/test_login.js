const bcrypt = require('bcryptjs');

// Hash almacenado en la base de datos para doctor123
const storedHash = '$2a$10$JYEvSGvfq9NsKv29ROWFyurloK0pESv2q.CGSg2.7G95ZFAZ9JATu';

// Contraseña que el usuario introduce
const userPassword = 'doctor123';

console.log('🧪 Probando bcrypt.compare...');
console.log('Contraseña introducida:', userPassword);
console.log('Hash en BD:', storedHash);

bcrypt.compare(userPassword, storedHash).then(result => {
    console.log('¿Coinciden?', result ? '✅ SÍ' : '❌ NO');
    
    if (result) {
        console.log('🎉 ¡Login exitoso! La contraseña "doctor123" coincide con el hash.');
    } else {
        console.log('🚫 Login fallido. La contraseña no coincide.');
    }
}).catch(err => {
    console.error('❌ Error:', err);
});
