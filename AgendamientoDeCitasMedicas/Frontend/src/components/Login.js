import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import '../App.css';
import { loginUser } from '../services/api'; // Agrega esta línea

const Login = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { setUsuarioActual, usuarios, registrarUsuario } = useAuth(); // agrega registrarUsuario y usuarios



  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.email || !formData.password) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const response = await loginUser({
      email: formData.email,
      password: formData.password,
    });

    // Si el usuario no existe en el contexto, agrégalo (para que todo funcione igual)
    const userFromBackend = response.data.user;
    const exists = usuarios.some(u => u.email === userFromBackend.email);
    if (!exists) {
      registrarUsuario(userFromBackend);
    }
    setUsuarioActual(userFromBackend);
    // El dashboard aparecerá automáticamente
  } catch (error) {
    alert(error.response?.data?.error || 'Error al iniciar sesión');
  }
};

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Contraseña"
          required
        />
        <button type="submit">Iniciar sesión</button>
      </form>
      
      {/* Si estás usando navegación con botones en lugar de enlaces */}
      {onNavigate && (
        <button 
          onClick={() => onNavigate('register')}
          className="link-button"
        >
          ¿No tienes una cuenta? Regístrate
        </button>
      )}
      
      {/* Si prefieres usar enlaces tradicionales */}
      {!onNavigate && (
        <a href="/register">¿No tienes una cuenta? Regístrate</a>
      )}
      
      {/* Usuarios de prueba para facilitar testing */}
      <div className="test-users">
        <h4>Usuarios de prueba:</h4>
        <p><strong>Paciente:</strong> juan@ejemplo.com / 123456</p>
        <p><strong>Doctor:</strong> maria@ejemplo.com / admin123</p>
      </div>
    </div>
  );
};

export default Login;