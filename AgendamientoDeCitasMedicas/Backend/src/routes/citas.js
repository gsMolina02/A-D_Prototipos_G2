const express = require('express');
const router = express.Router();
const pool = require('../db/db'); // Ajusta según tu conexión a la base de datos

router.post('/reporte', async (req, res) => {
  const { doctorId, fechaInicio, fechaFin, campos } = req.body;

  console.log('Datos recibidos:', { doctorId, fechaInicio, fechaFin, campos });

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
      WHERE users.rol = 'paciente' AND citas.dia BETWEEN $1 AND $2
      ORDER BY citas.dia, citas.horario
    `;

    const queryTotales = `
      SELECT 
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) AS total_agendadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) AS total_canceladas
      FROM citas
      WHERE dia BETWEEN $1 AND $2
    `;

    console.log('Consulta SQL para citas:', queryCitas);
    console.log('Consulta SQL para totales:', queryTotales);

    const citasResult = await pool.query(queryCitas, [fechaInicio, fechaFin]);
    const totalesResult = await pool.query(queryTotales, [fechaInicio, fechaFin]);

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