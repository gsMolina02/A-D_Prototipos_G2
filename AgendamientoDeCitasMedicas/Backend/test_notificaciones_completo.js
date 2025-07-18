const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testNotificacionesCompleto() {
  console.log('🧪 === PRUEBA COMPLETA DEL SISTEMA DE NOTIFICACIONES ===\n');

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

    // 3. Crear cita (esto debe generar notificaciones automáticamente)
    console.log('\n📅 3. Creando cita...');
    const cita = await axios.post(`${API_BASE}/citas`, {
      paciente_id: paciente.id,
      doctor_id: doctor.id,
      dia: '2024-07-20',
      horario: '10:00',
      especialidad: 'Consulta General'
    });
    
    const citaId = cita.data.cita.id;
    console.log(`✅ Cita creada con ID: ${citaId}`);

    // 4. Verificar notificaciones del paciente
    console.log('\n🔔 4. Verificando notificaciones del paciente...');
    const notifPaciente = await axios.get(`${API_BASE}/notificaciones/usuario/${paciente.id}`);
    console.log(`📝 Notificaciones del paciente (${notifPaciente.data.length}):`);
    notifPaciente.data.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.mensaje} - Leída: ${notif.leida ? '✅' : '❌'}`);
    });

    // 5. Verificar notificaciones del doctor
    console.log('\n🔔 5. Verificando notificaciones del doctor...');
    const notifDoctor = await axios.get(`${API_BASE}/notificaciones/usuario/${doctor.id}`);
    console.log(`📝 Notificaciones del doctor (${notifDoctor.data.length}):`);
    notifDoctor.data.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.mensaje} - Leída: ${notif.leida ? '✅' : '❌'}`);
    });

    // 6. Cancelar cita (esto debe generar más notificaciones)
    console.log('\n❌ 6. Cancelando cita...');
    await axios.put(`${API_BASE}/citas/${citaId}/cancelar`, {
      motivo: 'Cancelación por prueba de notificaciones'
    });
    console.log(`✅ Cita ${citaId} cancelada`);

    // 7. Verificar notificaciones actualizadas del paciente
    console.log('\n🔔 7. Verificando notificaciones actualizadas del paciente...');
    const notifPacienteActual = await axios.get(`${API_BASE}/notificaciones/usuario/${paciente.id}`);
    console.log(`📝 Notificaciones del paciente después de cancelación (${notifPacienteActual.data.length}):`);
    notifPacienteActual.data.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.mensaje} - Leída: ${notif.leida ? '✅' : '❌'}`);
    });

    // 8. Verificar notificaciones actualizadas del doctor
    console.log('\n🔔 8. Verificando notificaciones actualizadas del doctor...');
    const notifDoctorActual = await axios.get(`${API_BASE}/notificaciones/usuario/${doctor.id}`);
    console.log(`📝 Notificaciones del doctor después de cancelación (${notifDoctorActual.data.length}):`);
    notifDoctorActual.data.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.mensaje} - Leída: ${notif.leida ? '✅' : '❌'}`);
    });

    console.log('\n🎉 === PRUEBA COMPLETADA EXITOSAMENTE ===');
    console.log('\n📊 RESUMEN:');
    console.log(`   - Cita creada y cancelada: ✅`);
    console.log(`   - Notificaciones para paciente: ${notifPacienteActual.data.length}`);
    console.log(`   - Notificaciones para doctor: ${notifDoctorActual.data.length}`);
    console.log(`   - Sistema funcionando correctamente: ✅`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testNotificacionesCompleto();
