import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './styles/CalendarioLaboral.css';
import axios from 'axios'; // Asegúrate de tener axios instalado
import { guardarCalificacion } from '../services/api';
import StripeCheckout from './StripeCheckout';

const PRECIO_CITA = 20.00; // Precio fijo de la cita en USD

const CalendarioLaboral = () => {
  const {
    usuarioActual,
    // eslint-disable-next-line no-unused-vars
    horariosPorDoctor,
    guardarHorarioDoctor,
    eliminarHorarioDoctor,
    limpiarHorariosDoctor,
    cargarHorariosPorDoctor,
    cargarTodosLosHorarios,
    cargarTodasLasCitas,
    agendarCita,
    // eslint-disable-next-line no-unused-vars
    citasAgendadas,
    todasLasCitas,
    citasActualizadas // Para detectar cambios en las citas
  } = useAuth();

  const [error, setError] = useState('');
  // eslint-disable-next-line no-unused-vars
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

  // Estados para modal de calificacion
  const [mostrarModalCalificacion, setMostrarModalCalificacion] = useState(false);
  const [citaRecienAgendada, setCitaRecienAgendada] = useState(null);
  const [calificacionSeleccionada, setCalificacionSeleccionada] = useState(0);
  const [calificacionHover, setCalificacionHover] = useState(0);

  // Estados para el sistema de pago
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [datosCitaPago, setDatosCitaPago] = useState(null);

  const puedeEditar = usuarioActual && (usuarioActual.rol === 'doctor' || usuarioActual.rol === 'administrador');
// Estado para el reporte
// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
const [loadingReporte, setLoadingReporte] = useState(false);

// Manejar cambios en el formulario de reporte
// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
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
        // Error silencioso
      } finally {
        setLoading(false);
      }
    };

    cargarHorarios();
  }, [usuarioActual?.id, usuarioActual?.rol, cargarHorariosPorDoctor, cargarTodasLasCitas, cargarTodosLosHorarios]); // Solo depender de id y rol del usuario

  // useEffect adicional para recargar citas cuando hay cambios (reagendamientos, cancelaciones)
  useEffect(() => {
    if (citasActualizadas > 0) {
      // Recargar las citas para reflejar los cambios inmediatamente (silencioso)
      cargarTodasLasCitas(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citasActualizadas]); // Solo depender de citasActualizadas, no de la funcion

  // useEffect adicional para forzar re-renderizado cuando las citas cambian
  useEffect(() => {
    // Este efecto se ejecuta cada vez que todasLasCitas cambia
    // Fuerza al componente a re-evaluar que horarios estan ocupados
  }, [todasLasCitas]); // Dependencia directa de todasLasCitas

  // Polling para actualizar citas cada 15 segundos para ver cambios de otros usuarios
  useEffect(() => {
    if (!usuarioActual || usuarioActual.rol !== 'paciente') return;
    
    const intervalo = setInterval(() => {
      cargarTodasLasCitas(true);
    }, 15000); // Cada 15 segundos
    
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioActual?.id]);

  // Determinar de que doctor se muestran los horarios
  const emailDoctor = usuarioActual?.rol === 'paciente' ? 'axeldoge4@gmail.com' : usuarioActual?.email;
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
    
    return fechaCalculada;
  };
  
  // Funcion que determina si un horario (dia+horario) ya esta ocupado
  const estaOcupado = (nombreDia, horarioStr, doctorId) => {
    const fechaStr = convertirDiaAFecha(nombreDia);
    if (!fechaStr) return false;
    
    // Normalizar el horario para comparacion (eliminar espacios extra)
    const horarioNormalizado = horarioStr.trim();
    
    const ocupado = todasLasCitas.some(cita => {
      const coincideDoctor = String(cita.doctor_id) === String(doctorId);
      const coincideDia = cita.dia === fechaStr;
      // Normalizar el horario de la cita tambien
      const horarioCitaNormalizado = cita.horario ? cita.horario.trim() : '';
      const coincideHorario = horarioCitaNormalizado === horarioNormalizado;
      const estadoValido = cita.estado !== 'cancelada';
      
      return coincideDoctor && coincideDia && coincideHorario && estadoValido;
    });
    
    return ocupado;
  };

  // Función para verificar si una cita fue reprogramada
  const esReprogramada = (nombreDia, horarioStr, doctorId) => {
    const fechaStr = convertirDiaAFecha(nombreDia);
    if (!fechaStr) return false;
    
    const cita = todasLasCitas.find(cita => {
      const coincideDoctor = String(cita.doctor_id) === String(doctorId);
      const coincideDia = cita.dia === fechaStr;
      const coincideHorario = cita.horario === horarioStr;
      const estadoValido = cita.estado !== 'cancelada';
      
      return coincideDoctor && coincideDia && coincideHorario && estadoValido;
    });
    
    return cita && cita.estado === 'reprogramada';
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
    
    return citas;
  };

  const handleAgendarCita = async (horario, citaStr) => {
    if (!usuarioActual) return alert('Debes iniciar sesion.');
    if (usuarioActual.rol !== 'paciente') return alert('Solo los pacientes pueden agendar citas.');
    
    // Convertir el nombre del dia a fecha usando la funcion helper
    const fechaStr = convertirDiaAFecha(horario.dia);
    if (!fechaStr) return alert('Error al procesar la fecha.');
    
    // Recargar citas antes de verificar disponibilidad
    await cargarTodasLasCitas(true);
    
    // Verificar nuevamente si el horario sigue disponible
    if (estaOcupado(horario.dia, citaStr, horario.doctor_id)) {
      alert('Este horario ya no esta disponible. Por favor selecciona otro horario.');
      return;
    }
    
    // Obtener el ID del doctor desde el horario
    const doctorId = horario.doctor_id || 3;
    
    // Obtener nombre del doctor
    const doctorNombre = horario.doctor_nombre || 'Doctor';
    
    // Extraer solo la hora de inicio del citaStr (formato: "09:00 - 09:30")
    const horaInicio = citaStr.split(' - ')[0];
    
    // Preparar datos para el pago
    const datosCita = {
      doctor_id: doctorId,
      paciente_id: usuarioActual.id,
      fecha: fechaStr,
      hora: horaInicio,
      motivo: 'Consulta General',
      paciente_email: usuarioActual.email,
      paciente_nombre: usuarioActual.nombre || usuarioActual.email,
      doctor_nombre: doctorNombre,
      especialidad: 'Medicina General',
      monto: PRECIO_CITA
    };
    
    // Mostrar modal de pago en lugar de agendar directamente
    setDatosCitaPago(datosCita);
    setMostrarCheckout(true);
  };

  // Callback cuando el pago es exitoso
  const handlePaymentSuccess = async (result) => {
    // Guardar la cita recien agendada para mostrar modal de calificacion
    setCitaRecienAgendada({
      id: result.cita?.id,
      dia: datosCitaPago.fecha,
      horario: datosCitaPago.hora
    });
    setCalificacionSeleccionada(0);
    setMostrarModalCalificacion(true);
    
    // Recargar tanto horarios como citas para actualizar disponibilidad
    await cargarTodasLasCitas();
    if (usuarioActual.rol === 'paciente') {
      const horarios = await cargarTodosLosHorarios();
      setHorariosBackend(horarios);
    }
    
    setDatosCitaPago(null);
  };

  // Manejar envio de calificacion
  const handleEnviarCalificacion = async () => {
    if (calificacionSeleccionada === 0) {
      alert('Por favor selecciona una calificacion');
      return;
    }
    
    try {
      await guardarCalificacion(citaRecienAgendada.id, usuarioActual.id, calificacionSeleccionada);
      alert('Gracias por tu calificacion. Tu cita ha sido agendada exitosamente.');
      setMostrarModalCalificacion(false);
      setCitaRecienAgendada(null);
      setCalificacionSeleccionada(0);
    } catch (error) {
      console.error('Error al guardar calificacion:', error);
      alert('Cita agendada exitosamente. No se pudo guardar la calificacion.');
      setMostrarModalCalificacion(false);
    }
  };

  // Omitir calificacion
  const handleOmitirCalificacion = () => {
    alert('Tu cita ha sido agendada exitosamente.');
    setMostrarModalCalificacion(false);
    setCitaRecienAgendada(null);
    setCalificacionSeleccionada(0);
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
                        <p><strong>Duracion:</strong> {horario.duracion_cita || horario.duracionCita} min</p>
                        <p><strong>Intervalo:</strong> {horario.intervalo} min</p>
                        <p><strong>Citas posibles:</strong> {calcularCitasPosibles(horario)}</p>
                      </div>
                      <details onToggle={(e) => {
                        if (e.target.open) {
                          // Recargar citas al abrir el detalle para verificar disponibilidad actualizada
                          cargarTodasLasCitas(true);
                        }
                      }}>
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

      {/* Modal de Calificacion de Satisfaccion */}
      {mostrarModalCalificacion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'white',
              fontSize: '28px'
            }}>
              &#10003;
            </div>
            
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '10px'
            }}>
              Cita Agendada Exitosamente
            </h3>
            
            <p style={{
              color: '#6b7280',
              marginBottom: '25px',
              fontSize: '14px'
            }}>
              Tu cita ha sido registrada para el {citaRecienAgendada?.dia} a las {citaRecienAgendada?.horario}
            </p>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '15px'
              }}>
                Como fue tu experiencia agendando la cita?
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {[1, 2, 3, 4, 5].map((estrella) => (
                  <button
                    key={estrella}
                    onClick={() => setCalificacionSeleccionada(estrella)}
                    onMouseEnter={() => setCalificacionHover(estrella)}
                    onMouseLeave={() => setCalificacionHover(0)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '36px',
                      padding: '5px',
                      transition: 'transform 0.2s',
                      transform: (calificacionHover >= estrella || calificacionSeleccionada >= estrella) ? 'scale(1.1)' : 'scale(1)',
                      color: (calificacionHover >= estrella || calificacionSeleccionada >= estrella) ? '#fbbf24' : '#d1d5db'
                    }}
                  >
                    &#9733;
                  </button>
                ))}
              </div>
              
              {calificacionSeleccionada > 0 && (
                <p style={{
                  marginTop: '10px',
                  fontSize: '14px',
                  color: '#059669',
                  fontWeight: '500'
                }}>
                  {calificacionSeleccionada === 1 && 'Muy malo'}
                  {calificacionSeleccionada === 2 && 'Malo'}
                  {calificacionSeleccionada === 3 && 'Regular'}
                  {calificacionSeleccionada === 4 && 'Bueno'}
                  {calificacionSeleccionada === 5 && 'Excelente'}
                </p>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleOmitirCalificacion}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Omitir
              </button>
              <button
                onClick={handleEnviarCalificacion}
                disabled={calificacionSeleccionada === 0}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: calificacionSeleccionada > 0 
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                    : '#e5e7eb',
                  color: calificacionSeleccionada > 0 ? 'white' : '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: calificacionSeleccionada > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Enviar Calificacion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago con Stripe */}
      <StripeCheckout 
        isOpen={mostrarCheckout}
        onClose={() => {
          setMostrarCheckout(false);
          setDatosCitaPago(null);
        }}
        citaData={datosCitaPago}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CalendarioLaboral;
