const express = require('express');
const router = express.Router();
const {
  crearHorario,
  obtenerHorariosPorDoctor,
  obtenerTodosLosHorarios,
  eliminarHorario,
  limpiarHorariosDoctor
} = require('../controllers/horarioController');

router.post('/', crearHorario);
router.get('/doctor/:doctor_id', obtenerHorariosPorDoctor);
router.get('/', obtenerTodosLosHorarios);
router.delete('/:id', eliminarHorario);
router.delete('/doctor/:doctor_id', limpiarHorariosDoctor);

module.exports = router;
