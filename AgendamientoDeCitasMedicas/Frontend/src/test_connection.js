// Test para verificar la conectividad frontend-backend
import { loginUser } from '../services/api';

const testConnection = async () => {
  console.log('Probando conexión frontend-backend...');
  
  try {
    const response = await loginUser({
      email: 'axel@gmail.com',
      password: '1234'
    });
    
    console.log('✅ Conexión exitosa!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    console.error('Error response:', error.response?.data);
    return false;
  }
};

// Ejecutar la prueba
testConnection();
