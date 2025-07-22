const express = require('express');
const router = express.Router();
const db = require('../db/db'); // Usa 'db' aquí

// Ruta para marcar una cita como atendida
router.put('/:id/atendida', async (req, res) => {
  const { id } = req.params;
  console.log('Intentando actualizar cita:', id);
  try {
    // Verifica si la cita existe antes de actualizar
    const citaExistente = await db.query('SELECT * FROM citas WHERE id = $1', [id]);
    console.log('Cita encontrada:', citaExistente.rows);

    if (citaExistente.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Realiza el update
    const result = await db.query('UPDATE citas SET estado = $1 WHERE id = $2', ['atendida', id]);
    console.log('Resultado de la actualización:', result);

    if (result.rowCount === 0) {
      return res.status(400).json({ success: false, message: 'No se actualizó ninguna cita. Verifica el ID.' });
    }

    res.json({ success: true, message: 'Cita marcada como atendida' });
  } catch (error) {
    console.error('Error al actualizar la cita:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar la cita', 
      error: error.message,
      detalle: error // Esto te dará el detalle completo del error
    });
  }
});

// Ruta para reporte de citas
router.post('/reporte', async (req, res) => {
  const { fechaInicio, fechaFin, campos } = req.body;

  console.log('Datos recibidos:', { fechaInicio, fechaFin, campos });

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: 'Faltan datos requeridos: fechaInicio y fechaFin.' });
  }

  const camposMap = {
    paciente: "CONCAT(users.name, ' ', users.apellido) AS paciente_nombre", // Concatenar nombre y apellido
    dia: 'citas.dia',
    horario: 'citas.horario',
    estado: 'citas.estado',
    especialidad: 'citas.especialidad'
  };
  const camposSelect = Object.keys(campos)
    .filter(key => campos[key])
    .map(key => camposMap[key])
    .join(', ');

  try {
    const queryCitas = `
      SELECT ${camposSelect}
      FROM citas
      JOIN users ON citas.paciente_id = users.id
      WHERE users.rol = 'paciente' AND citas.fecha_agendada BETWEEN $1 AND $2
      ORDER BY citas.fecha_agendada, citas.horario
    `;

    const queryTotales = `
      SELECT 
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) AS total_agendadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) AS total_canceladas,
        COUNT(CASE WHEN estado = 'atendida' THEN 1 END) AS total_atendidas
      FROM citas
      WHERE fecha_agendada BETWEEN $1 AND $2
    `;

    console.log('Consulta SQL para citas:', queryCitas);
    console.log('Consulta SQL para totales:', queryTotales);

    const citasResult = await db.query(queryCitas, [fechaInicio, fechaFin]);
    const totalesResult = await db.query(queryTotales, [fechaInicio, fechaFin]);

    console.log('Resultados de citas obtenidos:', citasResult.rows.length); // Log agregado

    res.json({
      citas: citasResult.rows,
      totales: totalesResult.rows[0] // Devuelve los totales como un objeto
    });
  } catch (err) {
    console.error('Error en el servidor:', err.message);
    console.error('Detalles del error:', err);
    res.status(500).json({ error: 'Error al generar el reporte.', detalles: err.message });
  }
});

module.exports = router;