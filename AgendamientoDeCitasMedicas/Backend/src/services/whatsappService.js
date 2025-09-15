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
  // Función auxiliar para formatear número de teléfono
  formatearTelefono: (telefono) => {
    // Si ya tiene formato correcto, devolverlo
    if (telefono.startsWith('+593')) {
      return telefono;
    }
    
    // Si empieza con 593, agregar +
    if (telefono.startsWith('593')) {
      return '+' + telefono;
    }
    
    // Si empieza con 0, convertir formato nacional a internacional
    if (telefono.startsWith('0')) {
      return '+593' + telefono.substring(1);
    }
    
    // Si es solo número (9 o 10 dígitos), agregar código de país
    if (telefono.length === 9 || telefono.length === 10) {
      return '+593' + telefono;
    }
    
    // Devolver tal como está si no coincide con ningún patrón
    return telefono;
  },

  // Notificar confirmación de cita
  notificarCitaConfirmada: async (telefono, datos) => {
    try {
      const client = createTwilioClient();
      const mensaje = plantillas.confirmacion(datos);
      const telefonoFormateado = whatsappService.formatearTelefono(telefono);
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefonoFormateado}`,
        body: mensaje
      });

      console.log(`✅ WhatsApp confirmación enviado: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error(`❌ Error enviando WhatsApp confirmación: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // Notificar cancelación de cita
  notificarCitaCancelada: async (telefono, datos) => {
    try {
      const client = createTwilioClient();
      const mensaje = plantillas.cancelacion(datos);
      const telefonoFormateado = whatsappService.formatearTelefono(telefono);
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefonoFormateado}`,
        body: mensaje
      });

      console.log(`✅ WhatsApp cancelación enviado: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error(`❌ Error enviando WhatsApp cancelación: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // Notificar reprogramación de cita
  notificarCitaReprogramada: async (telefono, datos) => {
    try {
      const client = createTwilioClient();
      const mensaje = plantillas.reprogramacion(datos);
      const telefonoFormateado = whatsappService.formatearTelefono(telefono);
      
      const result = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${telefonoFormateado}`,
        body: mensaje
      });

      console.log(`✅ WhatsApp reprogramación enviado: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error(`❌ Error enviando WhatsApp reprogramación: ${error.message}`);
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
