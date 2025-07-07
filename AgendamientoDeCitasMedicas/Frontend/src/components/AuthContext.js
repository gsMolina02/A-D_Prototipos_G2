import React, { createContext, useContext, useState } from 'react';

const usuariosIniciales = [
  {
    name: 'Juan',
    apellido: 'Pérez',
    cedula: '1234567890',
    email: 'juan@ejemplo.com',
    telefono: '0999999999',
    password: '123456',
    rol: 'paciente'
  },
  {
    name: 'María',
    apellido: 'García',
    cedula: '0987654321',
    email: 'maria@ejemplo.com',
    telefono: '0988888888',
    password: 'admin123',
    rol: 'doctor'
  }
];

const citasIniciales = [];
const horariosIniciales = {};

export const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [citasAgendadas, setCitasAgendadas] = useState(citasIniciales);
  const [horariosPorDoctor, setHorariosPorDoctor] = useState(horariosIniciales);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionNoLeida, setNotificacionNoLeida] = useState(false);


  const cerrarSesion = () => {
    setUsuarioActual(null);
  };

  // --- Lógica de registro e inicio de sesión con usuarios quemados ---
  const registrarUsuario = (nuevoUsuario) => {
    const existe = usuarios.find(u => u.email === nuevoUsuario.email);
    if (existe) {
      return { success: false, message: 'Este correo ya está registrado.' };
    }
    setUsuarios([...usuarios, nuevoUsuario]);
    return { success: true, message: `Usuario registrado: ${nuevoUsuario.name}` };
  };

  const iniciarSesion = (email, password) => {
    const usuario = usuarios.find(u => u.email === email && u.password === password);
    if (usuario) {
      setUsuarioActual(usuario);
      return { success: true, usuario };
    }
    return { success: false, message: 'Credenciales incorrectas' };
  };

  // --- Lógica de horarios y citas (sin usuarios quemados) ---

  const guardarHorarioDoctor = (emailDoctor, nuevoHorario) => {
    setHorariosPorDoctor(prev => {
      const actuales = prev[emailDoctor] || [];
      return {
        ...prev,
        [emailDoctor]: [...actuales, nuevoHorario]
      };
    });
  };

  const limpiarHorariosDoctor = (emailDoctor) => {
    setHorariosPorDoctor(prev => ({
      ...prev,
      [emailDoctor]: []
    }));
  };

  const eliminarHorarioDoctor = (emailDoctor, horarioId) => {
    setHorariosPorDoctor(prev => ({
      ...prev,
      [emailDoctor]: prev[emailDoctor].filter(h => h.id !== horarioId)
    }));
  };

  const obtenerNombreDoctor = (email, name, apellido) => {
    return name && apellido ? `Dr/a. ${name} ${apellido}` : 'Doctor';
  };

  const agendarCita = (cita) => {
    if (!usuarioActual || usuarioActual.rol !== 'paciente') {
      return { success: false, message: 'Solo los pacientes pueden agendar citas' };
    }

    const citaActiva = citasAgendadas.find(
      c => c.pacienteId === usuarioActual.email && (c.estado === 'pendiente' || c.estado === 'confirmada')
    );

    if (citaActiva) {
      return { success: false, message: 'Ya tienes una cita agendada activa. No puedes agendar otra.' };
    }

    const citaExistente = citasAgendadas.find(
      c => c.pacienteId === usuarioActual.email &&
        c.dia === cita.dia &&
        c.horario === cita.horario &&
        c.doctorId === cita.doctorId
    );

    if (citaExistente) {
      return { success: false, message: 'Ya tienes una cita agendada en este horario con este doctor' };
    }

    const nuevo = {
      ...cita,
      id: Date.now(),
      pacienteId: usuarioActual.email,
      pacienteNombre: `${usuarioActual.name} ${usuarioActual.apellido}`,
      doctorNombre: obtenerNombreDoctor(cita.doctorId, cita.doctorName, cita.doctorApellido),
      fechaAgendada: new Date().toISOString(),
      estado: 'pendiente',
      especialidad: cita.especialidad || 'Consulta General'
    };

    setCitasAgendadas([...citasAgendadas, nuevo]);
    return {
      success: true,
      message: `Cita agendada exitosamente para el ${cita.dia} a las ${cita.horario}`
    };
  };

  const obtenerCitasPaciente = (pacienteId) => {
    return citasAgendadas
      .filter(c => c.pacienteId === pacienteId)
      .sort((a, b) => new Date(b.fechaAgendada) - new Date(a.fechaAgendada));
  };

  const obtenerCitasDoctor = (doctorId) => {
    return citasAgendadas
      .filter(c => c.doctorId === doctorId)
      .sort((a, b) => new Date(b.fechaAgendada) - new Date(a.fechaAgendada));
  };

  const cancelarCita = (citaId, motivo) => {
    setCitasAgendadas(prev =>
      prev.map(c =>
        c.id === citaId
          ? { ...c, estado: 'cancelada', motivoCancelacion: motivo }
          : c
      )
    );
    // Busca la cita cancelada
    const cita = citasAgendadas.find(c => c.id === citaId);
    if (cita) {
      const mensaje = `Cita del ${cita.dia} a las ${cita.horario} cancelada. Motivo: ${motivo}`;
      // Notifica a doctor y paciente
      setNotificaciones(prev => [
        ...prev,
        {
          id: Date.now(),
          mensaje,
          leida: false,
          destinatarios: [cita.pacienteId, cita.doctorId]
        }
      ]);
      setNotificacionNoLeida(true);
    }
    return { success: true, message: 'Cita cancelada exitosamente' };
  };

  const marcarNotificacionesLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNotificacionNoLeida(false);
  };

  return (
    <AuthContext.Provider value={{
      usuarios,
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
