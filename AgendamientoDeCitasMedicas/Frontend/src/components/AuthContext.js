import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  crearCita, 
  obtenerCitasPorPaciente, 
  obtenerCitasPorDoctor,
  obtenerTodasLasCitas,
  cancelarCita as cancelarCitaAPI,
  reprogramarCita as reprogramarCitaAPI,
  crearHorario,
  obtenerHorariosPorDoctor,
  obtenerTodosLosHorarios,
  eliminarHorario,
  limpiarHorariosDoctor as limpiarHorariosDoctorAPI,
  registerUser,
  loginUser,
  marcarComoLeida,
  obtenerNotificacionesPorUsuario,
  cerrarSesionAPI
} from '../services/api';

export const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [sesionActualId, setSesionActualId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [citasAgendadas, setCitasAgendadas] = useState([]);
  const [todasLasCitas, setTodasLasCitas] = useState([]);
  const [horariosPorDoctor, setHorariosPorDoctor] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionNoLeida, setNotificacionNoLeida] = useState(false);
  const [citasActualizadas, setCitasActualizadas] = useState(0); // Contador para forzar actualizaciones

  const cerrarSesion = async () => {
    // Registrar fin de sesion
    if (sesionActualId) {
      try {
        await cerrarSesionAPI(sesionActualId);
      } catch (error) {
        console.error('Error al cerrar sesion:', error);
      }
    }
    setSesionActualId(null);
    setUsuarioActual(null);
  };

  // --- Funciones de autenticación ---
  const registrarUsuario = async (userData) => {
    try {
      const response = await registerUser(userData);
      
      // El backend devuelve { message: 'User registered', user }
      if (response.data && response.data.user) {
        setUsuarioActual(response.data.user);
        return { success: true, message: 'Usuario registrado exitosamente' };
      }
      
      return { success: false, message: response.data?.message || 'Error al registrar usuario' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al registrar usuario';
      return { success: false, message: errorMessage };
    }
  };

  const iniciarSesion = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      
      // El backend devuelve { message: 'Login successful', user, sesionId }
      if (response.data && response.data.user) {
        setUsuarioActual(response.data.user);
        if (response.data.sesionId) {
          setSesionActualId(response.data.sesionId);
        }
        
        return { success: true, message: 'Sesion iniciada exitosamente' };
      }
      
      return { success: false, message: response.data?.message || 'Credenciales invalidas' };
    } catch (error) {
      // Verificar si la cuenta esta bloqueada
      if (error.response?.data?.bloqueado) {
        return { 
          success: false, 
          bloqueado: true,
          email: error.response?.data?.email || email,
          message: error.response?.data?.error || 'Cuenta bloqueada. Debe cambiar su contraseña.'
        };
      }
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesion';
      return { success: false, message: errorMessage };
    }
  };

  // --- Funciones de horarios usando Backend ---
  const guardarHorarioDoctor = async (emailDoctor, nuevoHorario) => {
    try {
      const horarioData = {
        doctor_id: usuarioActual.id,
        dia: nuevoHorario.dia,
        hora_inicio: nuevoHorario.horaInicio,
        hora_fin: nuevoHorario.horaFin,
        duracion_cita: nuevoHorario.duracionCita,
        intervalo: nuevoHorario.intervalo
      };
      
      await crearHorario(horarioData);
      // Actualizar estado local
      setHorariosPorDoctor(prev => {
        const actuales = prev[emailDoctor] || [];
        return {
          ...prev,
          [emailDoctor]: [...actuales, nuevoHorario]
        };
      });
      return { success: true, message: 'Horario guardado correctamente' };
    } catch (error) {
      return { success: false, message: 'Error al guardar horario' };
    }
  };

  const limpiarHorariosDoctor = async (emailDoctor) => {
    try {
      await limpiarHorariosDoctorAPI(usuarioActual.id);
      setHorariosPorDoctor(prev => ({
        ...prev,
        [emailDoctor]: []
      }));
      return { success: true, message: 'Horarios eliminados correctamente' };
    } catch (error) {
      return { success: false, message: 'Error al limpiar horarios' };
    }
  };

  const eliminarHorarioDoctor = async (emailDoctor, horarioId) => {
    try {
      await eliminarHorario(horarioId);
      setHorariosPorDoctor(prev => ({
        ...prev,
        [emailDoctor]: (prev[emailDoctor] || []).filter(h => h.id !== horarioId)
      }));
      return { success: true, message: 'Horario eliminado correctamente' };
    } catch (error) {
      return { success: false, message: 'Error al eliminar horario' };
    }
  };

  const cargarHorariosPorDoctor = async (doctorId) => {
    try {
      const response = await obtenerHorariosPorDoctor(doctorId);
      return response.data;
    } catch (error) {
      return [];
    }
  };

  const cargarTodosLosHorarios = async () => {
    try {
      const response = await obtenerTodosLosHorarios();
      return response.data;
    } catch (error) {
      return [];
    }
  };

  // eslint-disable-next-line no-unused-vars
  const obtenerNombreDoctor = (email, name, apellido) => {
    return name && apellido ? `Dr/a. ${name} ${apellido}` : 'Doctor';
  };

  // --- Funciones de citas usando Backend ---
  const agendarCita = async (cita) => {
    if (!usuarioActual || usuarioActual.rol !== 'paciente') {
      return { success: false, message: 'Solo los pacientes pueden agendar citas' };
    }

    try {
      const citaData = {
        paciente_id: usuarioActual.id,
        doctor_id: cita.doctorId,
        dia: cita.dia,
        horario: cita.horario,
        especialidad: cita.especialidad || 'Consulta General'
      };

      const response = await crearCita(citaData);
      
      // Cargar notificaciones actualizadas despues de agendar
      await cargarNotificaciones();
      
      return { 
        success: true, 
        message: `Cita agendada exitosamente para el ${cita.dia} a las ${cita.horario}`,
        citaId: response.data?.id || response.data?.cita?.id
      };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Error al agendar cita' };
    }
  };

  const obtenerCitasPaciente = async (pacienteId) => {
    try {
      const response = await obtenerCitasPorPaciente(pacienteId);
      return response.data;
    } catch (error) {
      return [];
    }
  };

  const obtenerCitasDoctor = async (doctorId) => {
    try {
      const response = await obtenerCitasPorDoctor(doctorId);
      return response.data;
    } catch (error) {
      return [];
    }
  };

  const cargarTodasLasCitas = useCallback(async (silencioso = false) => {
    try {
      const response = await obtenerTodasLasCitas();
      setTodasLasCitas(response.data);
      return response.data;
    } catch (error) {
      return [];
    }
  }, []); // Sin dependencias ya que no depende de ningun estado

  // Función para notificar cambios en las citas
  const notificarCambioEnCitas = () => {
    setCitasActualizadas(prev => prev + 1);
  };

  const cancelarCita = async (citaId, motivo) => {
    try {
      await cancelarCitaAPI(citaId, motivo);
      
      // Actualizar el estado global de citas para reflejar los cambios en el calendario (silencioso)
      await cargarTodasLasCitas(true);
      notificarCambioEnCitas();
      
      // Cargar notificaciones actualizadas después de cancelar
      await cargarNotificaciones();
      
      return { success: true, message: 'Cita cancelada exitosamente - Calendario actualizado' };
    } catch (error) {
      return { success: false, message: 'Error al cancelar cita' };
    }
  };

  const reprogramarCita = async (citaId, datosReprogramacion) => {
    try {
      await reprogramarCitaAPI(citaId, datosReprogramacion);
      
      // Actualizar el estado global de citas para reflejar los cambios en el calendario (silencioso)
      await cargarTodasLasCitas(true);
      notificarCambioEnCitas();
      
      // Cargar notificaciones actualizadas después de reprogramar
      await cargarNotificaciones();
      
      return { success: true, message: 'Cita reprogramada exitosamente - Calendario actualizado' };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Error al reprogramar cita' };
    }
  };

  // --- Funciones de notificaciones ---
  const cargarNotificaciones = useCallback(async () => {
    if (!usuarioActual) return;
    
    try {
      const response = await obtenerNotificacionesPorUsuario(usuarioActual.id);
      setNotificaciones(response.data);
      
      // Verificar si hay notificaciones no leídas
      const hayNoLeidas = response.data.some(n => !n.leida);
      setNotificacionNoLeida(hayNoLeidas);
    } catch (error) {
      // Error silencioso
    }
  }, [usuarioActual]);

  // Cargar notificaciones cuando el usuario cambie
  useEffect(() => {
    if (usuarioActual?.id) {
      cargarNotificaciones();
    } else {
      setNotificaciones([]);
      setNotificacionNoLeida(false);
    }
  }, [usuarioActual?.id]); // Solo depende del ID del usuario

  // Cargar todas las citas cuando se inicializa la aplicación o cambia el usuario
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        await cargarTodasLasCitas();
      } catch (error) {
        // Error silencioso
      }
    };

    cargarDatosIniciales();
  }, [usuarioActual?.id]); // Solo ejecutar cuando cambie el ID del usuario

  const marcarNotificacionesLeidas = async () => {
    try {
      const notificacionesNoLeidas = notificaciones.filter(n => !n.leida);
      await Promise.all(
        notificacionesNoLeidas.map(n => marcarComoLeida(n.id))
      );
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNotificacionNoLeida(false);
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      usuarioActual,
      setUsuarioActual,
      cerrarSesion,
      registrarUsuario,
      iniciarSesion,
      citasAgendadas,
      todasLasCitas,
      horariosPorDoctor,
      agendarCita,
      guardarHorarioDoctor,
      eliminarHorarioDoctor,
      limpiarHorariosDoctor,
      cargarHorariosPorDoctor,
      cargarTodosLosHorarios,
      cargarTodasLasCitas,
      obtenerCitasPaciente,
      obtenerCitasDoctor,
      cancelarCita,
      reprogramarCita,
      notificaciones,
      notificacionNoLeida,
      cargarNotificaciones,
      marcarNotificacionesLeidas,
      citasActualizadas, // Para forzar re-renders cuando cambien las citas
    }}>
      {children}
    </AuthContext.Provider>
  );
};
