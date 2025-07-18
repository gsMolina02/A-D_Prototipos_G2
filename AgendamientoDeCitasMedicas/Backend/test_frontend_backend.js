// Prueba de conectividad frontend-backend
const axios = require('axios');

const testFrontendBackend = async () => {
  console.log('🔍 Probando conectividad frontend-backend...\n');
  
  try {
    // 1. Probar login
    console.log('1. Probando login...');
    const loginResponse = await axios.post('http://localhost:5000/api/login', {
      email: 'axel@gmail.com',
      password: '1234'
    });
    console.log('✅ Login exitoso:', loginResponse.data.user.name);
    
    // 2. Probar horarios por doctor
    console.log('\n2. Probando horarios por doctor...');
    const horariosDoctor = await axios.get('http://localhost:5000/api/horarios/doctor/3');
    console.log('✅ Horarios del doctor:', horariosDoctor.data.length, 'horarios');
    
    // 3. Probar todos los horarios
    console.log('\n3. Probando todos los horarios...');
    const todosHorarios = await axios.get('http://localhost:5000/api/horarios');
    console.log('✅ Todos los horarios:', todosHorarios.data.length, 'horarios');
    
    // 4. Mostrar detalles de un horario
    if (todosHorarios.data.length > 0) {
      const horario = todosHorarios.data[0];
      console.log('\n4. Detalles del primer horario:');
      console.log('   - Día:', horario.dia);
      console.log('   - Hora:', horario.hora_inicio, '-', horario.hora_fin);
      console.log('   - Duración:', horario.duracion_cita, 'min');
      console.log('   - Intervalo:', horario.intervalo, 'min');
      console.log('   - Doctor:', horario.doctor_name, horario.doctor_apellido);
      
      // Calcular citas posibles
      const inicio = new Date(`1970-01-01T${horario.hora_inicio}`);
      const fin = new Date(`1970-01-01T${horario.hora_fin}`);
      const duracionTotal = (fin - inicio) / (1000 * 60);
      const tiempoPorCita = horario.duracion_cita + horario.intervalo;
      const citasPosibles = Math.floor(duracionTotal / tiempoPorCita);
      console.log('   - Citas posibles:', citasPosibles);
    }
    
    console.log('\n🎉 Todas las pruebas exitosas!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testFrontendBackend();
