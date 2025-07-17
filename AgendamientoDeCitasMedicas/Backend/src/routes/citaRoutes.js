const express = require('express');
const router = express.Router();
const {
  crearCita,
  obtenerCitasPorPaciente,
  obtenerCitasPorDoctor,
  cancelarCita
} = require('../controllers/citaController');

router.post('/', crearCita);
router.get('/paciente/:paciente_id', obtenerCitasPorPaciente);
router.get('/doctor/:doctor_id', obtenerCitasPorDoctor);
router.put('/:id/cancelar', cancelarCita);

module.exports = router;
