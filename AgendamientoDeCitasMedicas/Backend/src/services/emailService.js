const nodemailer = require('nodemailer');

// Configuración del transportador de email
const createTransporter = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'outlook';
  
  switch (emailProvider.toLowerCase()) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
    case 'outlook':
    case 'hotmail':
      return nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          ciphers: 'SSLv3'
        }
      });
      
    case 'test':
      // Modo de prueba - funcionamiento silencioso
      return {
        sendMail: async (options) => {
          return {
            messageId: 'test-' + Date.now(),
            response: 'Email simulado'
          };
        }
      };
      
    default:
      throw new Error(`Proveedor de email no soportado: ${emailProvider}`);
  }
};

// Plantillas de email
const emailTemplates = {
  citaConfirmada: (datosCita) => ({
    subject: '✅ Confirmación de Cita Médica',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🏥 Cita Médica Confirmada</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #111827; margin-top: 0;">Estimado/a ${datosCita.pacienteNombre},</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Su cita médica ha sido confirmada exitosamente. A continuación encontrará los detalles:
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">📋 Detalles de la Cita</h3>
            <div style="display: grid; gap: 10px;">
              <div><strong>📅 Fecha:</strong> ${datosCita.fecha}</div>
              <div><strong>🕐 Hora:</strong> ${datosCita.horario}</div>
              <div><strong>👨‍⚕️ Doctor:</strong> ${datosCita.doctorNombre}</div>
              <div><strong>📍 Consultorio:</strong> Clínica Médica</div>
            </div>
          </div>
          
          <div style="background: #dcfce7; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #047857;">
              <strong>💡 Recordatorio:</strong> Por favor llegue 15 minutos antes de su cita programada.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Si necesita reprogramar o cancelar su cita, por favor contacte con nosotros.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
      </div>
    `
  }),

  citaReprogramada: (datosCita) => ({
    subject: '🔄 Cita Médica Reprogramada',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🔄 Cita Reprogramada</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #111827; margin-top: 0;">Estimado/a ${datosCita.pacienteNombre},</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Su cita médica ha sido reprogramada. A continuación encontrará los nuevos detalles:
          </p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #d97706; margin-top: 0;">📋 Nueva Fecha y Hora</h3>
            <div style="display: grid; gap: 10px;">
              <div><strong>📅 Nueva Fecha:</strong> ${datosCita.nuevaFecha}</div>
              <div><strong>🕐 Nueva Hora:</strong> ${datosCita.nuevoHorario}</div>
              <div><strong>👨‍⚕️ Doctor:</strong> ${datosCita.doctorNombre}</div>
              ${datosCita.motivo ? `<div><strong>💬 Motivo:</strong> ${datosCita.motivo}</div>` : ''}
            </div>
          </div>
          
          <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1d4ed8;">
              <strong>ℹ️ Importante:</strong> Su cita anterior ha sido cancelada y reemplazada por esta nueva fecha.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
      </div>
    `
  }),

  citaCancelada: (datosCita) => ({
    subject: '❌ Cita Médica Cancelada',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">❌ Cita Cancelada</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #111827; margin-top: 0;">Estimado/a ${datosCita.pacienteNombre},</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Lamentamos informarle que su cita médica ha sido cancelada.
          </p>
          
          <div style="background: #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">📋 Detalles de la Cita Cancelada</h3>
            <div style="display: grid; gap: 10px;">
              <div><strong>📅 Fecha:</strong> ${datosCita.fecha}</div>
              <div><strong>🕐 Hora:</strong> ${datosCita.horario}</div>
              <div><strong>👨‍⚕️ Doctor:</strong> ${datosCita.doctorNombre}</div>
              ${datosCita.motivo ? `<div><strong>💬 Motivo:</strong> ${datosCita.motivo}</div>` : ''}
            </div>
          </div>
          
          <div style="background: #e0f2fe; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #0e7490;">
              <strong>📞 Contacto:</strong> Si desea programar una nueva cita, por favor contacte con nosotros.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
      </div>
    `
  }),

  recordatorio: (datosCita) => ({
    subject: '🔔 Recordatorio: Cita Médica Mañana',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🔔 Recordatorio de Cita</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #111827; margin-top: 0;">Estimado/a ${datosCita.pacienteNombre},</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Le recordamos que tiene una cita médica programada para mañana:
          </p>
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">📋 Detalles de su Cita</h3>
            <div style="display: grid; gap: 10px;">
              <div><strong>📅 Fecha:</strong> ${datosCita.fecha}</div>
              <div><strong>🕐 Hora:</strong> ${datosCita.horario}</div>
              <div><strong>👨‍⚕️ Doctor:</strong> ${datosCita.doctorNombre}</div>
              <div><strong>📍 Consultorio:</strong> Clínica Médica</div>
            </div>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #b45309;">
              <strong>⏰ Importante:</strong> Por favor llegue 15 minutos antes de su cita programada.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
      </div>
    `
  })
};

// Función principal para enviar emails
const enviarEmail = async (tipo, destinatario, datosCita) => {
  try {
    const transporter = createTransporter();
    const template = emailTemplates[tipo](datosCita);

    const mailOptions = {
      from: `"Sistema de Citas Médicas" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Funciones específicas para cada tipo de notificación
const notificarCitaConfirmada = async (emailPaciente, datosCita) => {
  return await enviarEmail('citaConfirmada', emailPaciente, datosCita);
};

const notificarCitaReprogramada = async (emailPaciente, datosCita) => {
  return await enviarEmail('citaReprogramada', emailPaciente, datosCita);
};

const notificarCitaCancelada = async (emailPaciente, datosCita) => {
  return await enviarEmail('citaCancelada', emailPaciente, datosCita);
};

const enviarRecordatorio = async (emailPaciente, datosCita) => {
  return await enviarEmail('recordatorio', emailPaciente, datosCita);
};

module.exports = {
  notificarCitaConfirmada,
  notificarCitaReprogramada,
  notificarCitaCancelada,
  enviarRecordatorio
};
