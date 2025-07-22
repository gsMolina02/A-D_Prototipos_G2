import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ListaCitas = () => {
  const { usuarioActual, obtenerCitasPaciente, obtenerCitasDoctor, cancelarCita, reprogramarCita, cargarTodosLosHorarios } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormularioReprogramar, setMostrarFormularioReprogramar] = useState(null);
  const [formReprogramar, setFormReprogramar] = useState({
    nuevo_dia: '',
    nuevo_horario: '',
    motivo: ''
  });
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  useEffect(() => {
    const cargarCitas = async () => {
      if (!usuarioActual) return;

      setLoading(true);
      try {
        let citasData = [];
        if (usuarioActual.rol === 'paciente') {
          citasData = await obtenerCitasPaciente(usuarioActual.id);
        } else if (usuarioActual.rol === 'doctor') {
          citasData = await obtenerCitasDoctor(usuarioActual.id);
        }
        setCitas(citasData);
      } catch (error) {
        console.error('Error al cargar citas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarCitas();
  }, [usuarioActual]);

  if (!usuarioActual) {
    return <p>No hay usuario autenticado.</p>;
  }

  if (loading) {
    return <p>Cargando citas...</p>;
  }

  if (citas.length === 0) {
    return <p>No tienes citas agendadas.</p>;
  }

  const handleCancelar = async (citaId) => {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (!motivo) return;

    const result = await cancelarCita(citaId, motivo);
    if (result.success) {
      // Recargar citas
      let citasData = [];
      if (usuarioActual.rol === 'paciente') {
        citasData = await obtenerCitasPaciente(usuarioActual.id);
      } else if (usuarioActual.rol === 'doctor') {
        citasData = await obtenerCitasDoctor(usuarioActual.id);
      }
      setCitas(citasData);
    } else {
      alert(result.message);
    }
  };

  const handleReprogramar = async (citaId) => {
    // VALIDACIÓN EN FRONTEND - Campos requeridos
    if (!formReprogramar.nuevo_dia || !formReprogramar.nuevo_horario) {
      alert('Error: Por favor, complete todos los campos requeridos (fecha y horario)');
      return;
    }

    // VALIDACIÓN EN FRONTEND - Fecha no puede ser en el pasado
    const fechaActual = new Date();
    const fechaSeleccionada = new Date(`${formReprogramar.nuevo_dia}T${formReprogramar.nuevo_horario}`);
    
    if (fechaSeleccionada <= fechaActual) {
      alert('Error: No se puede reprogramar para una fecha y hora pasada');
      return;
    }

    // VALIDACIÓN EN FRONTEND - Fecha no muy lejana (3 meses máximo)
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 3);
    
    if (fechaSeleccionada > fechaLimite) {
      alert('Error: La fecha seleccionada es muy lejana. Máximo 3 meses en el futuro');
      return;
    }

    // VALIDACIÓN EN FRONTEND - Confirmación del usuario
    const cita = citas.find(c => c.id === citaId);
    const fechaAnterior = `${cita.dia} ${cita.horario}`;
    const fechaNueva = `${formReprogramar.nuevo_dia} ${formReprogramar.nuevo_horario}`;
    
    const confirmacion = window.confirm(`
CONFIRMACIÓN DE REPROGRAMACIÓN

¿Está seguro de reprogramar la cita?

Fecha anterior: ${fechaAnterior}
Fecha nueva: ${fechaNueva}
Doctor: ${cita.doctor_name || 'Dr. ' + cita.doctor_apellido}
Especialidad: ${cita.especialidad || 'Consulta General'}
${formReprogramar.motivo ? `Motivo: ${formReprogramar.motivo}` : ''}

Esta acción no se puede deshacer.
    `);

    if (!confirmacion) return;

    const result = await reprogramarCita(citaId, formReprogramar);
    if (result.success) {
      // Recargar citas
      let citasData = [];
      if (usuarioActual.rol === 'paciente') {
        citasData = await obtenerCitasPaciente(usuarioActual.id);
      } else if (usuarioActual.rol === 'doctor') {
        citasData = await obtenerCitasDoctor(usuarioActual.id);
      }
      setCitas(citasData);
      setMostrarFormularioReprogramar(null);
      setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
      alert('Cita reprogramada exitosamente');
    } else {
      // Mostrar error específico del backend
      alert(`Error al reprogramar: ${result.message}`);
    }
  };

  const abrirFormularioReprogramar = (citaId) => {
    setMostrarFormularioReprogramar(citaId);
    setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
    setHorarioSeleccionado(null);
    setHorariosDisponibles([]);
  };

  const cerrarFormularioReprogramar = () => {
    setMostrarFormularioReprogramar(null);
    setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
    setHorarioSeleccionado(null);
    setHorariosDisponibles([]);
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormReprogramar(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambia la fecha, cargar horarios disponibles para esa fecha
    if (name === 'nuevo_dia' && value) {
      await cargarHorariosDisponibles(value);
    }
  };

  const cargarHorariosDisponibles = async (fecha) => {
    try {
      const todosLosHorarios = await cargarTodosLosHorarios();
      const nombreDia = obtenerNombreDiaDesdeFormato(fecha);
      
      // Filtrar horarios para el día seleccionado
      const horariosDelDia = todosLosHorarios.filter(h => h.dia === nombreDia);
      
      if (horariosDelDia.length > 0) {
        setHorarioSeleccionado(horariosDelDia[0]);
        const slots = generarSlotsDeHorario(horariosDelDia[0]);
        setHorariosDisponibles(slots);
      } else {
        setHorariosDisponibles([]);
        setHorarioSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      setHorariosDisponibles([]);
    }
  };

  const obtenerNombreDiaDesdeFormato = (fecha) => {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(fecha);
    return diasSemana[date.getDay()];
  };

  const generarSlotsDeHorario = (horario) => {
    const slots = [];
    const horaInicio = horario.hora_inicio.substring(0, 5);
    const horaFin = horario.hora_fin.substring(0, 5);
    const duracionCita = horario.duracion_cita || 30;
    const intervalo = horario.intervalo || 0;

    let horaActual = new Date(`1970-01-01T${horaInicio}:00`);
    const horaLimite = new Date(`1970-01-01T${horaFin}:00`);

    while (horaActual < horaLimite) {
      const horaSlot = horaActual.toTimeString().slice(0, 5);
      slots.push(horaSlot);
      
      // Agregar duración + intervalo
      horaActual.setMinutes(horaActual.getMinutes() + duracionCita + intervalo);
    }

    return slots;
  };

  // Función para validar si una cita puede ser reprogramada
  const puedeReprogramarse = (cita) => {
    if (cita.estado === 'cancelada') return { puede: false, razon: 'Cita cancelada' };
    
    const fechaYHoraCita = new Date(`${cita.dia}T${cita.horario}`);
    const fechaActual = new Date();
    
    if (fechaYHoraCita <= fechaActual) {
      return { puede: false, razon: 'Cita ya pasada' };
    }
    
    return { puede: true, razon: '' };
  };

  // Nueva función para marcar como atendida
  const handleMarcarComoAtendida = async (citaId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/citasreportes/${citaId}/atendida`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'atendida' })
      });

      if (!response.ok) {
        throw new Error('No se pudo marcar la cita como atendida');
      }

      // Recargar citas después de actualizar
      let citasData = [];
      if (usuarioActual.rol === 'paciente') {
        citasData = await obtenerCitasPaciente(usuarioActual.id);
      } else if (usuarioActual.rol === 'doctor') {
        citasData = await obtenerCitasDoctor(usuarioActual.id);
      }
      setCitas(citasData);

      alert('Cita marcada como atendida');
    } catch (error) {
      alert('Error al marcar la cita como atendida');
      console.error(error);
    }
  };

  return (
    <div>
      <h3>Tus citas agendadas</h3>
      <ul>
        {citas.map(cita => (
          <li key={cita.id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <strong>Día:</strong> {cita.dia} <br />
            <strong>Horario:</strong> {cita.horario} <br />
            <strong>Estado:</strong> {cita.estado}
            {cita.estado === 'cancelada' && cita.motivo_cancelacion && (
              <> (Motivo: {cita.motivo_cancelacion})</>
            )}
            <br />
            {usuarioActual.rol === 'paciente' ? (
              <>
                <strong>Doctor:</strong> {cita.doctor_name} {cita.doctor_apellido} <br />
              </>
            ) : (
              <>
                <strong>Paciente:</strong> {cita.paciente_name} {cita.paciente_apellido} <br />
              </>
            )}
            <strong>Especialidad:</strong> {cita.especialidad || 'Consulta General'} <br />
            
            {cita.estado !== 'cancelada' && (
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => abrirFormularioReprogramar(cita.id)}
                  style={{ 
                    marginRight: '10px', 
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: cita.estado === 'atendida' ? 'not-allowed' : 'pointer',
                    opacity: cita.estado === 'atendida' ? 0.5 : 1
                  }}
                  disabled={cita.estado === 'atendida'}
                >
                  Reprogramar
                </button>
                {usuarioActual.rol === 'doctor' && (
                  <button 
                    onClick={() => handleCancelar(cita.id)}
                    style={{ 
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar cita
                  </button>
                )}
              </div>
            )}

            {mostrarFormularioReprogramar === cita.id && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '5px'
              }}>
                <h4>Reprogramar Cita</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="nuevo_dia">Nueva Fecha:</label>
                  <input
                    type="date"
                    id="nuevo_dia"
                    name="nuevo_dia"
                    value={formReprogramar.nuevo_dia}
                    onChange={handleInputChange}
                    style={{
                      marginLeft: '10px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      width: '150px'
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    max={(() => {
                      const maxDate = new Date();
                      maxDate.setMonth(maxDate.getMonth() + 3);
                      return maxDate.toISOString().split('T')[0];
                    })()}
                  />
                  {formReprogramar.nuevo_dia && obtenerNombreDiaDesdeFormato(formReprogramar.nuevo_dia) && (
                    <small style={{ marginLeft: '10px', color: '#666' }}>
                      {obtenerNombreDiaDesdeFormato(formReprogramar.nuevo_dia)}
                    </small>
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="nuevo_horario">Nueva Hora:</label>
                  <select
                    id="nuevo_horario"
                    name="nuevo_horario"
                    value={formReprogramar.nuevo_horario}
                    onChange={handleInputChange}
                    style={{ 
                      marginLeft: '10px', 
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      width: '120px',
                      backgroundColor: !formReprogramar.nuevo_dia ? '#f5f5f5' : '#fff'
                    }}
                  >
                    <option value="">
                      {!formReprogramar.nuevo_dia ? 'Seleccione fecha primero' : 'Seleccionar hora'}
                    </option>
                    {horariosDisponibles.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                  {formReprogramar.nuevo_dia && horariosDisponibles.length === 0 && (
                    <small style={{ marginLeft: '10px', color: 'red' }}>
                      No hay horarios disponibles para este día
                    </small>
                  )}
                  {horarioSeleccionado && (
                    <div style={{ marginLeft: '10px', marginTop: '5px', fontSize: '12px', color: '#666' }}>
                      <strong>Horario del doctor:</strong> {horarioSeleccionado.hora_inicio?.substring(0, 5)} - {horarioSeleccionado.hora_fin?.substring(0, 5)} 
                      | <strong>Duración:</strong> {horarioSeleccionado.duracion_cita} min
                      | <strong>Dr.</strong> {horarioSeleccionado.doctor_name} {horarioSeleccionado.doctor_apellido}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="motivo">Motivo (opcional):</label>
                  <textarea
                    id="motivo"
                    name="motivo"
                    value={formReprogramar.motivo}
                    onChange={handleInputChange}
                    placeholder="Ingrese el motivo de la reprogramación..."
                    style={{
                      marginLeft: '10px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      width: '250px',
                      height: '60px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <button
                    onClick={() => handleReprogramar(cita.id)}
                    style={{
                      marginRight: '10px',
                      padding: '8px 15px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={cerrarFormularioReprogramar}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
      </ul>
    </div>
  );
};

export default ListaCitas;