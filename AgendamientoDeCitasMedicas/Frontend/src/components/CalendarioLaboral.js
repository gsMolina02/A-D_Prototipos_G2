import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './styles/CalendarioLaboral.css';

const CalendarioLaboral = () => {
  const {
    usuarioActual,
    horariosPorDoctor,
    guardarHorarioDoctor,
    eliminarHorarioDoctor,
    limpiarHorariosDoctor,
    cargarHorariosPorDoctor,
    cargarTodosLosHorarios,
    agendarCita,
    citasAgendadas
  } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [horariosBackend, setHorariosBackend] = useState([]);
  const [nuevoHorario, setNuevoHorario] = useState({
    dia: 'Lunes',
    horaInicio: '',
    horaFin: '',
    duracionCita: '',
    intervalo: ''
  });
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const puedeEditar = usuarioActual && (usuarioActual.rol === 'doctor' || usuarioActual.rol === 'administrador');

  // Cargar horarios al montar el componente
  useEffect(() => {
    const cargarHorarios = async () => {
      if (!usuarioActual) return;
      
      setLoading(true);
      try {
        if (usuarioActual.rol === 'doctor') {
          const horarios = await cargarHorariosPorDoctor(usuarioActual.id);
          setHorariosBackend(horarios);
        } else if (usuarioActual.rol === 'paciente') {
          const horarios = await cargarTodosLosHorarios();
          setHorariosBackend(horarios);
        }
      } catch (error) {
        console.error('Error al cargar horarios:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarHorarios();
  }, [usuarioActual]);

  // Determinar de qué doctor se muestran los horarios
  const emailDoctor = usuarioActual?.rol === 'paciente' ? 'axel@gmail.com' : usuarioActual?.email;
  const horarios = usuarioActual?.rol === 'doctor' ? horariosBackend : horariosBackend.filter(h => h.doctor_name && h.doctor_apellido);
  
  // Función que determina si un horario (día+horario) ya está ocupado
  const estaOcupado = (dia, horarioStr) => {
    return citasAgendadas.some(cita =>
      cita.doctorId === emailDoctor &&
      cita.dia === dia &&
      cita.horario === horarioStr &&
      cita.estado !== 'cancelada' // solo citas activas cuentan
    );
  };

  const handleChange = (e) => {
    setNuevoHorario({ ...nuevoHorario, [e.target.name]: e.target.value });
    setError('');
  };

  const validarHorario = (horario) => {
    const { horaInicio, horaFin, duracionCita, intervalo } = horario;
    if (!horaInicio || !horaFin || !duracionCita || !intervalo) {
      return 'Todos los campos deben estar completos.';
    }
    if (horaFin <= horaInicio) {
      return 'La hora de fin debe ser mayor a la hora de inicio.';
    }
    if (parseInt(duracionCita) <= 0 || parseInt(intervalo) < 0) {
      return 'La duración debe ser mayor a 0 y el intervalo no puede ser negativo.';
    }
    const horariosDelDia = horarios.filter(h => h.dia === horario.dia);
    for (let h of horariosDelDia) {
      const hInicio = h.hora_inicio || h.horaInicio;
      const hFin = h.hora_fin || h.horaFin;
      if (
        (horaInicio >= hInicio && horaInicio < hFin) ||
        (horaFin > hInicio && horaFin <= hFin) ||
        (horaInicio <= hInicio && horaFin >= hFin)
      ) {
        return `Ya existe un horario que se solapa en ${horario.dia} (${hInicio} - ${hFin})`;
      }
    }
    return null;
  };

  const agregarHorario = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return setError('No tienes permisos para agregar horarios.');
    const errorValidacion = validarHorario(nuevoHorario);
    if (errorValidacion) return setError(errorValidacion);

    setLoading(true);
    try {
      const result = await guardarHorarioDoctor(emailDoctor, { ...nuevoHorario, id: Date.now() });
      if (result.success) {
        setNuevoHorario({ dia: 'Lunes', horaInicio: '', horaFin: '', duracionCita: '', intervalo: '' });
        // Recargar horarios
        const horarios = await cargarHorariosPorDoctor(usuarioActual.id);
        setHorariosBackend(horarios);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al guardar horario');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    if (!puedeEditar) return alert('No tienes permisos para eliminar horarios.');
    
    setLoading(true);
    try {
      const result = await eliminarHorarioDoctor(emailDoctor, id);
      if (result.success) {
        // Recargar horarios
        const horarios = await cargarHorariosPorDoctor(usuarioActual.id);
        setHorariosBackend(horarios);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error al eliminar horario');
    } finally {
      setLoading(false);
    }
  };

  const limpiarTodosLosHorarios = async () => {
    if (!puedeEditar) return alert('No tienes permisos para limpiar horarios.');
    if (window.confirm('¿Eliminar todos los horarios?')) {
      setLoading(true);
      try {
        const result = await limpiarHorariosDoctor(emailDoctor);
        if (result.success) {
          setHorariosBackend([]);
        } else {
          alert(result.message);
        }
      } catch (error) {
        alert('Error al limpiar horarios');
      } finally {
        setLoading(false);
      }
    }
  };

  const calcularCitasPosibles = (horario) => {
    const inicio = new Date(`1970-01-01T${horario.horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horario.horaFin}:00`);
    const duracionTotal = (fin - inicio) / (1000 * 60);
    const tiempoPorCita = parseInt(horario.duracionCita) + parseInt(horario.intervalo);
    return Math.floor(duracionTotal / tiempoPorCita);
  };

  const generarHorariosCitas = (horario) => {
    const citas = [];
    const inicio = new Date(`1970-01-01T${horario.horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horario.horaFin}:00`);
    let actual = new Date(inicio);

    const duracion = parseInt(horario.duracionCita);
    const intervalo = parseInt(horario.intervalo);

    while (actual < fin) {
      const inicioCita = actual.toTimeString().slice(0, 5);
      actual.setMinutes(actual.getMinutes() + duracion);
      const finCita = actual.toTimeString().slice(0, 5);
      if (actual <= fin) {
        citas.push(`${inicioCita} - ${finCita}`);
      }
      actual.setMinutes(actual.getMinutes() + intervalo);
    }
    return citas;
  };

  const handleAgendarCita = (horario, citaStr) => {
    if (!usuarioActual) return alert('Debes iniciar sesión.');
    const confirmacion = window.confirm(`¿Agendar cita para ${horario.dia} ${citaStr}?`);
    if (!confirmacion) return;
    const resultado = agendarCita({
      dia: horario.dia,
      horario: citaStr,
      doctorId: emailDoctor,
      especialidad: 'Consulta General'
    });
    alert(resultado.message);
  };

  return (
    <div className="calendario-container">
      <div className="calendario-box">
        <h2 className="calendario-titulo">📅 Calendario Laboral</h2>

        {!puedeEditar && (
          <div className="mensaje-permisos">
            <h4>👤 Modo solo lectura</h4>
            <p>Solo puedes visualizar horarios disponibles. Doctores y administradores pueden gestionarlos.</p>
          </div>
        )}

        {puedeEditar && (
          <form className="agregar-horario-box" onSubmit={agregarHorario}>
            <h3>➕ Agregar Nuevo Horario</h3>
            <div className="horario-form">
              <div>
                <label>Día:</label>
                <select name="dia" value={nuevoHorario.dia} onChange={handleChange}>
                  {diasSemana.map(dia => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Inicio:</label>
                <input type="time" name="horaInicio" value={nuevoHorario.horaInicio} onChange={handleChange} />
              </div>
              <div>
                <label>Fin:</label>
                <input type="time" name="horaFin" value={nuevoHorario.horaFin} onChange={handleChange} />
              </div>
              <div>
                <label>Duración (min):</label>
                <input type="number" name="duracionCita" value={nuevoHorario.duracionCita} onChange={handleChange} />
              </div>
              <div>
                <label>Intervalo (min):</label>
                <input type="number" name="intervalo" value={nuevoHorario.intervalo} onChange={handleChange} />
              </div>
            </div>
            <div className="botones-acciones">
              <button className="btn-verde" type="submit">Agregar Horario</button>
              {horarios.length > 0 && (
                <button className="btn-rojo" type="button" onClick={limpiarTodosLosHorarios}>🗑️ Limpiar Todo</button>
              )}
            </div>
            {error && <div className="error-mensaje">⚠️ {error}</div>}
          </form>
        )}

        <div className="grid-dias">
          {diasSemana.map(dia => {
            const horariosDelDia = horarios.filter(h => h.dia === dia);
            return (
              <div key={dia} className="bloque-horario">
                <h3>{dia}</h3>
                {horariosDelDia.length === 0 ? (
                  <p className="sin-horarios">😴 Sin horarios configurados</p>
                ) : (
                  horariosDelDia.map(horario => (
                    <div key={horario.id} className="card-horario">
                      {puedeEditar && (
                        <button className="btn-eliminar" onClick={() => eliminar(horario.id)}>×</button>
                      )}
                      <div>
                        <p><strong>🕐 Horario:</strong> {horario.horaInicio} - {horario.horaFin}</p>
                        <p><strong>⏱️ Duración:</strong> {horario.duracionCita} min</p>
                        <p><strong>⏸️ Intervalo:</strong> {horario.intervalo} min</p>
                        <p><strong>📊 Citas posibles:</strong> {calcularCitasPosibles(horario)}</p>
                      </div>
                      <details>
                        <summary>👁️ Ver horarios disponibles</summary>
                        <div className="details-citas">
                          {generarHorariosCitas(horario).map((cita, idx) => {
  const ocupado = estaOcupado(dia, cita);
  return (
    <div key={idx} className={`cita-item ${ocupado ? 'ocupado' : ''}`}>
      <span>{cita}</span>
      {usuarioActual?.rol === 'paciente' && (
        <button
          className="btn-agendar"
          onClick={() => handleAgendarCita(horario, cita)}
          disabled={ocupado} // <--- deshabilita si está ocupado
        >
          {ocupado ? 'Ocupado' : 'Agendar'} 
        </button>
      )}
    </div>
  );
})}

                        </div>
                      </details>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarioLaboral;
