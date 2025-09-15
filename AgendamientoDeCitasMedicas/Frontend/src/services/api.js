import axios from 'axios';

// Configurar URL base según el entorno
const apiUrl = process.env.NODE_ENV === 'production' 
  ? '/api'  // En producción, usar ruta relativa (Vercel maneja el routing)
  : 'http://localhost:5000/api';  // En desarrollo, usar localhost

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

export const obtenerTodasLasCitas = async () => {
  return await axios.get(`${apiUrl}/citas`);
};

export const marcarCitaAtendida = async (id) => {
  return await axios.put(`${apiUrl}/citas/${id}/atendida`);
};

// ========== SISTEMA DE EMAILS INDEPENDIENTE ==========

// Enviar email de confirmación
export const enviarEmailConfirmacion = async (citaId) => {
  return await axios.post(`${apiUrl}/emails/confirmacion`, { citaId });
};

// Enviar email de cancelación
export const enviarEmailCancelacion = async (citaId, motivo) => {
  return await axios.post(`${apiUrl}/emails/cancelacion`, { citaId, motivo });
};

// Enviar email de reprogramación
export const enviarEmailReprogramacion = async (citaId, nuevaFecha, nuevoHorario, motivo) => {
  return await axios.post(`${apiUrl}/emails/reprogramacion`, { 
    citaId, 
    nuevaFecha, 
    nuevoHorario, 
    motivo 
  });
};

// Enviar recordatorios masivos
export const enviarRecordatoriosMasivos = async () => {
  return await axios.post(`${apiUrl}/emails/recordatorios`);
};

// Enviar email personalizado
export const enviarEmailPersonalizado = async (destinatario, asunto, mensaje) => {
  return await axios.post(`${apiUrl}/emails/personalizado`, { 
    destinatario, 
    asunto, 
    mensaje 
  });
};

// Obtener estadísticas de emails
export const obtenerEstadisticasEmail = async () => {
  return await axios.get(`${apiUrl}/emails/estadisticas`);
};

// ========== FUNCIONES HEREDADAS (SIN EMAILS) ==========

export const cancelarCita = async (id, motivo) => {
  return await axios.put(`${apiUrl}/citas/${id}/cancelar`, { motivo });
};

export const reprogramarCita = async (id, data) => {
  return await axios.put(`${apiUrl}/citas/${id}/reprogramar`, data);
};

export const enviarRecordatorios = async () => {
  return await axios.post(`${apiUrl}/citas/recordatorios`);
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
