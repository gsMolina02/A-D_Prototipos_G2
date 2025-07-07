import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import '../App.css';
import { registerUser } from '../services/api'; // Agrega esta línea


const Register = ({ onNavigate, history }) => {
  const [formData, setFormData] = useState({
  name: '',
  apellido: '',
  cedula: '',
  email: '',
  telefono: '',
  password: '',
  rol: 'paciente',
});

  const [loading, setLoading] = useState(false);

  const { registrarUsuario, usuarios } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validarEmail = (email) => {
    // Simple regex para validar email
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validar campos obligatorios
  if (!formData.name || !formData.apellido || !formData.cedula ||
      !formData.email || !formData.telefono || !formData.password) {
    alert('Por favor completa todos los campos');
    return;
  }

  if (!validarEmail(formData.email)) {
    alert('Por favor ingresa un email válido');
    return;
  }

  try {
    const response = await registerUser({
      name: formData.name,
      apellido: formData.apellido,
      cedula: formData.cedula,
      email: formData.email,
      telefono: formData.telefono,
      password: formData.password,
      rol: formData.rol,
    });
    alert(response.data.message);
    if (onNavigate) {
      onNavigate('login');
    } else if (history) {
      history.push('/login');
    } else {
      window.location.href = '/login';
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Error al registrar usuario');
  }
};

  return (
    <div className='container'>
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        {/* ... inputs igual que antes ... */}
              <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Nombre"
        required
      />
        <input 
          type="text" 
          name="apellido" 
          value={formData.apellido} 
          onChange={handleChange} 
          placeholder="Apellido" 
          required 
        />
        <input 
          type="text" 
          name="cedula" 
          value={formData.cedula} 
          onChange={handleChange} 
          placeholder="Cédula" 
          required 
        />
        <input 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          placeholder="Email" 
          required 
        />
        <input 
          type="tel" 
          name="telefono" 
          value={formData.telefono} 
          onChange={handleChange} 
          placeholder="Teléfono" 
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
        <select 
          name="rol" 
          value={formData.rol} 
          onChange={handleChange}
        >
          <option value="paciente">Paciente</option>
          <option value="doctor">Doctor</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      
      {onNavigate ? (
        <button 
          onClick={() => onNavigate('login')}
          className="link-button"
        >
          ¿Ya tienes una cuenta? Inicia sesión
        </button>
      ) : (
        <a href="/login">¿Ya tienes una cuenta? Inicia sesión</a>
      )}
    </div>
  );
};

export default Register;
