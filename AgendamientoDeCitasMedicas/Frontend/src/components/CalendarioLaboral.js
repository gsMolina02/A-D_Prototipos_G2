import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './styles/CalendarioLaboral.css';
import axios from 'axios'; // Asegúrate de tener axios instalado

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
    todasLasCitas,
    citasActualizadas // Para detectar cambios en las citas
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

  // DEBUG: Log del estado del usuario y citas
  console.log('🔍 DEBUG CalendarioLaboral - Estado actual:', {
    usuarioActual: usuarioActual ? {
      id: usuarioActual.id,
      email: usuarioActual.email,
      rol: usuarioActual.rol
    } : null,
    totalCitas: todasLasCitas.length,
    citasReprogramadas: todasLasCitas.filter(c => c.estado === 'reprogramada').length,
    horariosBackend: horariosBackend.length,
    puedeEditar
  });
// Estado para el reporte
const [reporte, setReporte] = useState([]);
const [filtroReporte, setFiltroReporte] = useState({
  fechaInicio: '',
  fechaFin: '',
  campos: {
    paciente: true,
    dia: true,
    horario: true,
    estado: true
  }
});
const [loadingReporte, setLoadingReporte] = useState(false);

// Manejar cambios en el formulario de reporte
const handleFiltroReporteChange = (e) => {
  const { name, value, type, checked } = e.target;
  if (name in filtroReporte.campos) {
    setFiltroReporte({
      ...filtroReporte,
      campos: { ...filtroReporte.campos, [name]: checked }
    });
  } else {
    setFiltroReporte({ ...filtroReporte, [name]: value });
  }
};

