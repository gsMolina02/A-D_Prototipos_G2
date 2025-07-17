const { query } = require('../db/db');

// Crear cita
const crearCita = async (req, res) => {
  const { paciente_id, doctor_id, dia, horario, especialidad } = req.body;

  try {
    // Verificar si ya existe una cita en ese horario
    const existingCita = await query(
      'SELECT * FROM citas WHERE doctor_id = $1 AND dia = $2 AND horario = $3 AND estado != $4',
      [doctor_id, dia, horario, 'cancelada']
    );

    if (existingCita.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una cita en este horario' });
    }

    const result = await query(
      'INSERT INTO citas (paciente_id, doctor_id, dia, horario, especialidad) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [paciente_id, doctor_id, dia, horario, especialidad || 'Consulta General']
    );

    res.status(201).json({ message: 'Cita agendada exitosamente', cita: result.rows[0] });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener citas por paciente
const obtenerCitasPorPaciente = async (req, res) => {
  const { paciente_id } = req.params;

  try {
    const result = await query(`
      SELECT c.*, u.name as doctor_name, u.apellido as doctor_apellido
      FROM citas c
      JOIN users u ON c.doctor_id = u.id
      WHERE c.paciente_id = $1
      ORDER BY c.fecha_agendada DESC
    `, [paciente_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener citas por doctor
const obtenerCitasPorDoctor = async (req, res) => {
  const { doctor_id } = req.params;

  try {
    const result = await query(`
      SELECT c.*, u.name as paciente_name, u.apellido as paciente_apellido
      FROM citas c
      JOIN users u ON c.paciente_id = u.id
      WHERE c.doctor_id = $1
      ORDER BY c.fecha_agendada DESC
    `, [doctor_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cancelar cita
const cancelarCita = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const result = await query(
      'UPDATE citas SET estado = $1, motivo_cancelacion = $2 WHERE id = $3 RETURNING *',
      ['cancelada', motivo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.status(200).json({ message: 'Cita cancelada exitosamente', cita: result.rows[0] });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearCita,
  obtenerCitasPorPaciente,
  obtenerCitasPorDoctor,
  cancelarCita
};
