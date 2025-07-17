const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Probando login con credenciales del doctor...');
    
    const response = await axios.post('http://localhost:5000/api/login', {
      email: 'axel@gmail.com',
      password: '1234'
    });
    
    console.log('✅ LOGIN EXITOSO!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.log('❌ LOGIN FALLÓ');
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
  }
};

testLogin();