// Solicitar reporte al backend
const generarReporte = async (e) => {
  e.preventDefault();
  setLoadingReporte(true);
  setReporte([]);
  try {
    const { fechaInicio, fechaFin, campos } = filtroReporte;
    const res = await axios.post('http://localhost:3001/api/citas/reporte', {
      doctorId: usuarioActual.id,
      fechaInicio,
      fechaFin,
      campos
    });
    setReporte(res.data);
  } catch (err) {
    setReporte([]);
    alert('Error al generar reporte');
  } finally {
    setLoadingReporte(false);
  }
};

  // Cargar horarios al montar el componente
  useEffect(() => {
    const cargarHorarios = async () => {
      if (!usuarioActual) {
        return;
      }
      
      setLoading(true);
      try {
        // Cargar horarios según el rol
        if (usuarioActual.rol === 'doctor') {
          const horarios = await cargarHorariosPorDoctor(usuarioActual.id);
          setHorariosBackend(horarios);
        } else if (usuarioActual.rol === 'paciente') {
          const horarios = await cargarTodosLosHorarios();
          setHorariosBackend(horarios);
        }
        
        // Cargar todas las citas para verificar disponibilidad
        await cargarTodasLasCitas(true); // Silencioso en carga inicial
        
      } catch (error) {
        console.error('Error al cargar horarios:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarHorarios();
  }, [usuarioActual?.id, usuarioActual?.rol]); // Solo depender de id y rol del usuario

  // useEffect adicional para recargar citas cuando hay cambios (reagendamientos, cancelaciones)
  useEffect(() => {
    if (citasActualizadas > 0) {
      // Recargar las citas para reflejar los cambios inmediatamente (silencioso)
      cargarTodasLasCitas(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citasActualizadas]); // Solo depender de citasActualizadas, no de la función

  // useEffect adicional para forzar re-renderizado cuando las citas cambian
  useEffect(() => {
    // Este efecto se ejecuta cada vez que todasLasCitas cambia
    // Fuerza al componente a re-evaluar qué horarios están ocupados
  }, [todasLasCitas]); // Dependencia directa de todasLasCitas

  // Determinar de qué doctor se muestran los horarios
  const emailDoctor = usuarioActual?.rol === 'paciente' ? 'axel@gmail.com' : usuarioActual?.email;
  const horarios = usuarioActual?.rol === 'doctor' ? horariosBackend : horariosBackend.filter(h => h.doctor_name && h.doctor_apellido);
  
  // Función helper para convertir nombre del día a fecha YYYY-MM-DD
  const convertirDiaAFecha = (nombreDia) => {
    const hoy = new Date();
    const diasSemanaArray = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaActual = hoy.getDay();
    const indiceDiaObjetivo = diasSemanaArray.indexOf(nombreDia);
    
    if (indiceDiaObjetivo === -1) return null;
    
    let diferenciaDias = indiceDiaObjetivo - diaActual;
    if (diferenciaDias < 0) {
      diferenciaDias += 7;
    }
    
    const fechaObjetivo = new Date(hoy);
    fechaObjetivo.setDate(hoy.getDate() + diferenciaDias);
    const fechaCalculada = fechaObjetivo.toISOString().split('T')[0];
    
    // DEBUG: Log para verificar conversión de fechas
    console.log('🔍 DEBUG convertirDiaAFecha:', {
      nombreDia,
      hoy: hoy.toISOString().split('T')[0],
      diaActual: diasSemanaArray[diaActual],
      indiceDiaObjetivo,
      diferenciaDias,
      fechaCalculada
    });
    
    return fechaCalculada;
  };
  
  // Función que determina si un horario (día+horario) ya está ocupado
  const estaOcupado = (nombreDia, horarioStr, doctorId) => {
    const fechaStr = convertirDiaAFecha(nombreDia);
    if (!fechaStr) return false;
    
    const ocupado = todasLasCitas.some(cita => {
      const coincideDoctor = String(cita.doctor_id) === String(doctorId);
      const coincideDia = cita.dia === fechaStr;
      const coincideHorario = cita.horario === horarioStr;
      const estadoValido = cita.estado !== 'cancelada';
      
      return coincideDoctor && coincideDia && coincideHorario && estadoValido;
    });
    
    return ocupado;
  };

  // Función para verificar si una cita fue reprogramada
  const esReprogramada = (nombreDia, horarioStr, doctorId) => {
    const fechaStr = convertirDiaAFecha(nombreDia);
    if (!fechaStr) return false;
    
    console.log('🔍 DEBUG esReprogramada - INICIO:', {
      nombreDia,
      horarioStr,
      doctorId,
      fechaStr,
      totalCitas: todasLasCitas.length
    });
    
    // DEBUG: Mostrar todas las citas para esta fecha
    const citasEsteFecha = todasLasCitas.filter(cita => cita.dia === fechaStr);
    console.log(`🔍 DEBUG: Citas en fecha ${fechaStr}:`, citasEsteFecha.length);
    if (citasEsteFecha.length > 0) {
      citasEsteFecha.forEach(cita => {
        console.log(`   ID ${cita.id}: Dr${cita.doctor_id}, ${cita.horario}, Estado: ${cita.estado}`);
      });
    }
    
    const cita = todasLasCitas.find(cita => {
      const coincideDoctor = String(cita.doctor_id) === String(doctorId);
      const coincideDia = cita.dia === fechaStr;
      const coincideHorario = cita.horario === horarioStr;
      const estadoValido = cita.estado !== 'cancelada';
      
      // Solo mostrar debug para coincidencias potenciales
      if (coincideDia && coincideDoctor) {
        console.log('🔍 DEBUG comparando cita POTENCIAL:', {
          citaId: cita.id,
          citaDia: cita.dia,
          citaHorario: cita.horario,
          citaEstado: cita.estado,
          citaDoctorId: cita.doctor_id,
          buscandoHorario: horarioStr,
          coincideDoctor,
          coincideDia,
          coincideHorario,
          estadoValido,
          esReprogramada: cita.estado === 'reprogramada'
        });
      }
      
      return coincideDoctor && coincideDia && coincideHorario && estadoValido;
    });
    
    const resultado = cita && cita.estado === 'reprogramada';
    
    // DEBUG: Log resultado final
    if (resultado) {
      console.log('🔍 DEBUG: ✅ CITA REPROGRAMADA ENCONTRADA:', {
        id: cita.id,
        dia: cita.dia,
        horario: cita.horario,
        estado: cita.estado,
        fechaStr,
        horarioStr
      });
    } else if (cita) {
      console.log('🔍 DEBUG: ❌ Cita encontrada pero NO reprogramada:', {
        id: cita.id,
        estado: cita.estado
      });
    } else {
      console.log('🔍 DEBUG: ❌ No se encontró cita para:', {
        nombreDia,
        fechaStr,
        horarioStr,
        doctorId
      });
    }
    
    return resultado;
  };

  // Función para obtener información de una cita específica
  const obtenerInfoCita = (nombreDia, horarioStr, doctorId) => {
    const fechaStr = convertirDiaAFecha(nombreDia);
    if (!fechaStr) return null;
    
    return todasLasCitas.find(cita => {
      const coincideDoctor = String(cita.doctor_id) === String(doctorId);
      const coincideDia = cita.dia === fechaStr;
      const coincideHorario = cita.horario === horarioStr;
      const estadoValido = cita.estado !== 'cancelada';
      
      return coincideDoctor && coincideDia && coincideHorario && estadoValido;
    });
  };

  // Función para obtener información del paciente de una cita específica (solo para doctores)
  const obtenerInfoPacienteCita = (nombreDia, horarioStr, doctorId) => {
    if (usuarioActual?.rol !== 'doctor') return null;
    
    const cita = obtenerInfoCita(nombreDia, horarioStr, doctorId);
    
    if (cita) {
      return {
        id: cita.paciente_id,
        nombre: cita.paciente_name || 'Nombre no disponible',
        apellido: cita.paciente_apellido || 'Apellido no disponible',
        cedula: cita.paciente_cedula || 'Cédula no disponible',
        estado: cita.estado
      };
    }
    
    return null;
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
    
    if (!horaInicio || !horaFin || !duracionCita || intervalo === undefined) {
      return 0;
    }
    
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);
    const duracionTotal = (fin - inicio) / (1000 * 60);
    
    // Convertir a números (pueden venir como números del backend o strings del frontend)
    const duracionNum = typeof duracionCita === 'number' ? duracionCita : parseInt(duracionCita);
    const intervaloNum = typeof intervalo === 'number' ? intervalo : parseInt(intervalo);
    
    if (isNaN(duracionNum) || isNaN(intervaloNum) || duracionNum <= 0) {
      return 0;
    }
    
    const tiempoPorCita = duracionNum + intervaloNum;
    const resultado = Math.floor(duracionTotal / tiempoPorCita);
    
    return resultado;
  };

  const generarHorariosCitas = (horario) => {
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
    
    if (!horaInicio || !horaFin || !duracionCita || intervalo === undefined) {
      return [];
    }
    
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);
    let actual = new Date(inicio);

    // Convertir a números
    const duracion = typeof duracionCita === 'number' ? duracionCita : parseInt(duracionCita);
    const intervaloNum = typeof intervalo === 'number' ? intervalo : parseInt(intervalo);
    
    if (isNaN(duracion) || isNaN(intervaloNum) || duracion <= 0) {
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
      } else {
        break;
      }
      
      // Agregar intervalo para la siguiente cita
      actual.setMinutes(actual.getMinutes() + intervaloNum);
    }
    
    // DEBUG: Log para verificar horarios generados
    if (citas.length > 0) {
      console.log('🔍 DEBUG generarHorariosCitas:', {
        doctor_id: horario.doctor_id,
        dia: horario.dia,
        horaInicio,
        horaFin,
        duracionCita,
        intervalo,
        totalCitasGeneradas: citas.length,
        primerasCitas: citas.slice(0, 3),
        ultimasCitas: citas.slice(-3)
      });
    }
    
    return citas;
  };

  const handleAgendarCita = async (horario, citaStr) => {
    if (!usuarioActual) return alert('Debes iniciar sesión.');
    if (usuarioActual.rol !== 'paciente') return alert('Solo los pacientes pueden agendar citas.');
    
    // Convertir el nombre del día a fecha usando la función helper
    const fechaStr = convertirDiaAFecha(horario.dia);
    if (!fechaStr) return alert('Error al procesar la fecha.');
    
    const confirmacion = window.confirm(`¿Agendar cita para ${horario.dia} ${citaStr} (${fechaStr})?`);
    if (!confirmacion) return;
    
    // Obtener el ID del doctor desde el horario
    const doctorId = horario.doctor_id || 3; // 3 es el ID del doctor axel@gmail.com
    
    const resultado = await agendarCita({
      dia: fechaStr, // Usar la fecha en formato YYYY-MM-DD
      horario: citaStr,
      doctorId: doctorId,
      especialidad: 'Consulta General' // Sin especialidad específica
    });
    
    if (resultado.success) {
      alert(resultado.message);
      // Recargar tanto horarios como citas para actualizar disponibilidad
      await cargarTodasLasCitas(); // Solo este log es útil para el usuario
      if (usuarioActual.rol === 'paciente') {
        const horarios = await cargarTodosLosHorarios();
        setHorariosBackend(horarios);
      }
    } else {
      alert(resultado.message);
    }
  };

  return (
    <div className="calendario-container">
      <div className="calendario-box">
        <h2 className="calendario-titulo">Calendario Laboral</h2>
      
     {!puedeEditar && (
        <div className="mensaje-permisos">
          <h4>Modo solo lectura</h4>
          <p>Solo puedes visualizar horarios disponibles. Doctores y administradores pueden gestionarlos.</p>
        </div>
      )}
      {puedeEditar && (
        <form className="agregar-horario-box" onSubmit={agregarHorario}>
            <h3>Agregar Nuevo Horario</h3>
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
                <button className="btn-rojo" type="button" onClick={limpiarTodosLosHorarios}>Limpiar Todo</button>
              )}
            </div>
            {error && <div className="error-mensaje">{error}</div>}
          </form>
        )}

        <div className="grid-dias">
          {diasSemana.map(dia => {
            const horariosDelDia = horarios.filter(h => h.dia === dia);
            return (
              <div key={dia} className="bloque-horario">
                <h3>{dia}</h3>
                {horariosDelDia.length === 0 ? (
                  <p className="sin-horarios">Sin horarios configurados</p>
                ) : (
                  horariosDelDia.map(horario => (
                    <div key={horario.id} className="card-horario">
                      {puedeEditar && (
                        <button className="btn-eliminar" onClick={() => eliminar(horario.id)}>×</button>
                      )}
                      <div>
                        {horario.doctor_name && (
                          <p><strong>Doctor:</strong> {horario.doctor_name} {horario.doctor_apellido}</p>
                        )}
                        <p><strong>Horario:</strong> {(horario.hora_inicio || horario.horaInicio).substring(0, 5)} - {(horario.hora_fin || horario.horaFin).substring(0, 5)}</p>
                        <p><strong>Duración:</strong> {horario.duracion_cita || horario.duracionCita} min</p>
                        <p><strong>Intervalo:</strong> {horario.intervalo} min</p>
                        <p><strong>Citas posibles:</strong> {calcularCitasPosibles(horario)}</p>
                      </div>
                      <details>
                        <summary>Ver horarios de citas disponibles</summary>
                        <div className="details-citas">
                          {generarHorariosCitas(horario).map((cita, idx) => {
  const ocupado = estaOcupado(dia, cita, horario.doctor_id);
  const reprogramada = esReprogramada(dia, cita, horario.doctor_id);
  const citaInfo = obtenerInfoCita(dia, cita, horario.doctor_id);
  const infoPaciente = ocupado ? obtenerInfoPacienteCita(dia, cita, horario.doctor_id) : null;
  
  // Determinar si mostrar información del paciente
  const mostrarInfoPaciente = usuarioActual?.rol === 'doctor' || 
    (usuarioActual && citaInfo && citaInfo.paciente_id === usuarioActual.id);
  
  // Determinar clase CSS según el estado
  let claseEstado = 'disponible';
  if (ocupado) {
    if (reprogramada) {
      // Las citas reprogramadas siempre se muestran como 'reprogramada' en azul
      claseEstado = 'reprogramada';
    } else {
      claseEstado = 'ocupado';
    }
  }
  
  return (
    <div key={idx} className={`cita-item ${claseEstado}`}>
      <span className="horario-cita">{cita}</span>
      
      {usuarioActual?.rol === 'paciente' && (
        <button
          className={`btn-agendar ${ocupado ? 'btn-ocupado' : ''}`}
          onClick={() => handleAgendarCita(horario, cita)}
          disabled={ocupado}
        >
          {ocupado ? 'No disponible' : 'Agendar'} 
        </button>
      )}
      
      {ocupado && (
        <div className="info-cita-ocupada">
          {mostrarInfoPaciente && infoPaciente ? (
            <div className="info-paciente">
              <span className={`estado-cita ${reprogramada ? 'reprogramada' : 'ocupado'}`}>
                {reprogramada ? 'REPROGRAMADA' : 'OCUPADO'}
              </span>
              <div className="datos-paciente">
                <p><strong>ID:</strong> {infoPaciente.id}</p>
                <p><strong>Paciente:</strong> {infoPaciente.nombre} {infoPaciente.apellido}</p>
                <p><strong>Cédula:</strong> {infoPaciente.cedula}</p>
              </div>
            </div>
          ) : (
            <span className={`estado-cita ${reprogramada ? 'reprogramada' : 'ocupado'}`}>
              {reprogramada ? 'Reprogramada' : 'Ocupado'}
            </span>
          )}
        </div>
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
