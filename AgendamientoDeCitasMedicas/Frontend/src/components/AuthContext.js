import React, { createContext, useContext, useState } from 'react';
import { 
  crearCita, 
  obtenerCitasPorPaciente, 
  obtenerCitasPorDoctor, 
  cancelarCita as cancelarCitaAPI,
  crearHorario,
  obtenerHorariosPorDoctor,
  obtenerTodosLosHorarios,
  eliminarHorario,
  limpiarHorariosDoctor,
  registerUser,
  loginUser,
  marcarComoLeida
} from '../services/api';

export const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [citasAgendadas, setCitasAgendadas] = useState([]);
  const [horariosPorDoctor, setHorariosPorDoctor] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionNoLeida, setNotificacionNoLeida] = useState(false);

  const cerrarSesion = () => {
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
      console.error('Error en registrarUsuario:', error);
      const errorMessage = error.response?.data?.error || 'Error al registrar usuario';
      return { success: false, message: errorMessage };
    }
  };

  const iniciarSesion = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      
      // El backend devuelve { message: 'Login successful', user }
      if (response.data && response.data.user) {
        setUsuarioActual(response.data.user);
        return { success: true, message: 'Sesión iniciada exitosamente' };
      }
      
      return { success: false, message: response.data?.message || 'Credenciales inválidas' };
    } catch (error) {
      console.error('Error en iniciarSesion:', error);
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
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
      await limpiarHorariosDoctor(usuarioActual.id);
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
        [emailDoctor]: prev[emailDoctor].filter(h => h.id !== horarioId)
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
      console.error('Error al cargar horarios:', error);
      return [];
    }
  };

  const cargarTodosLosHorarios = async () => {
    try {
      const response = await obtenerTodosLosHorarios();
      return response.data;
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      return [];
    }
  };

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

      await crearCita(citaData);
      return { success: true, message: `Cita agendada exitosamente para el ${cita.dia} a las ${cita.horario}` };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Error al agendar cita' };
    }
  };

  const obtenerCitasPaciente = async (pacienteId) => {
    try {
      const response = await obtenerCitasPorPaciente(pacienteId);
      return response.data;
    } catch (error) {
      console.error('Error al obtener citas:', error);
      return [];
    }
  };

  const obtenerCitasDoctor = async (doctorId) => {
    try {
      const response = await obtenerCitasPorDoctor(doctorId);
      return response.data;
    } catch (error) {
      console.error('Error al obtener citas:', error);
      return [];
    }
  };

  const cancelarCita = async (citaId, motivo) => {
    try {
      await cancelarCitaAPI(citaId, motivo);
      return { success: true, message: 'Cita cancelada exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al cancelar cita' };
    }
  };

  // --- Funciones de notificaciones ---
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
      horariosPorDoctor,
      agendarCita,
      guardarHorarioDoctor,
      eliminarHorarioDoctor,
      limpiarHorariosDoctor,
      cargarHorariosPorDoctor,
      cargarTodosLosHorarios,
      obtenerCitasPaciente,
      obtenerCitasDoctor,
      cancelarCita,
      notificaciones,
      notificacionNoLeida,
      marcarNotificacionesLeidas,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
