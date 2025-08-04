import React, { useState, useEffect } from 'react';
import '../components/styles/GestionEmails.css'; // Reutilizamos los mismos estilos

const GestionWhatsApp = () => {
  const [selectedAction, setSelectedAction] = useState('confirmacion');
  const [formData, setFormData] = useState({
    telefono: '',
    pacienteNombre: '',
    doctorNombre: '',
    fecha: '',
    horario: '',
    especialidad: 'Consulta General',
    motivo: '',
    mensaje: '',
    fechaAnterior: '',
    horarioAnterior: '',
    nuevaFecha: '',
    nuevoHorario: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);

  // Cargar estadísticas al iniciar
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/whatsapp/estadisticas');
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      // Error silencioso al cargar estadísticas
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleActionChange = (action) => {
    setSelectedAction(action);
    setFormData({
      telefono: '',
      pacienteNombre: '',
      doctorNombre: '',
      fecha: '',
      horario: '',
      especialidad: 'Consulta General',
      motivo: '',
      mensaje: '',
      fechaAnterior: '',
      horarioAnterior: '',
      nuevaFecha: '',
      nuevoHorario: ''
    });
    setResponseMessage('');
  };

  const enviarWhatsApp = async () => {
    if (!formData.telefono) {
      setResponseMessage('❌ Error: El número de teléfono es obligatorio');
      return;
    }

    setIsLoading(true);
    setResponseMessage('');

    try {
      let endpoint = '';
      let body = {};

      switch (selectedAction) {
        case 'confirmacion':
          endpoint = 'http://localhost:3000/api/whatsapp/confirmacion';
          body = {
            telefono: formData.telefono,
            datosWhatsApp: {
              pacienteNombre: formData.pacienteNombre,
              doctorNombre: formData.doctorNombre,
              fecha: formData.fecha,
              horario: formData.horario,
              especialidad: formData.especialidad
            }
          };
          break;
        case 'cancelacion':
          endpoint = 'http://localhost:3000/api/whatsapp/cancelacion';
          body = {
            telefono: formData.telefono,
            datosWhatsApp: {
              pacienteNombre: formData.pacienteNombre,
              doctorNombre: formData.doctorNombre,
              fecha: formData.fecha,
              horario: formData.horario,
              motivo: formData.motivo
            }
          };
          break;
        case 'reprogramacion':
          endpoint = 'http://localhost:3000/api/whatsapp/reprogramacion';
          body = {
            telefono: formData.telefono,
            datosWhatsApp: {
              pacienteNombre: formData.pacienteNombre,
              doctorNombre: formData.doctorNombre,
              fechaAnterior: formData.fechaAnterior,
              horarioAnterior: formData.horarioAnterior,
              nuevaFecha: formData.nuevaFecha,
              nuevoHorario: formData.nuevoHorario,
              motivo: formData.motivo
            }
          };
          break;
        case 'personalizado':
          endpoint = 'http://localhost:3000/api/whatsapp/personalizado';
          body = {
            telefono: formData.telefono,
            mensaje: formData.mensaje
          };
          break;
        case 'recordatorios':
          endpoint = 'http://localhost:3000/api/whatsapp/recordatorios-masivos';
          body = {
            fecha: formData.fecha
          };
          break;
        default:
          throw new Error('Acción no válida');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage(`✅ ${data.message}`);
        // Recargar estadísticas después de enviar
        cargarEstadisticas();
      } else {
        setResponseMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResponseMessage(`❌ Error de red: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = () => {
    const commonFields = (
      <>
        <div className="form-group">
          <label htmlFor="telefono">Número de WhatsApp *</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            placeholder="Ej: +573001234567"
            required
          />
          <small>Formato: +código_país + número (Ej: +573001234567)</small>
        </div>
      </>
    );

    switch (selectedAction) {
      case 'confirmacion':
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label htmlFor="pacienteNombre">Nombre del Paciente *</label>
              <input
                type="text"
                id="pacienteNombre"
                name="pacienteNombre"
                value={formData.pacienteNombre}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="doctorNombre">Nombre del Doctor *</label>
              <input
                type="text"
                id="doctorNombre"
                name="doctorNombre"
                value={formData.doctorNombre}
                onChange={handleInputChange}
                placeholder="Ej: Dr. María García"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fecha">Fecha de la Cita *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="horario">Horario *</label>
              <input
                type="time"
                id="horario"
                name="horario"
                value={formData.horario}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="especialidad">Especialidad</label>
              <input
                type="text"
                id="especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleInputChange}
                placeholder="Ej: Cardiología"
              />
            </div>
          </>
        );

      case 'cancelacion':
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label htmlFor="pacienteNombre">Nombre del Paciente *</label>
              <input
                type="text"
                id="pacienteNombre"
                name="pacienteNombre"
                value={formData.pacienteNombre}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="doctorNombre">Nombre del Doctor *</label>
              <input
                type="text"
                id="doctorNombre"
                name="doctorNombre"
                value={formData.doctorNombre}
                onChange={handleInputChange}
                placeholder="Ej: Dr. María García"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fecha">Fecha de la Cita Cancelada *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="horario">Horario *</label>
              <input
                type="time"
                id="horario"
                name="horario"
                value={formData.horario}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="motivo">Motivo de Cancelación</label>
              <textarea
                id="motivo"
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                placeholder="Ej: Emergencia médica"
                rows="3"
              />
            </div>
          </>
        );

      case 'reprogramacion':
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label htmlFor="pacienteNombre">Nombre del Paciente *</label>
              <input
                type="text"
                id="pacienteNombre"
                name="pacienteNombre"
                value={formData.pacienteNombre}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="doctorNombre">Nombre del Doctor *</label>
              <input
                type="text"
                id="doctorNombre"
                name="doctorNombre"
                value={formData.doctorNombre}
                onChange={handleInputChange}
                placeholder="Ej: Dr. María García"
                required
              />
            </div>
            <h4>Fecha y Horario Anterior</h4>
            <div className="form-group">
              <label htmlFor="fechaAnterior">Fecha Anterior *</label>
              <input
                type="date"
                id="fechaAnterior"
                name="fechaAnterior"
                value={formData.fechaAnterior}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="horarioAnterior">Horario Anterior *</label>
              <input
                type="time"
                id="horarioAnterior"
                name="horarioAnterior"
                value={formData.horarioAnterior}
                onChange={handleInputChange}
                required
              />
            </div>
            <h4>Nueva Fecha y Horario</h4>
            <div className="form-group">
              <label htmlFor="nuevaFecha">Nueva Fecha *</label>
              <input
                type="date"
                id="nuevaFecha"
                name="nuevaFecha"
                value={formData.nuevaFecha}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="nuevoHorario">Nuevo Horario *</label>
              <input
                type="time"
                id="nuevoHorario"
                name="nuevoHorario"
                value={formData.nuevoHorario}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="motivo">Motivo de Reprogramación</label>
              <textarea
                id="motivo"
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                placeholder="Ej: Disponibilidad del doctor"
                rows="3"
              />
            </div>
          </>
        );

      case 'personalizado':
        return (
          <>
            {commonFields}
            <div className="form-group">
              <label htmlFor="mensaje">Mensaje Personalizado *</label>
              <textarea
                id="mensaje"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleInputChange}
                placeholder="Escriba su mensaje personalizado aquí..."
                rows="5"
                required
              />
            </div>
          </>
        );

      case 'recordatorios':
        return (
          <div className="form-group">
            <label htmlFor="fecha">Fecha de las Citas *</label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              required
            />
            <small>Se enviará recordatorio a todos los pacientes con citas en esta fecha</small>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="gestion-container">
      <h2>📱 Gestión de WhatsApp</h2>
      <p>Sistema de notificaciones por WhatsApp para citas médicas</p>

      {estadisticas && (
        <div className="estadisticas-container">
          <h3>📊 Estadísticas de WhatsApp</h3>
          <div className="estadisticas-grid">
            <div className="stat-card">
              <span className="stat-number">{estadisticas.totalEnviados}</span>
              <span className="stat-label">Total Enviados</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{estadisticas.exitosos}</span>
              <span className="stat-label">Exitosos</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{estadisticas.fallidos}</span>
              <span className="stat-label">Fallidos</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{estadisticas.tasaExito}%</span>
              <span className="stat-label">Tasa de Éxito</span>
            </div>
          </div>
        </div>
      )}

      <div className="action-selector">
        <h3>Seleccionar Acción</h3>
        <div className="action-buttons">
          <button
            className={selectedAction === 'confirmacion' ? 'active' : ''}
            onClick={() => handleActionChange('confirmacion')}
          >
            ✅ Confirmación de Cita
          </button>
          <button
            className={selectedAction === 'cancelacion' ? 'active' : ''}
            onClick={() => handleActionChange('cancelacion')}
          >
            ❌ Cancelación de Cita
          </button>
          <button
            className={selectedAction === 'reprogramacion' ? 'active' : ''}
            onClick={() => handleActionChange('reprogramacion')}
          >
            📅 Reprogramación de Cita
          </button>
          <button
            className={selectedAction === 'personalizado' ? 'active' : ''}
            onClick={() => handleActionChange('personalizado')}
          >
            ✍️ Mensaje Personalizado
          </button>
          <button
            className={selectedAction === 'recordatorios' ? 'active' : ''}
            onClick={() => handleActionChange('recordatorios')}
          >
            📢 Recordatorios Masivos
          </button>
        </div>
      </div>

      <div className="whatsapp-form">
        <h3>
          {selectedAction === 'confirmacion' && '✅ Enviar Confirmación de Cita'}
          {selectedAction === 'cancelacion' && '❌ Enviar Cancelación de Cita'}
          {selectedAction === 'reprogramacion' && '📅 Enviar Reprogramación de Cita'}
          {selectedAction === 'personalizado' && '✍️ Enviar Mensaje Personalizado'}
          {selectedAction === 'recordatorios' && '📢 Enviar Recordatorios Masivos'}
        </h3>

        {renderFormFields()}

        <button
          className="send-button"
          onClick={enviarWhatsApp}
          disabled={isLoading}
        >
          {isLoading ? '📱 Enviando WhatsApp...' : '📱 Enviar WhatsApp'}
        </button>

        {responseMessage && (
          <div className={`response-message ${responseMessage.includes('✅') ? 'success' : 'error'}`}>
            {responseMessage}
          </div>
        )}
      </div>

      <div className="help-section">
        <h3>ℹ️ Información del Sistema</h3>
        <ul>
          <li><strong>Formato Internacional:</strong> Use el formato +código_país + número</li>
          <li><strong>Números Válidos:</strong> Solo se pueden enviar mensajes a números verificados</li>
          <li><strong>Estado de Mensajes:</strong> Se confirmará el envío exitoso de cada mensaje</li>
        </ul>
      </div>
    </div>
  );
};

export default GestionWhatsApp;
