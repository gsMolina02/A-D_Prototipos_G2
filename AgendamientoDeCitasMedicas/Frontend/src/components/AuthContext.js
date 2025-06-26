import React, { createContext, useContext, useState } from 'react';

// Datos quemados iniciales
const usuariosIniciales = [
  {
    nombre: 'Juan',
    apellido: 'Pérez',
    cedula: '1234567890',
    email: 'juan@ejemplo.com',
    telefono: '0999999999',
    contrasena: '123456',
    rol: 'paciente'
  },
  {
    nombre: 'María',
    apellido: 'García',
    cedula: '0987654321',
    email: 'maria@ejemplo.com',
    telefono: '0988888888',
    contrasena: 'admin123',
    rol: 'doctor'
  }
];

const citasIniciales = [];
const horariosIniciales = {
  'maria@ejemplo.com': [] // Horarios del doctor de prueba
};

// Crear contexto
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

  const registrarUsuario = (nuevoUsuario) => {
    const existe = usuarios.find(u => u.email === nuevoUsuario.email);
    if (existe) {
      return { success: false, message: 'Este correo ya está registrado.' };
    }
    setUsuarios([...usuarios, nuevoUsuario]);
    return { success: true, message: `Usuario registrado: ${nuevoUsuario.nombre}` };
  };

  const iniciarSesion = (email, password) => {
    const usuario = usuarios.find(u => u.email === email && u.contrasena === password);
    if (usuario) {
      setUsuarioActual(usuario);
      return { success: true, usuario };
    }
    return { success: false, message: 'Credenciales incorrectas' };
  };

  const cerrarSesion = () => {
    setUsuarioActual(null);
  };

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

  const obtenerNombreDoctor = (email) => {
    const doctor = usuarios.find(u => u.email === email && u.rol === 'doctor');
    return doctor ? `Dr/a. ${doctor.nombre} ${doctor.apellido}` : 'Doctor';
  };

  const agendarCita = (cita) => {
    if (!usuarioActual || usuarioActual.rol !== 'paciente') {
      return { success: false, message: 'Solo los pacientes pueden agendar citas' };
    }

    // Validar que el paciente no tenga otra cita activa (pendiente o confirmada)
    const citaActiva = citasAgendadas.find(
      c => c.pacienteId === usuarioActual.email && (c.estado === 'pendiente' || c.estado === 'confirmada')
    );

    if (citaActiva) {
      return { success: false, message: 'Ya tienes una cita agendada activa. No puedes agendar otra.' };
    }

    // Validar si ya tiene una cita en ese día, horario y doctor (más restrictivo)
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
      pacienteNombre: `${usuarioActual.nombre} ${usuarioActual.apellido}`,
      doctorNombre: obtenerNombreDoctor(cita.doctorId),
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

  const cancelarCita = (citaId) => {
    const cita = citasAgendadas.find(c => c.id === citaId);

    if (!cita) return { success: false, message: 'Cita no encontrada' };

    const esPaciente = usuarioActual?.rol === 'paciente' && cita.pacienteId === usuarioActual.email;
    const esDoctor = usuarioActual?.rol === 'doctor' && cita.doctorId === usuarioActual.email;

    if (!esPaciente && !esDoctor) {
      return { success: false, message: 'No tienes permisos para cancelar esta cita' };
    }

    setCitasAgendadas(citasAgendadas.filter(c => c.id !== citaId));
    return { success: true, message: 'Cita cancelada exitosamente' };
  };

  return (
    <AuthContext.Provider value={{
      usuarios,
      usuarioActual,
      citasAgendadas,
      horariosPorDoctor,
      registrarUsuario,
      iniciarSesion,
      cerrarSesion,
      agendarCita,
      guardarHorarioDoctor,
      eliminarHorarioDoctor,
      limpiarHorariosDoctor,
      obtenerCitasPaciente,
      obtenerCitasDoctor,
      cancelarCita,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
