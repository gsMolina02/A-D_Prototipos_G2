const { query } = require('../db/db');

// Crear notificación
const crearNotificacion = async (req, res) => {
  const { mensaje, destinatario_id } = req.body;

  try {
    const result = await query(
      'INSERT INTO notificaciones (mensaje, destinatario_id) VALUES ($1, $2) RETURNING *',
      [mensaje, destinatario_id]
    );

    res.status(201).json({ message: 'Notificación creada', notificacion: result.rows[0] });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener notificaciones por usuario
const obtenerNotificacionesPorUsuario = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const result = await query(
      'SELECT * FROM notificaciones WHERE destinatario_id = $1 ORDER BY created_at DESC',
      [usuario_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar notificación como leída
const marcarComoLeida = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      'UPDATE notificaciones SET leida = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.status(200).json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearNotificacion,
  obtenerNotificacionesPorUsuario,
  marcarComoLeida
};
