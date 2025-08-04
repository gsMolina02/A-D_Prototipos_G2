const twilio = require('twilio');

// Configuración del cliente de Twilio
const createTwilioClient = () => {
  const whatsappProvider = process.env.WHATSAPP_PROVIDER || 'twilio';
  
  switch (whatsappProvider.toLowerCase()) {
    case 'twilio':
      return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
    case 'test':
      // Modo de prueba - funcionamiento silencioso
      return {
        messages: {
          create: async (options) => {
            return {
              sid: 'test-' + Date.now(),
              status: 'enviado simulado'
            };
          }
        }
      };
      
    default:
      throw new Error(`Proveedor de WhatsApp no soportado: ${whatsappProvider}`);
  }
};

// Plantillas de mensajes de WhatsApp
const plantillas = {
  confirmacion: (datos) => `
🏥 *Sistema de Citas Médicas*

✅ *CITA CONFIRMADA*

Estimado/a ${datos.pacienteNombre},

Su cita ha sido agendada exitosamente:

📅 *Fecha:* ${datos.fecha}
⏰ *Horario:* ${datos.horario}
👨‍⚕️ *Doctor:* ${datos.doctorNombre}
🩺 *Especialidad:* ${datos.especialidad || 'Consulta General'}

Por favor, llegue 15 minutos antes de su cita.

¡Esperamos verle pronto! 🙂
  `.trim(),

  cancelacion: (datos) => `
🏥 *Sistema de Citas Médicas*

❌ *CITA CANCELADA*

Estimado/a ${datos.pacienteNombre},

Su cita ha sido cancelada:

📅 *Fecha:* ${datos.fecha}
⏰ *Horario:* ${datos.horario}
👨‍⚕️ *Doctor:* ${datos.doctorNombre}
📝 *Motivo:* ${datos.motivo}

Para reagendar, puede contactarnos o usar nuestro sistema.

Disculpe las molestias.
  `.trim(),

  reprogramacion: (datos) => `
🏥 *Sistema de Citas Médicas*

🔄 *CITA REPROGRAMADA*

Estimado/a ${datos.pacienteNombre},

Su cita ha sido reprogramada:

📅 *Nueva fecha:* ${datos.nuevaFecha}
⏰ *Nuevo horario:* ${datos.nuevoHorario}
👨‍⚕️ *Doctor:* ${datos.doctorNombre}
📝 *Motivo:* ${datos.motivo}

Por favor, anote la nueva fecha y horario.

¡Esperamos verle pronto! 🙂
  `.trim(),

  recordatorio: (datos) => `
🏥 *Sistema de Citas Médicas*

⏰ *RECORDATORIO DE CITA*

Estimado/a ${datos.pacienteNombre},

Le recordamos su cita para mañana:

📅 *Fecha:* ${datos.fecha}
⏰ *Horario:* ${datos.horario}
👨‍⚕️ *Doctor:* ${datos.doctorNombre}

Por favor, llegue 15 minutos antes.

¡Le esperamos! 🙂
  `.trim()
};

// Funciones principales del servicio
const whatsappService = {
  // Notificar confirmación de cita
  notificarCitaConfirmada: async (telefono, datos) => {
    try {
      const client = createTwilioClient();
      const mensaje = plantillas.confirmacion(datos);
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefono}`,
        body: mensaje
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Notificar cancelación de cita
  notificarCitaCancelada: async (telefono, datos) => {
    try {
      const client = createTwilioClient();
      const mensaje = plantillas.cancelacion(datos);
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefono}`,
        body: mensaje
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Notificar reprogramación de cita
  notificarCitaReprogramada: async (telefono, datos) => {
    try {
      const client = createTwilioClient();
      const mensaje = plantillas.reprogramacion(datos);
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefono}`,
        body: mensaje
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Enviar recordatorio de cita
  enviarRecordatorio: async (telefono, datos) => {
    try {
      const client = createTwilioClient();
      const mensaje = plantillas.recordatorio(datos);
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefono}`,
        body: mensaje
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Enviar mensaje personalizado
  enviarMensajePersonalizado: async (telefono, mensaje) => {
    try {
      const client = createTwilioClient();
      
      const mensajeCompleto = `
🏥 *Sistema de Citas Médicas*

${mensaje}

---
Mensaje enviado desde el Sistema de Citas Médicas
      `.trim();
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefono}`,
        body: mensajeCompleto
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = whatsappService;
