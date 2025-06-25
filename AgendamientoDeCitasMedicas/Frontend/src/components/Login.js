import React, { useState } from 'react';
import { loginUser } from '../services/api';
import '../App.css'; // Importa el archivo CSS para estilos

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(formData);
      console.log(response); // Verifica si la respuesta es la correcta
      alert('Login exitoso');
    } catch (err) {
      console.error('Error al hacer login:', err);
      alert('Credenciales incorrectas');
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
      <a href="/register">¿No tienes una cuenta? Regístrate</a>
    </div>
  );
};

export default Login;

