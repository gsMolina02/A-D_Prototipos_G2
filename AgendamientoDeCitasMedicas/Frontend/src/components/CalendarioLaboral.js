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
    cargarTodasLasCitas,
    agendarCita,
    citasAgendadas,
    todasLasCitas
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
      if (!usuarioActual) {
        console.log('No hay usuario actual, no se cargan horarios');
        return;
      }
      
      console.log('Cargando horarios para usuario:', usuarioActual.rol, usuarioActual.id);
      setLoading(true);
      try {
        // Cargar horarios según el rol
        if (usuarioActual.rol === 'doctor') {
          console.log('Cargando horarios para doctor ID:', usuarioActual.id);
          const horarios = await cargarHorariosPorDoctor(usuarioActual.id);
          console.log('Horarios del doctor cargados:', horarios);
          setHorariosBackend(horarios);
        } else if (usuarioActual.rol === 'paciente') {
          console.log('Cargando todos los horarios para paciente');
          const horarios = await cargarTodosLosHorarios();
          console.log('Todos los horarios cargados:', horarios);
          setHorariosBackend(horarios);
        }
        
        // Cargar todas las citas para verificar disponibilidad
        console.log('Cargando todas las citas...');
        await cargarTodasLasCitas();
        console.log('Citas cargadas exitosamente');
        
      } catch (error) {
        console.error('Error al cargar horarios:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarHorarios();
  }, [usuarioActual, cargarHorariosPorDoctor, cargarTodosLosHorarios, cargarTodasLasCitas]);

  // Determinar de qué doctor se muestran los horarios
  const emailDoctor = usuarioActual?.rol === 'paciente' ? 'axel@gmail.com' : usuarioActual?.email;
  const horarios = usuarioActual?.rol === 'doctor' ? horariosBackend : horariosBackend.filter(h => h.doctor_name && h.doctor_apellido);
  
  console.log('Estado actual:', {
    usuarioActual: usuarioActual?.rol,
    horariosBackend: horariosBackend,
    horarios: horarios,
    emailDoctor: emailDoctor
  });
  
  // Función que determina si un horario (día+horario) ya está ocupado
  const estaOcupado = (dia, horarioStr, doctorId) => {
    console.log('🔍 Verificando disponibilidad:', { dia, horarioStr, doctorId });
    console.log('📋 Todas las citas:', todasLasCitas);
    
    const ocupado = todasLasCitas.some(cita => {
      const coincide = cita.doctor_id === doctorId &&
                     cita.dia === dia &&
                     cita.horario === horarioStr &&
                     cita.estado !== 'cancelada';
      
      if (coincide) {
        console.log('❌ Cita ocupada encontrada:', cita);
      }
      
      return coincide;
    });
    
    console.log(`✅ Resultado: ${ocupado ? 'OCUPADO' : 'DISPONIBLE'}`);
    return ocupado;
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
    console.log('🔍 Calculando citas posibles para:', horario);
    
    // Extraer datos con compatibilidad backend/frontend
    let horaInicio = horario.hora_inicio || horario.horaInicio;
    let horaFin = horario.hora_fin || horario.horaFin;
    const duracionCita = horario.duracion_cita || horario.duracionCita;
    const intervalo = horario.intervalo;
    
    // Si viene del backend, las horas incluyen segundos (ej: "09:00:00")
    // Necesitamos solo HH:MM para crear el Date
    if (horaInicio && horaInicio.includes(':')) {
      horaInicio = horaInicio.substring(0, 5); // "09:00:00" -> "09:00"
    }
    if (horaFin && horaFin.includes(':')) {
      horaFin = horaFin.substring(0, 5); // "12:00:00" -> "12:00"
    }
    
    console.log('📊 Datos extraídos y procesados:', {
      horaInicio,
      horaFin,
      duracionCita,
      intervalo,
      'typeof duracionCita': typeof duracionCita,
      'typeof intervalo': typeof intervalo
    });
    
    if (!horaInicio || !horaFin || !duracionCita || intervalo === undefined) {
      console.log('❌ Faltan datos, retornando 0');
      return 0;
    }
    
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);
    const duracionTotal = (fin - inicio) / (1000 * 60);
    
    // Convertir a números (pueden venir como números del backend o strings del frontend)
    const duracionNum = typeof duracionCita === 'number' ? duracionCita : parseInt(duracionCita);
    const intervaloNum = typeof intervalo === 'number' ? intervalo : parseInt(intervalo);
    
    console.log('🧮 Cálculos:', {
      inicio: inicio.toTimeString(),
      fin: fin.toTimeString(),
      duracionTotal,
      duracionNum,
      intervaloNum,
      'isNaN duracionNum': isNaN(duracionNum),
      'isNaN intervaloNum': isNaN(intervaloNum)
    });
    
    if (isNaN(duracionNum) || isNaN(intervaloNum) || duracionNum <= 0) {
      console.log('❌ NaN detectado, retornando 0');
      return 0;
    }
    
    const tiempoPorCita = duracionNum + intervaloNum;
    const resultado = Math.floor(duracionTotal / tiempoPorCita);
    
    console.log('✅ Resultado final:', resultado);
    return resultado;
  };

  const generarHorariosCitas = (horario) => {
    console.log('🕐 Generando horarios de citas para:', horario);
    
    const citas = [];
    
    // Extraer datos con compatibilidad backend/frontend
    let horaInicio = horario.hora_inicio || horario.horaInicio;
    let horaFin = horario.hora_fin || horario.horaFin;
    const duracionCita = horario.duracion_cita || horario.duracionCita;
    const intervalo = horario.intervalo;
    
    // Si viene del backend, las horas incluyen segundos (ej: "09:00:00")
    if (horaInicio && horaInicio.includes(':')) {
      horaInicio = horaInicio.substring(0, 5);
    }
    if (horaFin && horaFin.includes(':')) {
      horaFin = horaFin.substring(0, 5);
    }
    
    console.log('📊 Datos para generar citas procesados:', {
      horaInicio,
      horaFin,
      duracionCita,
      intervalo,
      'typeof duracionCita': typeof duracionCita,
      'typeof intervalo': typeof intervalo
    });
    
    if (!horaInicio || !horaFin || !duracionCita || intervalo === undefined) {
      console.log('❌ Faltan datos para generar citas');
      return [];
    }
    
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);
    let actual = new Date(inicio);

    // Convertir a números
    const duracion = typeof duracionCita === 'number' ? duracionCita : parseInt(duracionCita);
    const intervaloNum = typeof intervalo === 'number' ? intervalo : parseInt(intervalo);
    
    console.log('🧮 Valores parseados:', {
      duracion,
      intervaloNum,
      isNaN_duracion: isNaN(duracion),
      isNaN_intervalo: isNaN(intervaloNum)
    });
    
    if (isNaN(duracion) || isNaN(intervaloNum) || duracion <= 0) {
      console.log('❌ NaN detectado en generación de citas');
      return [];
    }

    while (actual < fin) {
      const inicioCita = actual.toTimeString().slice(0, 5);
      actual.setMinutes(actual.getMinutes() + duracion);
      const finCita = actual.toTimeString().slice(0, 5);
      
      // Verificar que la cita completa esté dentro del horario
      if (actual <= fin) {
        const citaStr = `${inicioCita} - ${finCita}`;
        citas.push(citaStr);
        console.log('✅ Cita generada:', citaStr);
      } else {
        console.log('⏰ Cita excede horario:', `${inicioCita} - ${finCita}`);
        break;
      }
      
      // Agregar intervalo para la siguiente cita
      actual.setMinutes(actual.getMinutes() + intervaloNum);
    }
    
    console.log('📋 Total de citas generadas:', citas.length);
    return citas;
  };

  const handleAgendarCita = async (horario, citaStr) => {
    if (!usuarioActual) return alert('Debes iniciar sesión.');
    if (usuarioActual.rol !== 'paciente') return alert('Solo los pacientes pueden agendar citas.');
    
    const confirmacion = window.confirm(`¿Agendar cita para ${horario.dia} ${citaStr}?`);
    if (!confirmacion) return;
    
    // Obtener el ID del doctor desde el horario
    const doctorId = horario.doctor_id || 3; // 3 es el ID del doctor axel@gmail.com
    
    const resultado = await agendarCita({
      dia: horario.dia,
      horario: citaStr,
      doctorId: doctorId,
      especialidad: 'Consulta General' // Sin especialidad específica
    });
    
    if (resultado.success) {
      alert('✅ ' + resultado.message);
      // Recargar tanto horarios como citas para actualizar disponibilidad
      await cargarTodasLasCitas();
      if (usuarioActual.rol === 'paciente') {
        const horarios = await cargarTodosLosHorarios();
        setHorariosBackend(horarios);
      }
    } else {
      alert('❌ ' + resultado.message);
    }
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
                        {horario.doctor_name && (
                          <p><strong>👨‍⚕️ Doctor:</strong> {horario.doctor_name} {horario.doctor_apellido}</p>
                        )}
                        <p><strong>🕐 Horario:</strong> {(horario.hora_inicio || horario.horaInicio).substring(0, 5)} - {(horario.hora_fin || horario.horaFin).substring(0, 5)}</p>
                        <p><strong>⏱️ Duración:</strong> {horario.duracion_cita || horario.duracionCita} min</p>
                        <p><strong>⏸️ Intervalo:</strong> {horario.intervalo} min</p>
                        <p><strong>📊 Citas posibles:</strong> {(() => {
                          const citasPosibles = calcularCitasPosibles(horario);
                          console.log('Calculando citas para horario:', horario);
                          console.log('Citas posibles calculadas:', citasPosibles);
                          return citasPosibles;
                        })()}</p>
                      </div>
                      <details>
                        <summary>👁️ Ver horarios de citas disponibles</summary>
                        <div className="details-citas">
                          {generarHorariosCitas(horario).map((cita, idx) => {
  const ocupado = estaOcupado(dia, cita, horario.doctor_id);
  return (
    <div key={idx} className={`cita-item ${ocupado ? 'ocupado' : 'disponible'}`}>
      <span>🕒 {cita}</span>
      {usuarioActual?.rol === 'paciente' && (
        <button
          className={`btn-agendar ${ocupado ? 'btn-ocupado' : ''}`}
          onClick={() => handleAgendarCita(horario, cita)}
          disabled={ocupado}
        >
          {ocupado ? '❌ No disponible' : '✅ Agendar'} 
        </button>
      )}
      {ocupado && (
        <span className="estado-ocupado">🔴 Ocupado</span>
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
