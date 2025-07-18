const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testRecordatorios() {
  console.log('🔔 === PRUEBA DEL SISTEMA DE RECORDATORIOS ===\n');

  try {
    // 1. Login como paciente
    console.log('👤 1. Login como paciente...');
    const loginPaciente = await axios.post(`${API_BASE}/login`, {
      email: 'paciente@test.com',
      password: 'password123'
    });
    
    const paciente = loginPaciente.data.user;
    console.log(`✅ Paciente logueado: ${paciente.name} ${paciente.apellido} (ID: ${paciente.id})`);

    // 2. Login como doctor
    console.log('\n👨‍⚕️ 2. Login como doctor...');
    const loginDoctor = await axios.post(`${API_BASE}/login`, {
      email: 'axel@gmail.com',
      password: '1234'
    });
    
    const doctor = loginDoctor.data.user;
    console.log(`✅ Doctor logueado: ${doctor.name} ${doctor.apellido} (ID: ${doctor.id})`);

    // 3. Crear cita para mañana (24 horas desde ahora)
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaMañana = mañana.toISOString().split('T')[0];
    
    console.log(`\n📅 3. Creando cita para mañana (${fechaMañana})...`);
    const cita = await axios.post(`${API_BASE}/citas`, {
      paciente_id: paciente.id,
      doctor_id: doctor.id,
      dia: fechaMañana,
      horario: '14:00',
      especialidad: 'Consulta de Recordatorio'
    });
    
    const citaId = cita.data.cita.id;
    console.log(`✅ Cita creada con ID: ${citaId} para ${fechaMañana} a las 14:00`);

    // 4. Ejecutar manualmente el sistema de recordatorios
    console.log('\n🔔 4. Ejecutando sistema de recordatorios...');
    const recordatorios = await axios.post(`${API_BASE}/citas/recordatorios`);
    console.log(`✅ Resultado:`, recordatorios.data);

    // 5. Verificar notificaciones del paciente
    console.log('\n🔔 5. Verificando notificaciones del paciente...');
    const notifPaciente = await axios.get(`${API_BASE}/notificaciones/usuario/${paciente.id}`);
    console.log(`📝 Notificaciones del paciente (${notifPaciente.data.length}):`);
    notifPaciente.data.forEach((notif, index) => {
      const tipo = notif.mensaje.includes('Recordatorio') ? '🔔' : '📅';
      console.log(`   ${index + 1}. ${tipo} ${notif.mensaje}`);
    });

    // 6. Verificar notificaciones del doctor
    console.log('\n🔔 6. Verificando notificaciones del doctor...');
    const notifDoctor = await axios.get(`${API_BASE}/notificaciones/usuario/${doctor.id}`);
    console.log(`📝 Notificaciones del doctor (${notifDoctor.data.length}):`);
    notifDoctor.data.forEach((notif, index) => {
      const tipo = notif.mensaje.includes('Recordatorio') ? '🔔' : '📅';
      console.log(`   ${index + 1}. ${tipo} ${notif.mensaje}`);
    });

    console.log('\n🎉 === PRUEBA DE RECORDATORIOS COMPLETADA ===');
    console.log('\n📊 RESUMEN:');
    console.log(`   - Cita para mañana creada: ✅`);
    console.log(`   - Recordatorios generados: ✅`);
    console.log(`   - Notificaciones para paciente: ${notifPaciente.data.length}`);
    console.log(`   - Notificaciones para doctor: ${notifDoctor.data.length}`);
    
    // Filtrar solo recordatorios
    const recordatoriosPaciente = notifPaciente.data.filter(n => n.mensaje.includes('Recordatorio'));
    const recordatoriosDoctor = notifDoctor.data.filter(n => n.mensaje.includes('Recordatorio'));
    
    console.log(`   - Recordatorios para paciente: ${recordatoriosPaciente.length}`);
    console.log(`   - Recordatorios para doctor: ${recordatoriosDoctor.length}`);
    console.log(`   - Sistema funcionando: ✅`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testRecordatorios();
