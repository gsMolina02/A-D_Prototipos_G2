const { query } = require('../db/db');
const emailService = require('../services/emailService');

// Enviar email de confirmación de cita
const enviarEmailConfirmacion = async (req, res) => {
  const { citaId } = req.body;

  try {
    // Obtener datos de la cita
    const citaResult = await query(`
      SELECT c.*, u.email, u.name, u.apellido, d.name as doctor_nombre 
      FROM citas c
      JOIN users u ON c.paciente_id = u.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.id = $1
    `, [citaId]);

    if (citaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }

    const cita = citaResult.rows[0];

    // Enviar email
    const resultado = await emailService.notificarCitaConfirmada(cita.email, {
      pacienteNombre: `${cita.name} ${cita.apellido}`,
      doctorNombre: cita.doctor_nombre,
      fecha: cita.dia,
      horario: cita.horario
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Email de confirmación enviado exitosamente',
        messageId: resultado.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar email',
        error: resultado.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Enviar email de cancelación
const enviarEmailCancelacion = async (req, res) => {
  const { citaId, motivo } = req.body;

  try {
    const citaResult = await query(`
      SELECT c.*, u.email, u.name, u.apellido, d.name as doctor_nombre 
      FROM citas c
      JOIN users u ON c.paciente_id = u.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.id = $1
    `, [citaId]);

    if (citaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }

    const cita = citaResult.rows[0];

    const resultado = await emailService.notificarCitaCancelada(cita.email, {
      pacienteNombre: `${cita.name} ${cita.apellido}`,
      doctorNombre: cita.doctor_nombre,
      fecha: cita.dia,
      horario: cita.horario,
      motivo: motivo || 'No especificado'
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Email de cancelación enviado exitosamente',
        messageId: resultado.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar email',
        error: resultado.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Enviar email de reprogramación
const enviarEmailReprogramacion = async (req, res) => {
  const { citaId, nuevaFecha, nuevoHorario, motivo } = req.body;

  try {
    const citaResult = await query(`
      SELECT c.*, u.email, u.name, u.apellido, d.name as doctor_nombre 
      FROM citas c
      JOIN users u ON c.paciente_id = u.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.id = $1
    `, [citaId]);

    if (citaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }

    const cita = citaResult.rows[0];

    const resultado = await emailService.notificarCitaReprogramada(cita.email, {
      pacienteNombre: `${cita.name} ${cita.apellido}`,
      doctorNombre: cita.doctor_nombre,
      nuevaFecha: nuevaFecha,
      nuevoHorario: nuevoHorario,
      motivo: motivo || 'Reprogramación necesaria'
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Email de reprogramación enviado exitosamente',
        messageId: resultado.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar email',
        error: resultado.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Enviar recordatorios masivos
const enviarRecordatoriosMasivos = async (req, res) => {
  try {
    // Obtener citas para mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaMañana = mañana.toISOString().split('T')[0];

    const citasMañana = await query(`
      SELECT c.*, u.email, u.name, u.apellido, d.name as doctor_nombre 
      FROM citas c
      JOIN users u ON c.paciente_id = u.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.dia = $1 AND c.estado = 'pendiente'
    `, [fechaMañana]);

    let emailsEnviados = 0;
    let errores = [];

    // Enviar recordatorio a cada paciente
    for (const cita of citasMañana.rows) {
      try {
        const resultado = await emailService.enviarRecordatorio(cita.email, {
          pacienteNombre: `${cita.name} ${cita.apellido}`,
          doctorNombre: cita.doctor_nombre,
          fecha: cita.dia,
          horario: cita.horario
        });

        if (resultado.success) {
          emailsEnviados++;
        } else {
          errores.push({
            citaId: cita.id,
            paciente: `${cita.name} ${cita.apellido}`,
            error: resultado.error
          });
        }
      } catch (error) {
        errores.push({
          citaId: cita.id,
          paciente: `${cita.name} ${cita.apellido}`,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Recordatorios procesados`,
      total: citasMañana.rows.length,
      enviados: emailsEnviados,
      errores: errores.length,
      detallesErrores: errores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar recordatorios',
      error: error.message
    });
  }
};

// Enviar email personalizado
const enviarEmailPersonalizado = async (req, res) => {
  const { destinatario, asunto, mensaje } = req.body;

  try {
    const nodemailer = require('nodemailer');
    
    // Usar la configuración del proveedor definido en .env
    const emailProvider = process.env.EMAIL_PROVIDER || 'outlook';
    let transporter;

    if (emailProvider.toLowerCase() === 'outlook' || emailProvider.toLowerCase() === 'hotmail') {
      transporter = nodemailer.createTransport({
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
    } else {
      transporter = nodemailer.createTransport({
        service: emailProvider,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }

    const mailOptions = {
      from: `"Sistema de Citas Médicas" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🏥 Sistema de Citas Médicas</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="color: #374151; font-size: 16px; line-height: 1.6;">
              ${mensaje.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>Este es un correo del Sistema de Citas Médicas.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Email personalizado enviado exitosamente',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar email personalizado',
      error: error.message
    });
  }
};

// Obtener estadísticas de emails
const obtenerEstadisticasEmail = async (req, res) => {
  try {
    // Por ahora solo retornamos estadísticas básicas
    // En el futuro se puede implementar un sistema de logging más avanzado
    res.json({
      success: true,
      estadisticas: {
        configuracion: {
          emailConfiguratio: process.env.EMAIL_USER ? 'Configurado' : 'No configurado',
          servicio: 'Gmail'
        },
        funcionalidades: [
          'Confirmación de citas',
          'Cancelación de citas', 
          'Reprogramación de citas',
          'Recordatorios automáticos',
          'Emails personalizados'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  enviarEmailConfirmacion,
  enviarEmailCancelacion,
  enviarEmailReprogramacion,
  enviarRecordatoriosMasivos,
  enviarEmailPersonalizado,
  obtenerEstadisticasEmail
};
