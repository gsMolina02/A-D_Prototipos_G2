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
  const [errores, setErrores] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const { registrarUsuario, usuarios } = useAuth();

  // Validación de solo letras para nombres
  const validarSoloLetras = (texto) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return regex.test(texto);
  };

  // Validación de cédula ecuatoriana
  const validarCedula = (cedula) => {
    if (cedula.length !== 10) return false;
    
    // Verificar que todos los caracteres sean números
    if (!/^\d+$/.test(cedula)) return false;
    
    // Algoritmo de validación de cédula ecuatoriana
    try {
      const digitoVerificador = parseInt(cedula.charAt(9));
      let suma = 0;
      
      for (let i = 0; i < 9; i++) {
        let digito = parseInt(cedula.charAt(i));
        if (i % 2 === 0) { // Posiciones pares (0,2,4,6,8)
          digito *= 2;
          if (digito > 9) {
            digito -= 9;
          }
        }
        suma += digito;
      }
      
      const modulo = suma % 10;
      const verificador = modulo === 0 ? 0 : 10 - modulo;
      
      return verificador === digitoVerificador;
    } catch (error) {
      return false;
    }
  };

  // Validación de teléfono ecuatoriano
  const validarTelefono = (telefono) => {
    if (telefono.length !== 10) return false;
    if (!/^\d+$/.test(telefono)) return false;
    
    // Verificar prefijos válidos
    const prefijo = telefono.substring(0, 2);
    const prefijosValidos = ['09', '02', '03', '04', '05', '06', '07'];
    return prefijosValidos.includes(prefijo);
  };

  // Validación de email
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validación de contraseña
  const validarPassword = (password) => {
    return password.length >= 6;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorFiltrado = value;

    // Filtrar entrada según el campo
    if (name === 'name' || name === 'apellido') {
      // Solo permitir letras y espacios
      valorFiltrado = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    } else if (name === 'cedula' || name === 'telefono') {
      // Solo permitir números
      valorFiltrado = value.replace(/\D/g, '');
    }

    setFormData({
      ...formData,
      [name]: valorFiltrado,
    });

    // Validar en tiempo real
    validarCampo(name, valorFiltrado);
  };

  const validarCampo = (campo, valor) => {
    const nuevosErrores = { ...errores };

    switch (campo) {
      case 'name':
        if (!valor.trim()) {
          nuevosErrores.name = 'El nombre es obligatorio';
        } else if (valor.trim().length < 2) {
          nuevosErrores.name = 'El nombre debe tener al menos 2 caracteres';
        } else if (!validarSoloLetras(valor)) {
          nuevosErrores.name = 'El nombre solo debe contener letras';
        } else {
          delete nuevosErrores.name;
        }
        break;

      case 'apellido':
        if (!valor.trim()) {
          nuevosErrores.apellido = 'El apellido es obligatorio';
        } else if (valor.trim().length < 2) {
          nuevosErrores.apellido = 'El apellido debe tener al menos 2 caracteres';
        } else if (!validarSoloLetras(valor)) {
          nuevosErrores.apellido = 'El apellido solo debe contener letras';
        } else {
          delete nuevosErrores.apellido;
        }
        break;

      case 'cedula':
        if (!valor) {
          nuevosErrores.cedula = 'La cédula es obligatoria';
        } else if (valor.length !== 10) {
          nuevosErrores.cedula = 'La cédula debe tener exactamente 10 dígitos';
        } else if (!validarCedula(valor)) {
          nuevosErrores.cedula = 'La cédula ingresada no es válida';
        } else {
          delete nuevosErrores.cedula;
        }
        break;

      case 'email':
        if (!valor) {
          nuevosErrores.email = 'El email es obligatorio';
        } else if (!validarEmail(valor)) {
          nuevosErrores.email = 'Ingresa un email válido';
        } else {
          delete nuevosErrores.email;
        }
        break;

      case 'telefono':
        if (!valor) {
          nuevosErrores.telefono = 'El teléfono es obligatorio';
        } else if (valor.length !== 10) {
          nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos';
        } else if (!validarTelefono(valor)) {
          nuevosErrores.telefono = 'Número de teléfono no válido (debe empezar con 09, 02-07)';
        } else {
          delete nuevosErrores.telefono;
        }
        break;

      case 'password':
        if (!valor) {
          nuevosErrores.password = 'La contraseña es obligatoria';
        } else if (!validarPassword(valor)) {
          nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
        } else {
          delete nuevosErrores.password;
        }
        break;

      default:
        break;
    }

    setErrores(nuevosErrores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMostrarErrores(true);

    // Validar todos los campos
    Object.keys(formData).forEach(campo => {
      if (campo !== 'rol') {
        validarCampo(campo, formData[campo]);
      }
    });

    // Verificar si hay errores
    const tieneErrores = Object.keys(errores).length > 0;
    
    // Verificar campos vacíos
    const camposVacios = Object.entries(formData).some(([key, value]) => {
      if (key === 'rol') return false;
      return !value || value.trim() === '';
    });

    if (camposVacios || tieneErrores) {
      alert('Por favor corrige todos los errores antes de continuar');
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        name: formData.name.trim(),
        apellido: formData.apellido.trim(),
        cedula: formData.cedula,
        email: formData.email.trim(),
        telefono: formData.telefono,
        password: formData.password,
        rol: formData.rol,
      });
      
      alert(response.data.message || 'Usuario registrado exitosamente');
      
      if (onNavigate) {
        onNavigate('login');
      } else if (history) {
        history.push('/login');
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container'>
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        {/* Campo Nombre */}
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nombre (solo letras)"
          required
          style={{
            borderColor: mostrarErrores && errores.name ? '#e74c3c' : ''
          }}
        />
        {mostrarErrores && errores.name && (
          <div style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
            {errores.name}
          </div>
        )}

        {/* Campo Apellido */}
        <input 
          type="text" 
          name="apellido" 
          value={formData.apellido} 
          onChange={handleChange} 
          placeholder="Apellido (solo letras)" 
          required
          style={{
            borderColor: mostrarErrores && errores.apellido ? '#e74c3c' : ''
          }}
        />
        {mostrarErrores && errores.apellido && (
          <div style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
            {errores.apellido}
          </div>
        )}

        {/* Campo Cédula */}
        <input 
          type="text" 
          name="cedula" 
          value={formData.cedula} 
          onChange={handleChange} 
          placeholder="Cédula (10 dígitos)" 
          required
          maxLength="10"
          style={{
            borderColor: mostrarErrores && errores.cedula ? '#e74c3c' : ''
          }}
        />
        {mostrarErrores && errores.cedula && (
          <div style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '5px' }}>
            {errores.cedula}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginBottom: '10px' }}>
          {formData.cedula.length}/10 dígitos
        </div>

        {/* Campo Email */}
        <input 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          placeholder="Correo electrónico" 
          required
          style={{
            borderColor: mostrarErrores && errores.email ? '#e74c3c' : ''
          }}
        />
        {mostrarErrores && errores.email && (
          <div style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
            {errores.email}
          </div>
        )}

        {/* Campo Teléfono */}
        <input 
          type="tel" 
          name="telefono" 
          value={formData.telefono} 
          onChange={handleChange} 
          placeholder="Teléfono (10 dígitos: 09xxxxxxxx)" 
          required
          maxLength="10"
          style={{
            borderColor: mostrarErrores && errores.telefono ? '#e74c3c' : ''
          }}
        />
        {mostrarErrores && errores.telefono && (
          <div style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '5px' }}>
            {errores.telefono}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginBottom: '10px' }}>
          {formData.telefono.length}/10 dígitos
        </div>

        {/* Campo Contraseña */}
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Contraseña (mínimo 6 caracteres)"
          required
          style={{
            borderColor: mostrarErrores && errores.password ? '#e74c3c' : ''
          }}
        />
        {mostrarErrores && errores.password && (
          <div style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
            {errores.password}
          </div>
        )}
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
