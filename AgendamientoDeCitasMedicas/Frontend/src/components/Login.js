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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    const resultado = iniciarSesion(formData.email, formData.password);
    
    if (resultado.success) {
      alert(`Bienvenido, ${resultado.usuario.nombre} (${resultado.usuario.rol})`);
    } else {
      alert(resultado.message);
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