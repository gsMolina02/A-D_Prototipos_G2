const axios = require('axios');

const baseURL = 'http://localhost:5000';

async function testAgendarCita() {
    try {
        console.log('🚀 === PRUEBA DE AGENDADO DE CITAS ===\n');

        // 1. Login como paciente
        console.log('1. 🔐 Iniciando sesión como paciente...');
        const loginResponse = await axios.post(`${baseURL}/api/login`, {
            email: 'axeldoge70@gmail.com',
            password: '1234'
        });
        
        const pacienteId = loginResponse.data.user.id;
        console.log(`✅ Login exitoso - Paciente ID: ${pacienteId}`);

        // 2. Obtener horarios disponibles
        console.log('\n2. 📋 Obteniendo horarios disponibles...');
        const horariosResponse = await axios.get(`${baseURL}/api/horarios`);
        const horarios = horariosResponse.data;
        
        if (horarios.length === 0) {
            console.log('❌ No hay horarios disponibles');
            return;
        }
        
        const horario = horarios[0];
        console.log('📅 Horario seleccionado:', horario);

        // 3. Intentar agendar una cita
        console.log('\n3. 📝 Agendando cita...');
        const citaData = {
            paciente_id: pacienteId,
            doctor_id: horario.doctor_id,
            dia: horario.dia,
            horario: '09:00 - 09:30', // Usar un horario específico
            especialidad: 'Consulta General'
        };
        
        console.log('Datos de la cita:', citaData);
        
        const citaResponse = await axios.post(`${baseURL}/api/citas`, citaData);
        
        console.log('✅ Cita agendada exitosamente:');
        console.log(citaResponse.data);

        // 4. Verificar que la cita se guardó
        console.log('\n4. 🔍 Verificando cita guardada...');
        const citasPaciente = await axios.get(`${baseURL}/api/citas/paciente/${pacienteId}`);
        console.log('📋 Citas del paciente:');
        console.table(citasPaciente.data);

        console.log('\n🎉 === PRUEBA COMPLETADA EXITOSAMENTE ===');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
    }
}

testAgendarCita();
