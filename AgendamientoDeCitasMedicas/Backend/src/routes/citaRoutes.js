const express = require('express');
const router = express.Router();
const {
  crearCita,
  obtenerCitasPorPaciente,
  obtenerCitasPorDoctor,
  obtenerTodasLasCitas,
  cancelarCita,
  reprogramarCita,
  enviarRecordatoriosCitas
} = require('../controllers/citaController');

router.post('/', crearCita);
router.get('/', obtenerTodasLasCitas);
router.get('/paciente/:paciente_id', obtenerCitasPorPaciente);
router.get('/doctor/:doctor_id', obtenerCitasPorDoctor);
router.put('/:id/cancelar', cancelarCita);
router.put('/:id/reprogramar', reprogramarCita);
router.post('/recordatorios', async (req, res) => {
  const resultado = await enviarRecordatoriosCitas();
  res.json(resultado);
});

module.exports = router;
