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

    // Obtener información del paciente y doctor para las notificaciones
    const pacienteInfo = await query('SELECT name, apellido FROM users WHERE id = $1', [paciente_id]);
    const doctorInfo = await query('SELECT name, apellido FROM users WHERE id = $1', [doctor_id]);

    if (pacienteInfo.rows.length === 0 || doctorInfo.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const paciente = pacienteInfo.rows[0];
    const doctor = doctorInfo.rows[0];

    // Crear la cita
    const result = await query(
      'INSERT INTO citas (paciente_id, doctor_id, dia, horario, especialidad) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [paciente_id, doctor_id, dia, horario, especialidad || 'Consulta General']
    );

    const nuevaCita = result.rows[0];
    const fechaCita = `${dia} ${horario}`;

    // Crear notificaciones para ambos usuarios
    
    // Notificación para el paciente
    const mensajePaciente = `✅ Su cita ha sido agendada para el ${fechaCita} con Dr. ${doctor.name} ${doctor.apellido}. ¡No olvide asistir puntualmente!`;
    await query(
      'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
      [mensajePaciente, paciente_id]
    );

    // Notificación para el doctor
    const mensajeDoctor = `📅 Nueva cita agendada para el ${fechaCita} con ${paciente.name} ${paciente.apellido}. Especialidad: ${especialidad || 'Consulta General'}`;
    await query(
      'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
      [mensajeDoctor, doctor_id]
    );

    res.status(201).json({ 
      message: 'Cita agendada exitosamente y notificaciones enviadas', 
      cita: nuevaCita 
    });
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
    // Primero obtener la información completa de la cita antes de cancelarla
    const citaInfo = await query(`
      SELECT c.*, 
             p.name as paciente_name, p.apellido as paciente_apellido,
             d.name as doctor_name, d.apellido as doctor_apellido
      FROM citas c
      JOIN users p ON c.paciente_id = p.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.id = $1
    `, [id]);

    if (citaInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const cita = citaInfo.rows[0];

    // Cancelar la cita
    const result = await query(
      'UPDATE citas SET estado = $1, motivo_cancelacion = $2 WHERE id = $3 RETURNING *',
      ['cancelada', motivo, id]
    );

    // Crear notificaciones para ambos usuarios
    const fechaCita = `${cita.dia} ${cita.horario}`;
    
    // Notificación para el paciente
    const mensajePaciente = `🚫 Su cita del ${fechaCita} con Dr. ${cita.doctor_name} ${cita.doctor_apellido} ha sido cancelada. Motivo: ${motivo || 'No especificado'}`;
    await query(
      'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
      [mensajePaciente, cita.paciente_id]
    );

    // Notificación para el doctor
    const mensajeDoctor = `🚫 La cita del ${fechaCita} con ${cita.paciente_name} ${cita.paciente_apellido} ha sido cancelada. Motivo: ${motivo || 'No especificado'}`;
    await query(
      'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
      [mensajeDoctor, cita.doctor_id]
    );

    res.status(200).json({ 
      message: 'Cita cancelada exitosamente y notificaciones enviadas', 
      cita: result.rows[0] 
    });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todas las citas
const obtenerTodasLasCitas = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, 
             p.name as paciente_name, p.apellido as paciente_apellido,
             d.name as doctor_name, d.apellido as doctor_apellido
      FROM citas c
      JOIN users p ON c.paciente_id = p.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.estado != 'cancelada'
      ORDER BY c.fecha_agendada DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener todas las citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reprogramar cita
const reprogramarCita = async (req, res) => {
  const { id } = req.params;
  const { nuevo_dia, nuevo_horario, motivo } = req.body;

  try {
    // Primero obtener la información completa de la cita actual
    const citaActualInfo = await query(`
      SELECT c.*, 
             p.name as paciente_name, p.apellido as paciente_apellido,
             d.name as doctor_name, d.apellido as doctor_apellido
      FROM citas c
      JOIN users p ON c.paciente_id = p.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.id = $1 AND c.estado != 'cancelada'
    `, [id]);

    if (citaActualInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada o ya está cancelada' });
    }

    const citaActual = citaActualInfo.rows[0];

    // Verificar si ya existe una cita en el nuevo horario
    const citaExistente = await query(
      'SELECT * FROM citas WHERE doctor_id = $1 AND dia = $2 AND horario = $3 AND estado != $4 AND id != $5',
      [citaActual.doctor_id, nuevo_dia, nuevo_horario, 'cancelada', id]
    );

    if (citaExistente.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una cita en el nuevo horario seleccionado' });
    }

    // Guardar información de la cita anterior para las notificaciones
    const fechaAnterior = `${citaActual.dia} ${citaActual.horario}`;
    const fechaNueva = `${nuevo_dia} ${nuevo_horario}`;

    // Actualizar la cita con la nueva fecha y hora
    const result = await query(
      'UPDATE citas SET dia = $1, horario = $2, fecha_agendada = NOW() WHERE id = $3 RETURNING *',
      [nuevo_dia, nuevo_horario, id]
    );

    const citaReprogramada = result.rows[0];

    // Crear notificaciones para ambos usuarios
    
    // Notificación para el paciente
    const mensajePaciente = `📅 Su cita ha sido reprogramada exitosamente.
Fecha anterior: ${fechaAnterior}
Nueva fecha: ${fechaNueva}
Doctor: Dr. ${citaActual.doctor_name} ${citaActual.doctor_apellido}
Especialidad: ${citaActual.especialidad}
${motivo ? `Motivo: ${motivo}` : ''}
¡No olvide asistir puntualmente a su nueva cita!`;

    await query(
      'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
      [mensajePaciente, citaActual.paciente_id]
    );

    // Notificación para el doctor
    const mensajeDoctor = `📅 Cita reprogramada en su agenda.
Paciente: ${citaActual.paciente_name} ${citaActual.paciente_apellido}
Fecha anterior: ${fechaAnterior}
Nueva fecha: ${fechaNueva}
Especialidad: ${citaActual.especialidad}
${motivo ? `Motivo: ${motivo}` : ''}`;

    await query(
      'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
      [mensajeDoctor, citaActual.doctor_id]
    );

    res.status(200).json({ 
      message: 'Cita reprogramada exitosamente y notificaciones enviadas',
      citaAnterior: {
        dia: citaActual.dia,
        horario: citaActual.horario
      },
      citaNueva: citaReprogramada
    });
  } catch (error) {
    console.error('Error al reprogramar cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función para enviar recordatorios de citas (24 horas antes)
const enviarRecordatoriosCitas = async () => {
  try {
    // Calcular fecha y hora objetivo (24 horas desde ahora)
    const ahora = new Date();
    const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
    
    // Formatear fecha para comparación (YYYY-MM-DD)
    const fechaObjetivo = en24Horas.toISOString().split('T')[0];
    
    // Obtener todas las citas para la fecha objetivo
    const citasQuery = `
      SELECT c.*, 
             p.name as paciente_nombre, p.apellido as paciente_apellido, p.email as paciente_email,
             d.name as doctor_nombre, d.apellido as doctor_apellido, d.email as doctor_email
      FROM citas c
      JOIN users p ON c.paciente_id = p.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.dia = $1 AND c.estado != 'cancelada'
    `;
    
    const result = await query(citasQuery, [fechaObjetivo]);
    const citas = result.rows;
    
    for (const cita of citas) {
      // Verificar si ya se envió recordatorio para esta cita
      const recordatorioExistente = await query(
        'SELECT id FROM notificaciones WHERE mensaje LIKE $1 AND destinatario_id = $2',
        [`%Recordatorio: Su cita de mañana%${cita.dia}%${cita.horario}%`, cita.paciente_id]
      );
      
      if (recordatorioExistente.rows.length === 0) {
        // Crear recordatorio para el paciente
        const mensajePaciente = `🔔 Recordatorio: Su cita de mañana ${cita.dia} a las ${cita.horario} con Dr. ${cita.doctor_nombre} ${cita.doctor_apellido}. Especialidad: ${cita.especialidad}. ¡No olvide asistir!`;
        
        await query(
          'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
          [mensajePaciente, cita.paciente_id]
        );
        
        // Crear recordatorio para el doctor
        const mensajeDoctor = `🔔 Recordatorio: Mañana ${cita.dia} a las ${cita.horario} tiene cita con ${cita.paciente_nombre} ${cita.paciente_apellido}. Especialidad: ${cita.especialidad}`;
        
        await query(
          'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2)',
          [mensajeDoctor, cita.doctor_id]
        );
      }
    }
    
    return { success: true, citasProcessadas: citas.length };
  } catch (error) {
    console.error('❌ Error al enviar recordatorios:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  crearCita,
  obtenerCitasPorPaciente,
  obtenerCitasPorDoctor,
  obtenerTodasLasCitas,
  cancelarCita,
  reprogramarCita,
  enviarRecordatoriosCitas
};
