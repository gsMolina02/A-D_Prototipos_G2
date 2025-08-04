const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Rutas para gestión manual de WhatsApp
router.post('/confirmacion', whatsappController.enviarWhatsAppConfirmacion);
router.post('/cancelacion', whatsappController.enviarWhatsAppCancelacion);
router.post('/reprogramacion', whatsappController.enviarWhatsAppReprogramacion);
router.post('/recordatorios-masivos', whatsappController.enviarRecordatoriosMasivos);
router.post('/personalizado', whatsappController.enviarWhatsAppPersonalizado);
router.get('/estadisticas', whatsappController.obtenerEstadisticasWhatsApp);

module.exports = router;
