const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Ruta base: /api/emails

// Enviar email de confirmación de cita
router.post('/confirmacion', emailController.enviarEmailConfirmacion);

// Enviar email de cancelación
router.post('/cancelacion', emailController.enviarEmailCancelacion);

// Enviar email de reprogramación
router.post('/reprogramacion', emailController.enviarEmailReprogramacion);

// Enviar recordatorios masivos
router.post('/recordatorios', emailController.enviarRecordatoriosMasivos);

// Enviar email personalizado
router.post('/personalizado', emailController.enviarEmailPersonalizado);

// Obtener estadísticas de emails
router.get('/estadisticas', emailController.obtenerEstadisticasEmail);

module.exports = router;
