const axios = require('axios');

async function probarLogin() {
    try {
        console.log('🧪 Probando endpoint de login...');
        console.log('URL: http://127.0.0.1:3002/api/login');
        
        const response = await axios.post('http://127.0.0.1:3002/api/login', {
            email: 'axeldoge4@gmail.com',
            password: 'doctor123'
        });
        
        console.log('✅ Login exitoso!');
        console.log('Status:', response.status);
        console.log('Respuesta:', response.data);
        
    } catch (error) {
        console.log('❌ Error en login:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else if (error.request) {
            console.log('No se pudo conectar al servidor');
            console.log('Error:', error.message);
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Probar también con el paciente
async function probarLoginPaciente() {
    try {
        console.log('\n🧪 Probando login de paciente...');
        
        const response = await axios.post('http://127.0.0.1:3002/api/login', {
            email: 'juan.perez@email.com',
            password: '123456'
        });
        
        console.log('✅ Login de paciente exitoso!');
        console.log('Status:', response.status);
        console.log('Respuesta:', response.data);
        
    } catch (error) {
        console.log('❌ Error en login de paciente:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

probarLogin().then(() => probarLoginPaciente());
