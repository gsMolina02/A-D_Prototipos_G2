import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { solicitarCambioContrasena, cambiarContrasenaAPI } from '../services/api';
import '../App.css';

const Login = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [tokenRecuperacion, setTokenRecuperacion] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1);
  const [cuentaBloqueada, setCuentaBloqueada] = useState(false);
  const [emailBloqueado, setEmailBloqueado] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const { iniciarSesion } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (!formData.email || !formData.password) {
      setMensaje('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const result = await iniciarSesion(formData.email, formData.password);
      
      if (result.success) {
        setMensaje('');
      } else {
        if (result.bloqueado) {
          setCuentaBloqueada(true);
          setEmailBloqueado(result.email || formData.email);
          setMensaje('Cuenta bloqueada. Debe cambiar su contraseña para continuar.');
        } else {
          setMensaje(result.message || 'Error al iniciar sesión');
        }
      }
    } catch (error) {
      if (error.response?.data?.bloqueado) {
        setCuentaBloqueada(true);
        setEmailBloqueado(error.response?.data?.email || formData.email);
        setMensaje('Cuenta bloqueada por múltiples intentos fallidos.');
      } else {
        setMensaje(error.response?.data?.error || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarToken = async () => {
    if (!emailRecuperacion) {
      setMensaje('Ingrese su correo electrónico');
      return;
    }

    setLoading(true);
    try {
      const response = await solicitarCambioContrasena(emailRecuperacion);
      setTokenRecuperacion(response.data.token);
      setPasoRecuperacion(2);
      setMensaje('Token generado. Ingrese el token y su nueva contraseña.');
    } catch (error) {
      setMensaje(error.response?.data?.error || 'Error al solicitar cambio de contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarContrasena = async () => {
    if (!nuevaContrasena || !confirmarContrasena) {
      setMensaje('Complete todos los campos');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setMensaje('Las contraseñas no coinciden');
      return;
    }

    if (nuevaContrasena.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await cambiarContrasenaAPI(emailRecuperacion, tokenRecuperacion, nuevaContrasena);
      setMensaje('Contraseña cambiada exitosamente. Ahora puede iniciar sesión.');
      setMostrarRecuperacion(false);
      setCuentaBloqueada(false);
      setPasoRecuperacion(1);
      setEmailRecuperacion('');
      setTokenRecuperacion('');
      setNuevaContrasena('');
      setConfirmarContrasena('');
    } catch (error) {
      setMensaje(error.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const iniciarRecuperacion = (email = '') => {
    setMostrarRecuperacion(true);
    setEmailRecuperacion(email || formData.email);
    setPasoRecuperacion(1);
    setMensaje('');
  };

  const styles = {
    container: {
      maxWidth: '420px',
      margin: '40px auto',
      padding: '40px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px',
      textAlign: 'center'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '30px',
      textAlign: 'center'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      padding: '12px 16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    },
    btnPrimary: {
      padding: '14px',
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '10px'
    },
    btnSecondary: {
      padding: '12px',
      background: 'transparent',
      color: '#2563eb',
      border: '1px solid #2563eb',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: '#2563eb',
      fontSize: '14px',
      cursor: 'pointer',
      textDecoration: 'underline',
      marginTop: '10px'
    },
    backButton: {
      background: 'none',
      border: 'none',
      color: '#6b7280',
      fontSize: '14px',
      cursor: 'pointer',
      marginTop: '15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px'
    },
    mensaje: {
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      textAlign: 'center',
      marginBottom: '15px'
    },
    mensajeError: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    mensajeExito: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '20px 0',
      color: '#9ca3af',
      fontSize: '14px'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#e5e7eb'
    },
    tokenDisplay: {
      background: '#f3f4f6',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '15px',
      textAlign: 'center'
    },
    tokenCode: {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937',
      letterSpacing: '2px'
    },
    pasoIndicador: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '20px'
    },
    paso: {
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600'
    },
    pasoActivo: {
      background: '#2563eb',
      color: 'white'
    },
    pasoInactivo: {
      background: '#e5e7eb',
      color: '#9ca3af'
    }
  };

  // Vista de recuperacion de contraseña
  if (mostrarRecuperacion || cuentaBloqueada) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Cambiar Contraseña</h2>
        <p style={styles.subtitle}>
          {cuentaBloqueada 
            ? 'Su cuenta ha sido bloqueada. Debe cambiar su contraseña para desbloquearla.'
            : 'Ingrese su email para recibir un token de recuperación'}
        </p>

        <div style={styles.pasoIndicador}>
          <div style={{...styles.paso, ...(pasoRecuperacion >= 1 ? styles.pasoActivo : styles.pasoInactivo)}}>1</div>
          <div style={{...styles.paso, ...(pasoRecuperacion >= 2 ? styles.pasoActivo : styles.pasoInactivo)}}>2</div>
        </div>

        {mensaje && (
          <div style={{
            ...styles.mensaje,
            ...(mensaje.includes('exitosamente') ? styles.mensajeExito : styles.mensajeError)
          }}>
            {mensaje}
          </div>
        )}

        {pasoRecuperacion === 1 && (
          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo Electrónico</label>
              <input
                type="email"
                style={styles.input}
                value={emailRecuperacion || emailBloqueado}
                onChange={(e) => setEmailRecuperacion(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <button 
              style={{...styles.btnPrimary, opacity: loading ? 0.7 : 1}}
              onClick={handleSolicitarToken}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Solicitar Token'}
            </button>
          </div>
        )}

        {pasoRecuperacion === 2 && (
          <div style={styles.form}>
            <div style={styles.tokenDisplay}>
              <p style={{margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px'}}>Su token de recuperación:</p>
              <span style={styles.tokenCode}>{tokenRecuperacion}</span>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Token de Verificación</label>
              <input
                type="text"
                style={styles.input}
                value={tokenRecuperacion}
                onChange={(e) => setTokenRecuperacion(e.target.value)}
                placeholder="Ingrese el token"
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nueva Contraseña</label>
              <input
                type="password"
                style={styles.input}
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirmar Contraseña</label>
              <input
                type="password"
                style={styles.input}
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                placeholder="Repita la contraseña"
              />
            </div>
            
            <button 
              style={{...styles.btnPrimary, opacity: loading ? 0.7 : 1}}
              onClick={handleCambiarContrasena}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        )}

        {!cuentaBloqueada && (
          <button 
            style={styles.backButton}
            onClick={() => {
              setMostrarRecuperacion(false);
              setPasoRecuperacion(1);
              setMensaje('');
            }}
          >
            Volver al inicio de sesión
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Iniciar Sesión</h2>
      <p style={styles.subtitle}>Ingrese sus credenciales para acceder al sistema</p>

      {mensaje && (
        <div style={{
          ...styles.mensaje,
          ...(mensaje.includes('exitosamente') ? styles.mensajeExito : styles.mensajeError)
        }}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Correo Electrónico</label>
          <input
            type="email"
            name="email"
            style={styles.input}
            value={formData.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Contraseña</label>
          <input
            type="password"
            name="password"
            style={styles.input}
            value={formData.password}
            onChange={handleChange}
            placeholder="Su contraseña"
            required
          />
        </div>
        
        <button 
          type="submit" 
          style={{...styles.btnPrimary, opacity: loading ? 0.7 : 1}}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <button 
        style={styles.linkButton}
        onClick={() => iniciarRecuperacion()}
      >
        Olvidé mi contraseña
      </button>

      <div style={styles.divider}>
        <span style={styles.dividerLine}></span>
        <span style={{padding: '0 15px'}}>o</span>
        <span style={styles.dividerLine}></span>
      </div>
      
      {onNavigate && (
        <>
          <button 
            onClick={() => onNavigate('register')}
            style={styles.btnSecondary}
          >
            Crear una cuenta nueva
          </button>
          <button 
            onClick={() => onNavigate('landing')}
            style={styles.backButton}
          >
            Volver al inicio
          </button>
        </>
      )}
    </div>
  );
};

export default Login;