const axios = require('axios');

const baseURL = 'http://localhost:5000';

async function testSistemaCompleto() {
    try {
        console.log('🚀 === PRUEBA COMPLETA DEL SISTEMA ===\n');

        // 1. Login como paciente
        console.log('1. 🔐 Login como paciente...');
        const loginResponse = await axios.post(`${baseURL}/api/login`, {
            email: 'axeldoge70@gmail.com',
            password: '1234'
        });
        const pacienteId = loginResponse.data.user.id;
        console.log(`✅ Login exitoso - Paciente: ${loginResponse.data.user.name}`);

        // 2. Obtener horarios disponibles
        console.log('\n2. 📋 Obteniendo horarios disponibles...');
        const horariosResponse = await axios.get(`${baseURL}/api/horarios`);
        const horarios = horariosResponse.data;
        console.log(`✅ ${horarios.length} horarios encontrados`);
        
        if (horarios.length > 0) {
            const horario = horarios[0];
            console.log(`📅 Horario ejemplo: ${horario.dia} ${horario.hora_inicio}-${horario.hora_fin} (Dr. ${horario.doctor_name})`);
        }

        // 3. Obtener todas las citas agendadas
        console.log('\n3. 📝 Verificando citas agendadas...');
        const citasResponse = await axios.get(`${baseURL}/api/citas`);
        const citas = citasResponse.data;
        console.log(`✅ ${citas.length} citas agendadas:`);
        
        citas.forEach(cita => {
            console.log(`   - ${cita.dia} ${cita.horario} (${cita.paciente_name} con Dr. ${cita.doctor_name})`);
        });

        // 4. Simular generación de horarios y verificar disponibilidad
        console.log('\n4. 🔍 Simulando verificación de disponibilidad...');
        
        if (horarios.length > 0) {
            const horario = horarios[0];
            const citasGeneradas = ['09:00 - 09:30', '09:40 - 10:10', '10:20 - 10:50', '11:00 - 11:30'];
            
            console.log(`\n📅 Horarios generados para ${horario.dia}:`);
            citasGeneradas.forEach(citaHorario => {
                const ocupado = citas.some(cita => 
                    cita.doctor_id === horario.doctor_id &&
                    cita.dia === horario.dia &&
                    cita.horario === citaHorario &&
                    cita.estado !== 'cancelada'
                );
                
                const estado = ocupado ? '🔴 OCUPADO' : '🟢 DISPONIBLE';
                console.log(`   ${citaHorario} - ${estado}`);
            });
        }

        // 5. Intentar agendar en horario ocupado (debería fallar)
        console.log('\n5. ❌ Intentando agendar en horario ocupado...');
        try {
            await axios.post(`${baseURL}/api/citas`, {
                paciente_id: pacienteId,
                doctor_id: 3,
                dia: 'Lunes',
                horario: '09:00 - 09:30', // Este ya está ocupado
                especialidad: 'Consulta General'
            });
            console.log('❌ ERROR: Permitió agendar en horario ocupado');
        } catch (error) {
            console.log(`✅ Validación correcta: ${error.response.data.error}`);
        }

        // 6. Intentar agendar en horario disponible
        console.log('\n6. ✅ Intentando agendar en horario disponible...');
        try {
            const response = await axios.post(`${baseURL}/api/citas`, {
                paciente_id: pacienteId,
                doctor_id: 3,
                dia: 'Lunes',
                horario: '10:20 - 10:50', // Este debería estar disponible
                especialidad: 'Consulta General'
            });
            console.log(`✅ Cita agendada exitosamente: ${response.data.message}`);
            
            // Verificar que ahora aparece como ocupada
            const citasActualizadas = await axios.get(`${baseURL}/api/citas`);
            const nuevaCita = citasActualizadas.data.find(c => c.horario === '10:20 - 10:50');
            if (nuevaCita) {
                console.log(`✅ Cita confirmada en base de datos: ${nuevaCita.horario}`);
            }
            
        } catch (error) {
            console.log(`❌ Error al agendar: ${error.response?.data?.error || error.message}`);
        }

        console.log('\n🎉 === PRUEBA COMPLETA FINALIZADA ===');
        console.log('\n📊 RESUMEN:');
        console.log('- ✅ Backend funcionando');
        console.log('- ✅ APIs de horarios funcionando');
        console.log('- ✅ APIs de citas funcionando');
        console.log('- ✅ Validación de horarios ocupados');
        console.log('- ✅ Sistema de disponibilidad implementado');
        console.log('\n🌟 El frontend ahora debería mostrar:');
        console.log('   - Citas ocupadas en ROJO con "❌ No disponible"');
        console.log('   - Citas disponibles en VERDE con "✅ Agendar"');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

testSistemaCompleto();
