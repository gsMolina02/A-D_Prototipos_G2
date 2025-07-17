const express = require('express');
const router = express.Router();
const {
  crearNotificacion,
  obtenerNotificacionesPorUsuario,
  marcarComoLeida
} = require('../controllers/notificacionController');

router.post('/', crearNotificacion);
router.get('/usuario/:usuario_id', obtenerNotificacionesPorUsuario);
router.put('/:id/leida', marcarComoLeida);

module.exports = router;
