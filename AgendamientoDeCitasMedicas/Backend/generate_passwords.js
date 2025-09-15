const bcrypt = require('bcryptjs');

// Generar hash para password "123456" (contraseña por defecto)
const password = '123456';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generando hash:', err);
  } else {
    console.log('Password hasheado para "123456":', hash);
    console.log('\nUsa este hash en el script SQL:');
    console.log(`'${hash}'`);
  }
});

// También generar hash para password del doctor
bcrypt.hash('doctor123', saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generando hash:', err);
  } else {
    console.log('\nPassword hasheado para "doctor123":', hash);
    console.log(`'${hash}'`);
  }
});
