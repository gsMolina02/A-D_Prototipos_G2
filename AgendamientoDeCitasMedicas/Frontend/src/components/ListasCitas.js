import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ListaCitas = () => {
  const { 
    usuarioActual, 
    obtenerCitasPaciente, 
    obtenerCitasDoctor, 
    cancelarCita, 
    reprogramarCita,
    cargarTodasLasCitas,
    cargarHorariosPorDoctor,
    todasLasCitas
  } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormularioReprogramar, setMostrarFormularioReprogramar] = useState(null);
  const [formReprogramar, setFormReprogramar] = useState({
    nuevo_dia: '',
    nuevo_horario: '',
    motivo: ''
  });
  
  // Estados para validación de fecha y horarios
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [diaSeleccionado, setDiaSeleccionado] = useState('');
  const [fechaEsValida, setFechaEsValida] = useState(false);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [citaActualParaReprogramar, setCitaActualParaReprogramar] = useState(null);

  
  
  // Función para cargar las citas (extraída para reutilización)
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
      console.log('📋 Citas recargadas en ListasCitas:', citasData.length);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    cargarCitas();
  }, [usuarioActual?.id, usuarioActual?.rol]); // Solo depender de id y rol del usuario

  // Funciones utilitarias para validación y horarios
  const obtenerNombreDia = (fecha) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(fecha + 'T00:00:00');
    return dias[date.getDay()];
  };

  const validarFecha = (fecha) => {
    if (!fecha) return false;
    
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    
    const fechaSeleccionada = new Date(fecha + 'T00:00:00');
    
    // No puede ser fecha pasada
    if (fechaSeleccionada < fechaActual) return false;
    
    // No puede ser más de 3 meses en el futuro
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 3);
    if (fechaSeleccionada > fechaLimite) return false;
    
    return true;
  };

  const obtenerHorariosDisponibles = async (fecha, doctorId, citaActualId) => {
    if (!fecha || !doctorId) return [];
    
    try {
      // Usar exactamente la misma lógica que el calendario laboral
      const dia = obtenerNombreDia(fecha);
      const horariosDoctor = await cargarHorariosPorDoctor(doctorId);
      const horarioDelDia = horariosDoctor.find(h => h.dia === dia);
      
      if (!horarioDelDia) return [];
      
      // Importar la función del calendario que ya genera los horarios correctamente
      // Esta es la misma función que usa CalendarioLaboral.js
      const generarHorariosCitas = (horario) => {
        const citas = [];
        
        let horaInicio = horario.hora_inicio || horario.horaInicio;
        let horaFin = horario.hora_fin || horario.horaFin;
        const duracionCita = horario.duracion_cita || horario.duracionCita;
        const intervalo = horario.intervalo;
        
        if (horaInicio && horaInicio.includes(':')) {
          horaInicio = horaInicio.substring(0, 5);
        }
        if (horaFin && horaFin.includes(':')) {
          horaFin = horaFin.substring(0, 5);
        }
        
        if (!horaInicio || !horaFin || !duracionCita || intervalo === undefined) {
          return [];
        }
        
        const inicio = new Date(`1970-01-01T${horaInicio}:00`);
        const fin = new Date(`1970-01-01T${horaFin}:00`);
        let actual = new Date(inicio);

        const duracion = typeof duracionCita === 'number' ? duracionCita : parseInt(duracionCita);
        const intervaloNum = typeof intervalo === 'number' ? intervalo : parseInt(intervalo);
        
        if (isNaN(duracion) || isNaN(intervaloNum) || duracion <= 0) {
          return [];
        }

        while (actual < fin) {
          const inicioCita = actual.toTimeString().slice(0, 5);
          actual.setMinutes(actual.getMinutes() + duracion);
          const finCita = actual.toTimeString().slice(0, 5);
          
          if (actual <= fin) {
            const citaStr = `${inicioCita} - ${finCita}`;
            citas.push(citaStr);
          } else {
            break;
          }
          
          actual.setMinutes(actual.getMinutes() + intervaloNum);
        }
        
        return citas;
      };
      
      // Generar todos los horarios posibles para ese día
      const todosLosHorarios = generarHorariosCitas(horarioDelDia);
      
      // Filtrar solo los que no están ocupados usando la misma lógica del calendario
      const horariosDisponibles = todosLosHorarios.filter(horario => {
        const estaOcupado = citas.some(cita => 
          cita.doctor_id === doctorId &&
          cita.dia === fecha &&
          cita.horario === horario &&
          cita.estado !== 'cancelada' &&
          cita.id !== citaActualId // Excluir la cita actual para reprogramación
        );
        
        return !estaOcupado;
      });
      
      return horariosDisponibles;
      
    } catch (error) {
      console.error('Error al obtener horarios disponibles:', error);
      return [];
    }
  };

  const handleFechaChange = async (fecha) => {
    setFechaSeleccionada(fecha);
    setFormReprogramar(prev => ({ ...prev, nuevo_dia: fecha, nuevo_horario: '' }));
    
    if (fecha) {
      const dia = obtenerNombreDia(fecha);
      setDiaSeleccionado(dia);
      
      const esValida = validarFecha(fecha);
      setFechaEsValida(esValida);
      
      if (esValida && citaActualParaReprogramar) {
        const horarios = await obtenerHorariosDisponibles(fecha, citaActualParaReprogramar.doctor_id, citaActualParaReprogramar.id);
        setHorariosDisponibles(horarios);
      } else {
        setHorariosDisponibles([]);
      }
    } else {
      setDiaSeleccionado('');
      setFechaEsValida(false);
      setHorariosDisponibles([]);
    }
  };

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
      // Actualizar el estado de la cita como cancelada
      setCitas(prevCitas => prevCitas.map(cita =>
        cita.id === citaId ? { ...cita, estado: 'cancelada', motivo_cancelacion: motivo } : cita
      ));
      alert(result.message); // El mensaje ya incluye "Calendario actualizado"
    } else {
      alert(result.message);
    }
  };

  const handleReprogramar = async (citaId) => {
    if (!formReprogramar.nuevo_dia || !formReprogramar.nuevo_horario) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }

    const result = await reprogramarCita(citaId, formReprogramar);
    if (result.success) {
      // Recargar citas locales
      let citasData = [];
      if (usuarioActual.rol === 'paciente') {
        citasData = await obtenerCitasPaciente(usuarioActual.id);
      } else if (usuarioActual.rol === 'doctor') {
        citasData = await obtenerCitasDoctor(usuarioActual.id);
      }
      setCitas(citasData);
      
      setMostrarFormularioReprogramar(null);
      setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
      alert(result.message); // El mensaje ya incluye "Calendario actualizado"
    } else {
      alert(result.message);
    }
  };

  const abrirFormularioReprogramar = (citaId) => {
    const cita = citas.find(c => c.id === citaId);
    setCitaActualParaReprogramar(cita);
    setMostrarFormularioReprogramar(citaId);
    setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
    
    // Limpiar estados de validación
    setFechaSeleccionada('');
    setDiaSeleccionado('');
    setFechaEsValida(false);
    setHorariosDisponibles([]);
  };

  const cerrarFormularioReprogramar = () => {
    setMostrarFormularioReprogramar(null);
    setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
    setCitaActualParaReprogramar(null);
    
    // Limpiar estados de validación
    setFechaSeleccionada('');
    setDiaSeleccionado('');
    setFechaEsValida(false);
    setHorariosDisponibles([]);
  };

  // Función para manejar la reprogramación
  const manejarReprogramacion = async () => {
    if (!fechaEsValida || !formReprogramar.nuevo_horario || !citaActualParaReprogramar) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const datosReprogramacion = {
        nuevo_dia: formReprogramar.nuevo_dia,
        nuevo_horario: formReprogramar.nuevo_horario,
        motivo: formReprogramar.motivo || ''
      };

      console.log('🔄 Reprogramando cita:', {
        citaId: citaActualParaReprogramar.id,
        desde: `${citaActualParaReprogramar.dia} ${citaActualParaReprogramar.horario}`,
        hacia: `${datosReprogramacion.nuevo_dia} ${datosReprogramacion.nuevo_horario}`
      });

      // Usar solo el ID de la cita (número) en lugar del objeto completo
      const resultado = await reprogramarCita(citaActualParaReprogramar.id, datosReprogramacion);
      
      if (resultado.success) {
        alert('Cita reprogramada exitosamente');
        cerrarFormularioReprogramar();
        
        // Recargar las citas para mostrar los cambios
        await cargarCitas();
        
        console.log('✅ Reprogramación completada exitosamente');
      } else {
        alert('Error al reprogramar la cita: ' + resultado.message);
      }
    } catch (error) {
      console.error('Error al reprogramar cita:', error);
      alert('Error al reprogramar la cita: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'nuevo_dia') {
      handleFechaChange(value);
    } else {
      setFormReprogramar(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMarcarComoAtendida = async (citaId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/citasreportes/${citaId}/atendida`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
        return;
      }

      const data = await response.json();
      alert(data.message);

      // Actualizar el estado de la cita como atendida
      setCitas(prevCitas => prevCitas.map(cita =>
        cita.id === citaId ? { ...cita, estado: 'atendida' } : cita
      ));
    } catch (error) {
      console.error('Error al marcar cita como atendida:', error);
      alert('Error al marcar cita como atendida.');
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

            {cita.estado === 'atendida' ? (
              <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Cita atendida</p>
            ) : cita.estado === 'cancelada' ? (
              <p style={{ color: 'red', fontWeight: 'bold' }}>❌ Cita cancelada (Motivo: {cita.motivo_cancelacion})</p>
            ) : (
              <div style={{ marginTop: '10px' }}>
                {usuarioActual.rol === 'doctor' && (
                  <button
                    onClick={() => abrirFormularioReprogramar(cita.id)}
                    style={{
                      marginRight: '10px',
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Reprogramar
                  </button>
                )}
                {usuarioActual.rol === 'doctor' && (
                  <>
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
                    <button
                      onClick={() => handleMarcarComoAtendida(cita.id)}
                      style={{
                        marginLeft: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Marcar como atendida
                    </button>
                  </>
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
                
                {/* Campo de fecha con validación visual */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="nuevo_dia" style={{ display: 'block', marginBottom: '5px' }}>
                    Nueva Fecha:
                  </label>
                  <input
                    type="date"
                    id="nuevo_dia"
                    name="nuevo_dia"
                    value={formReprogramar.nuevo_dia}
                    onChange={handleInputChange}
                    style={{
                      padding: '8px',
                      border: `2px solid ${
                        !fechaSeleccionada ? '#ccc' : 
                        fechaEsValida ? '#28a745' : '#dc3545'
                      }`,
                      borderRadius: '4px',
                      width: '180px',
                      backgroundColor: fechaSeleccionada ? (fechaEsValida ? '#f8fff8' : '#fff5f5') : 'white'
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  
                  {/* Mostrar día de la semana y estado de validación */}
                  {fechaSeleccionada && (
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                      <div style={{ 
                        color: fechaEsValida ? '#28a745' : '#dc3545',
                        fontWeight: 'bold' 
                      }}>
                        📅 {diaSeleccionado}
                        {fechaEsValida ? ' ✅ Fecha válida' : ' ❌ Fecha no válida'}
                      </div>
                      {!fechaEsValida && (
                        <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                          La fecha debe ser futura y dentro de 3 meses
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Campo de horario que solo aparece si la fecha es válida */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="nuevo_horario" style={{ display: 'block', marginBottom: '5px' }}>
                    Nueva Hora:
                  </label>
                  {fechaEsValida ? (
                    <>
                      <select
                        id="nuevo_horario"
                        name="nuevo_horario"
                        value={formReprogramar.nuevo_horario}
                        onChange={handleInputChange}
                        style={{
                          padding: '8px',
                          border: '2px solid #ccc',
                          borderRadius: '4px',
                          width: '150px'
                        }}
                        disabled={horariosDisponibles.length === 0}
                      >
                        <option value="">
                          {horariosDisponibles.length === 0 ? 'No hay horarios disponibles' : 'Seleccionar hora'}
                        </option>
                        {horariosDisponibles.map(horario => (
                          <option key={horario} value={horario}>
                            {horario}
                          </option>
                        ))}
                      </select>
                      {horariosDisponibles.length === 0 && fechaEsValida && (
                        <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                          No hay horarios disponibles para esta fecha
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ 
                      padding: '8px',
                      border: '2px solid #e9ecef',
                      borderRadius: '4px',
                      width: '150px',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                      Seleccione una fecha válida primero
                    </div>
                  )}
                </div>

                {/* Campo de motivo (opcional) */}
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="motivo" style={{ display: 'block', marginBottom: '5px' }}>
                    Motivo de reprogramación (opcional):
                  </label>
                  <textarea
                    id="motivo"
                    name="motivo"
                    value={formReprogramar.motivo}
                    onChange={handleInputChange}
                    placeholder="Ingrese el motivo de la reprogramación..."
                    style={{
                      padding: '8px',
                      border: '2px solid #ccc',
                      borderRadius: '4px',
                      width: '100%',
                      height: '60px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={manejarReprogramacion}
                    disabled={!fechaEsValida || !formReprogramar.nuevo_horario}
                    style={{
                      backgroundColor: (!fechaEsValida || !formReprogramar.nuevo_horario) ? '#6c757d' : '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '4px',
                      cursor: (!fechaEsValida || !formReprogramar.nuevo_horario) ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    💾 Confirmar Reprogramación
                  </button>
                  <button
                    onClick={cerrarFormularioReprogramar}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaCitas;