const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Bloquear horario temporalmente (antes de iniciar pago)
router.post('/bloquear-horario', paymentController.bloquearHorario);

// Crear Payment Intent de Stripe
router.post('/crear-payment-intent', paymentController.crearPaymentIntent);

// Confirmar pago y crear cita
router.post('/confirmar-pago', paymentController.confirmarPagoYCrearCita);

// Verificar disponibilidad de horario
router.get('/verificar-disponibilidad', paymentController.verificarDisponibilidad);

// Liberar bloqueo de horario
router.post('/liberar-bloqueo', paymentController.liberarBloqueo);

// Obtener precio de la cita
router.get('/precio-cita', (req, res) => {
  res.json({ 
    precio: paymentController.PRECIO_CITA_DOLARES,
    moneda: 'USD',
    descripcion: 'Consulta médica'
  });
});

module.exports = router;
