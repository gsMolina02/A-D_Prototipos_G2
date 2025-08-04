const { query } = require('./src/db/db');

const updatePhoneFormat = async () => {
  try {
    console.log('🔄 Iniciando actualización del formato de teléfonos...');

    // Obtener todos los usuarios con teléfono
    const usersResult = await query('SELECT id, name, apellido, telefono FROM users WHERE telefono IS NOT NULL AND telefono != \'\'');
    
    console.log(`📱 Encontrados ${usersResult.rows.length} usuarios con teléfono`);

    let actualizados = 0;
    let sinCambios = 0;

    for (const user of usersResult.rows) {
      let telefonoActual = user.telefono;
      let telefonoFormateado = '';

      // Limpiar el número (quitar espacios, guiones, paréntesis)
      let numeroLimpio = telefonoActual.replace(/[\s\-\(\)]/g, '');

      // Si ya tiene formato internacional (+593), mantenerlo
      if (numeroLimpio.startsWith('+593')) {
        telefonoFormateado = numeroLimpio;
      }
      // Si empieza con 593 (sin +), agregar el +
      else if (numeroLimpio.startsWith('593')) {
        telefonoFormateado = '+' + numeroLimpio;
      }
      // Si empieza con 0 (formato nacional ecuatoriano), convertir
      else if (numeroLimpio.startsWith('0')) {
        // Quitar el 0 inicial y agregar +593
        telefonoFormateado = '+593' + numeroLimpio.substring(1);
      }
      // Si es solo el número (sin código de país) y tiene 9 dígitos
      else if (numeroLimpio.length === 9) {
        telefonoFormateado = '+593' + numeroLimpio;
      }
      // Si tiene 10 dígitos y empieza con 9 (celular ecuatoriano)
      else if (numeroLimpio.length === 10 && numeroLimpio.startsWith('9')) {
        telefonoFormateado = '+593' + numeroLimpio;
      }
      // Mantener tal como está si no coincide con ningún patrón
      else {
        telefonoFormateado = telefonoActual;
        console.log(`⚠️  Usuario ${user.name} ${user.apellido}: Formato no reconocido - ${telefonoActual}`);
      }

      // Actualizar en la base de datos si cambió
      if (telefonoFormateado !== telefonoActual) {
        await query(
          'UPDATE users SET telefono = $1 WHERE id = $2',
          [telefonoFormateado, user.id]
        );
        
        console.log(`✅ Usuario ${user.name} ${user.apellido}: ${telefonoActual} → ${telefonoFormateado}`);
        actualizados++;
      } else {
        console.log(`⏭️  Usuario ${user.name} ${user.apellido}: ${telefonoActual} (sin cambios)`);
        sinCambios++;
      }
    }

    console.log('\n🎉 ¡Actualización de formatos completada exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   • Teléfonos actualizados: ${actualizados}`);
    console.log(`   • Teléfonos sin cambios: ${sinCambios}`);
    console.log(`   • Total procesados: ${usersResult.rows.length}`);
    
    // Mostrar un resumen final
    const updatedResult = await query('SELECT COUNT(*) as total FROM users WHERE telefono LIKE \'+593%\'');
    const totalResult = await query('SELECT COUNT(*) as total FROM users WHERE telefono IS NOT NULL AND telefono != \'\'');
    
    console.log(`\n📈 Estadísticas finales:`);
    console.log(`   • Teléfonos en formato internacional (+593): ${updatedResult.rows[0].total}`);
    console.log(`   • Total de teléfonos registrados: ${totalResult.rows[0].total}`);
    
    // Mostrar algunos ejemplos de teléfonos actualizados
    const samplesResult = await query('SELECT name, apellido, telefono FROM users WHERE telefono LIKE \'+593%\' LIMIT 5');
    console.log(`\n📋 Ejemplos de teléfonos actualizados:`);
    samplesResult.rows.forEach(user => {
      console.log(`   • ${user.name} ${user.apellido}: ${user.telefono}`);
    });

  } catch (error) {
    console.error('❌ Error al actualizar formatos:', error.message);
    console.error('🔧 Posibles soluciones:');
    console.error('   1. Verificar que la base de datos esté corriendo');
    console.error('   2. Revisar las credenciales en el archivo .env');
    console.error('   3. Asegurarse de que la tabla users existe');
  }
};

// Función para validar formato de teléfono ecuatoriano
const validateEcuadorianPhone = (phone) => {
  // Formato válido: +593 seguido de 9 dígitos (celular) o 7-8 dígitos (fijo)
  const celularPattern = /^\+593[9][0-9]{8}$/; // +593987654321
  const fijoPattern = /^\+593[2-7][0-9]{6,7}$/; // +59322345678 o +5932234567
  
  return celularPattern.test(phone) || fijoPattern.test(phone);
};

// Función para verificar teléfonos válidos después de la actualización
const validateUpdatedPhones = async () => {
  try {
    console.log('\n🔍 Validando teléfonos actualizados...');
    
    const phonesResult = await query('SELECT id, name, apellido, telefono FROM users WHERE telefono IS NOT NULL AND telefono != \'\'');
    
    let validos = 0;
    let invalidos = 0;
    
    phonesResult.rows.forEach(user => {
      if (validateEcuadorianPhone(user.telefono)) {
        validos++;
      } else {
        console.log(`❌ Teléfono inválido - ${user.name} ${user.apellido}: ${user.telefono}`);
        invalidos++;
      }
    });
    
    console.log(`\n✅ Validación completada:`);
    console.log(`   • Teléfonos válidos: ${validos}`);
    console.log(`   • Teléfonos inválidos: ${invalidos}`);
    
  } catch (error) {
    console.error('❌ Error al validar teléfonos:', error.message);
  }
};

// Función principal
const main = async () => {
  console.log('📱 SCRIPT DE ACTUALIZACIÓN DE FORMATO DE TELÉFONOS');
  console.log('================================================\n');
  
  await updatePhoneFormat();
  await validateUpdatedPhones();
  
  console.log('\n🏁 Script completado exitosamente');
  process.exit(0);
};

// Ejecutar el script
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});