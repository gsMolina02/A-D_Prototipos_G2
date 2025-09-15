import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import '../App.css';

const Login = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { iniciarSesion } = useAuth();



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
      const result = await iniciarSesion(formData.email, formData.password);
      
      if (result.success) {
        // El usuario ya está establecido en el contexto
        alert('Sesión iniciada exitosamente');
      } else {
        alert(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al iniciar sesión');
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
        <p><strong>Doctor:</strong> axeldoge4@gmail.com / doctor123</p>
        <p><strong>Paciente:</strong> juan@example.com / tu_contraseña</p>
      </div>
    </div>
  );
};

export default Login;