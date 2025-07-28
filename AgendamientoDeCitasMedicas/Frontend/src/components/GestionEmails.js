import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { 
  enviarEmailConfirmacion,
  enviarEmailCancelacion, 
  enviarEmailReprogramacion,
  enviarRecordatoriosMasivos,
  enviarEmailPersonalizado,
  obtenerEstadisticasEmail
} from '../services/api';
import './styles/GestionEmails.css';

const GestionEmails = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  
  // Estados para diferentes formularios
  const [citaId, setCitaId] = useState('');
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoHorario, setNuevoHorario] = useState('');
  const [motivoReprogramacion, setMotivoReprogramacion] = useState('');
  const [emailPersonalizado, setEmailPersonalizado] = useState({
    destinatario: '',
    asunto: '',
    mensaje: ''
  });

  // Cargar estadísticas al montar el componente (ANTES del return)
  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const response = await obtenerEstadisticasEmail();
        setEstadisticas(response.data.estadisticas);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };
    cargarEstadisticas();
  }, []);

  // Solo mostrar a administradores/doctores
  if (!user || (user.rol !== 'doctor' && user.rol !== 'admin')) {
    return <div>No tienes permisos para acceder a esta sección.</div>;
  }

  const handleEnviarRecordatorios = async () => {
    setLoading(true);
    try {
      const response = await enviarRecordatoriosMasivos();
      setResultado({
        tipo: 'success',
        mensaje: response.data.message,
        detalles: `Total: ${response.data.total}, Enviados: ${response.data.enviados}${response.data.errores > 0 ? `, Errores: ${response.data.errores}` : ''}`
      });
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: 'Error al enviar recordatorios',
        detalles: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarConfirmacion = async (e) => {
    e.preventDefault();
    if (!citaId) return;
    
    setLoading(true);
    try {
      const response = await enviarEmailConfirmacion(citaId);
      setResultado({
        tipo: 'success',
        mensaje: 'Email de confirmación enviado',
        detalles: response.data.message
      });
      setCitaId('');
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: 'Error al enviar confirmación',
        detalles: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarCita = async (e) => {
    e.preventDefault();
    if (!citaId) return;
    
    setLoading(true);
    try {
      const response = await enviarEmailCancelacion(citaId, motivoCancelacion);
      setResultado({
        tipo: 'success',
        mensaje: 'Email de cancelación enviado',
        detalles: response.data.message
      });
      setCitaId('');
      setMotivoCancelacion('');
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: 'Error al enviar email de cancelación',
        detalles: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReprogramarCita = async (e) => {
    e.preventDefault();
    if (!citaId || !nuevaFecha || !nuevoHorario) return;
    
    setLoading(true);
    try {
      const response = await enviarEmailReprogramacion(citaId, nuevaFecha, nuevoHorario, motivoReprogramacion);
      setResultado({
        tipo: 'success',
        mensaje: 'Email de reprogramación enviado',
        detalles: response.data.message
      });
      setCitaId('');
      setNuevaFecha('');
      setNuevoHorario('');
      setMotivoReprogramacion('');
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: 'Error al enviar email de reprogramación',
        detalles: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPersonalizado = async (e) => {
    e.preventDefault();
    if (!emailPersonalizado.destinatario || !emailPersonalizado.asunto || !emailPersonalizado.mensaje) return;
    
    setLoading(true);
    try {
      const response = await enviarEmailPersonalizado(
        emailPersonalizado.destinatario,
        emailPersonalizado.asunto,
        emailPersonalizado.mensaje
      );
      setResultado({
        tipo: 'success',
        mensaje: 'Email personalizado enviado',
        detalles: response.data.message
      });
      setEmailPersonalizado({ destinatario: '', asunto: '', mensaje: '' });
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: 'Error al enviar email personalizado',
        detalles: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gestion-emails">
      <div className="gestion-emails-header">
        <h2>Gestión de Notificaciones por Email</h2>
        <p>Administra las notificaciones automáticas por correo electrónico</p>
      </div>

      <div className="gestion-emails-grid">
        {/* Enviar Recordatorios */}
        <div className="email-card">
          <div className="email-card-header">
            <div className="email-card-icon recordatorios">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9H21ZM19 21H5V3H13V9H19V21Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Recordatorios Automáticos</h3>
          </div>
          <p>Envía recordatorios por email a todos los pacientes con citas para mañana</p>
          <button 
            className="btn-email primary"
            onClick={handleEnviarRecordatorios}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Recordatorios'}
          </button>
        </div>

        {/* Enviar Email de Confirmación */}
        <div className="email-card">
          <div className="email-card-header">
            <div className="email-card-icon atendida">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Enviar Confirmación</h3>
          </div>
          <form onSubmit={handleEnviarConfirmacion}>
            <div className="form-group">
              <label>ID de la Cita</label>
              <input
                type="number"
                value={citaId}
                onChange={(e) => setCitaId(e.target.value)}
                placeholder="Ingrese el ID de la cita"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn-email success"
              disabled={loading || !citaId}
            >
              {loading ? 'Procesando...' : 'Enviar Confirmación'}
            </button>
          </form>
        </div>

        {/* Cancelar Cita */}
        <div className="email-card">
          <div className="email-card-header">
            <div className="email-card-icon cancelada">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Cancelar Cita</h3>
          </div>
          <form onSubmit={handleCancelarCita}>
            <div className="form-group">
              <label>ID de la Cita</label>
              <input
                type="number"
                value={citaId}
                onChange={(e) => setCitaId(e.target.value)}
                placeholder="Ingrese el ID de la cita"
                required
              />
            </div>
            <div className="form-group">
              <label>Motivo de Cancelación</label>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ingrese el motivo de la cancelación"
                rows="3"
              />
            </div>
            <button 
              type="submit" 
              className="btn-email danger"
              disabled={loading || !citaId}
            >
              {loading ? 'Procesando...' : 'Cancelar Cita'}
            </button>
          </form>
        </div>

        {/* Reprogramar Cita */}
        <div className="email-card">
          <div className="email-card-header">
            <div className="email-card-icon reprogramada">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 6V9L16 5L12 1V4C7.58 4 4 7.58 4 12S7.58 20 12 20 20 16.42 20 12H18C18 15.31 15.31 18 12 18S6 15.31 6 12 8.69 6 12 6Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Reprogramar Cita</h3>
          </div>
          <form onSubmit={handleReprogramarCita}>
            <div className="form-group">
              <label>ID de la Cita</label>
              <input
                type="number"
                value={citaId}
                onChange={(e) => setCitaId(e.target.value)}
                placeholder="Ingrese el ID de la cita"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nueva Fecha</label>
                <input
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nueva Hora</label>
                <input
                  type="time"
                  value={nuevoHorario}
                  onChange={(e) => setNuevoHorario(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Motivo de Reprogramación</label>
              <textarea
                value={motivoReprogramacion}
                onChange={(e) => setMotivoReprogramacion(e.target.value)}
                placeholder="Ingrese el motivo de la reprogramación"
                rows="3"
              />
            </div>
            <button 
              type="submit" 
              className="btn-email warning"
              disabled={loading || !citaId || !nuevaFecha || !nuevoHorario}
            >
              {loading ? 'Procesando...' : 'Reprogramar Cita'}
            </button>
          </form>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`resultado-email ${resultado.tipo}`}>
          <div className="resultado-header">
            <strong>{resultado.mensaje}</strong>
          </div>
          {resultado.detalles && (
            <div className="resultado-detalles">
              {resultado.detalles}
            </div>
          )}
          <button 
            className="btn-cerrar"
            onClick={() => setResultado(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default GestionEmails;
