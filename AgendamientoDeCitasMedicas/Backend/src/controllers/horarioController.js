const { query } = require('../db/db');

// Crear horario
const crearHorario = async (req, res) => {
  const { doctor_id, dia, hora_inicio, hora_fin, duracion_cita, intervalo } = req.body;

  try {
    // Verificar si ya existe un horario para ese doctor en ese día
    const existingSchedule = await query(
      'SELECT * FROM horarios WHERE doctor_id = $1 AND dia = $2',
      [doctor_id, dia]
    );

    if (existingSchedule.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un horario para este día' });
    }

    const result = await query(
      'INSERT INTO horarios (doctor_id, dia, hora_inicio, hora_fin, duracion_cita, intervalo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [doctor_id, dia, hora_inicio, hora_fin, duracion_cita, intervalo]
    );

    res.status(201).json({ message: 'Horario creado exitosamente', horario: result.rows[0] });
  } catch (error) {
    console.error('Error al crear horario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener horarios por doctor
const obtenerHorariosPorDoctor = async (req, res) => {
  const { doctor_id } = req.params;

  try {
    const result = await query(
      'SELECT * FROM horarios WHERE doctor_id = $1 ORDER BY dia, hora_inicio',
      [doctor_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los horarios (para pacientes)
const obtenerTodosLosHorarios = async (req, res) => {
  try {
    const result = await query(`
      SELECT h.*, u.name as doctor_name, u.apellido as doctor_apellido 
      FROM horarios h 
      JOIN users u ON h.doctor_id = u.id 
      WHERE u.rol = 'doctor'
      ORDER BY h.dia, h.hora_inicio
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar horario
const eliminarHorario = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM horarios WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    res.status(200).json({ message: 'Horario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Limpiar todos los horarios de un doctor
const limpiarHorariosDoctor = async (req, res) => {
  const { doctor_id } = req.params;

  try {
    await query('DELETE FROM horarios WHERE doctor_id = $1', [doctor_id]);
    res.status(200).json({ message: 'Horarios eliminados exitosamente' });
  } catch (error) {
    console.error('Error al limpiar horarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearHorario,
  obtenerHorariosPorDoctor,
  obtenerTodosLosHorarios,
  eliminarHorario,
  limpiarHorariosDoctor
};
