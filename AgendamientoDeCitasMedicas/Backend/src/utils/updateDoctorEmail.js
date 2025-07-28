const { query } = require('../db/db');

// Script para actualizar el email del doctor en la base de datos
async function updateDoctorEmail() {
  try {
    console.log('🔄 Actualizando email del doctor...');
    
    // Actualizar el email del doctor
    const result = await query(
      "UPDATE users SET email = $1 WHERE email = $2 RETURNING *",
      ['axeldoge4@gmail.com', 'axel@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Email del doctor actualizado exitosamente:');
      console.log('📧 Nuevo email:', result.rows[0].email);
      console.log('👤 Usuario:', result.rows[0].name);
    } else {
      console.log('⚠️  No se encontró ningún doctor con el email axel@gmail.com');
      
      // Verificar si ya existe el nuevo email
      const checkResult = await query(
        "SELECT * FROM users WHERE email = $1",
        ['axeldoge4@gmail.com']
      );
      
      if (checkResult.rows.length > 0) {
        console.log('✅ El doctor ya tiene el email correcto: axeldoge4@gmail.com');
      } else {
        console.log('🔍 Buscando todos los doctores en la base de datos...');
        const doctorsResult = await query("SELECT * FROM users WHERE rol = 'doctor'");
        console.log('👨‍⚕️ Doctores encontrados:', doctorsResult.rows);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar email del doctor:', error.message);
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  updateDoctorEmail().then(() => {
    console.log('🏁 Script completado');
    process.exit(0);
  });
}

module.exports = updateDoctorEmail;
