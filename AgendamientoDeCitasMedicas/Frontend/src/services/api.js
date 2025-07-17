import axios from 'axios';

const apiUrl = 'http://localhost:5000/api';  // URL base del backend

// Usuarios
export const loginUser = async (data) => {
  return await axios.post(`${apiUrl}/login`, data);  // Realiza el POST a /api/login
};

export const registerUser = async (data) => {
  return await axios.post(`${apiUrl}/register`, data);  // Realiza el POST a /api/register
};

// Horarios
export const crearHorario = async (data) => {
  return await axios.post(`${apiUrl}/horarios`, data);
};

export const obtenerHorariosPorDoctor = async (doctorId) => {
  return await axios.get(`${apiUrl}/horarios/doctor/${doctorId}`);
};

export const obtenerTodosLosHorarios = async () => {
  return await axios.get(`${apiUrl}/horarios`);
};

export const eliminarHorario = async (id) => {
  return await axios.delete(`${apiUrl}/horarios/${id}`);
};

export const limpiarHorariosDoctor = async (doctorId) => {
  return await axios.delete(`${apiUrl}/horarios/doctor/${doctorId}`);
};

// Citas
export const crearCita = async (data) => {
  return await axios.post(`${apiUrl}/citas`, data);
};

export const obtenerCitasPorPaciente = async (pacienteId) => {
  return await axios.get(`${apiUrl}/citas/paciente/${pacienteId}`);
};

export const obtenerCitasPorDoctor = async (doctorId) => {
  return await axios.get(`${apiUrl}/citas/doctor/${doctorId}`);
};

export const cancelarCita = async (id, motivo) => {
  return await axios.put(`${apiUrl}/citas/${id}/cancelar`, { motivo });
};

// Notificaciones
export const crearNotificacion = async (data) => {
  return await axios.post(`${apiUrl}/notificaciones`, data);
};

export const obtenerNotificacionesPorUsuario = async (usuarioId) => {
  return await axios.get(`${apiUrl}/notificaciones/usuario/${usuarioId}`);
};

export const marcarComoLeida = async (id) => {
  return await axios.put(`${apiUrl}/notificaciones/${id}/leida`);
};
