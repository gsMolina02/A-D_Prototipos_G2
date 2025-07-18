const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function crearUsuariosPrueba() {
  console.log('👥 === CREANDO USUARIOS DE PRUEBA ===\n');

  try {
    // Crear paciente
    console.log('👤 1. Creando paciente de prueba...');
    const paciente = await axios.post(`${API_BASE}/register`, {
      name: 'Juan',
      apellido: 'Paciente',
      cedula: '12345678',
      email: 'paciente@test.com',
      telefono: '123456789',
      password: 'password123',
      rol: 'paciente'
    });
    console.log('✅ Paciente creado exitosamente');

    // Crear doctor
    console.log('\n👨‍⚕️ 2. Creando doctor de prueba...');
    const doctor = await axios.post(`${API_BASE}/register`, {
      name: 'Dr. Maria',
      apellido: 'Doctor',
      cedula: '87654321',
      email: 'doctor@test.com',
      telefono: '987654321',
      password: 'password123',
      rol: 'doctor'
    });
    console.log('✅ Doctor creado exitosamente');

    console.log('\n🎉 === USUARIOS CREADOS EXITOSAMENTE ===');
    
  } catch (error) {
    if (error.response?.data?.error === 'User already exists') {
      console.log('ℹ️ Los usuarios ya existen - continuando con la prueba...');
    } else {
      console.error('❌ Error al crear usuarios:', error.response?.data || error.message);
    }
  }
}

// Ejecutar la creación
crearUsuariosPrueba();
