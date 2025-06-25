import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { registerUser } from '../services/api';  // Asegúrate de que esta ruta es correcta
import '../App.css';  // Importa el archivo CSS para estilos

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    contrasena: '',
    rol: 'paciente',
  });

  const history = useHistory();  // Para redirigir a la página de login

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerUser(formData); // Aquí envías los datos al backend
      alert('Usuario registrado: ' + response.data.nombre);
      history.push('/login');  // Redirigir a la página de login después de registrarse
    } catch (err) {
      console.error('Error al registrar:', err);
      alert('Hubo un error al registrar el usuario');
    }
  };

  return (
    <div className='container'>
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" required />
        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido" required />
        <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} placeholder="Cédula" required />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
        <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" required />
        <input type="password" name="contrasena" value={formData.contrasena} onChange={handleChange} placeholder="Contraseña" required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
