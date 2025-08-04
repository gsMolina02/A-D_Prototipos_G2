const { query } = require('../db/db');
const whatsappService = require('../services/whatsappService');

// Enviar WhatsApp de confirmación de cita
const enviarWhatsAppConfirmacion = async (req, res) => {
  const { citaId } = req.body;

  try {
    // Obtener datos de la cita
    const citaResult = await query(`
      SELECT c.*, u.telefono, u.name, u.apellido, d.name as doctor_nombre 
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

    // Validar que el paciente tenga teléfono
    if (!cita.telefono) {
      return res.status(400).json({
        success: false,
        message: 'El paciente no tiene número de teléfono registrado'
      });
    }

    // Enviar WhatsApp
    const resultado = await whatsappService.notificarCitaConfirmada(cita.telefono, {
      pacienteNombre: `${cita.name} ${cita.apellido}`,
      doctorNombre: cita.doctor_nombre,
      fecha: cita.dia,
      horario: cita.horario,
      especialidad: cita.especialidad
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'WhatsApp de confirmación enviado exitosamente',
        messageId: resultado.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar WhatsApp',
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

// Enviar WhatsApp de cancelación
const enviarWhatsAppCancelacion = async (req, res) => {
  const { citaId, motivo } = req.body;

  try {
    const citaResult = await query(`
      SELECT c.*, u.telefono, u.name, u.apellido, d.name as doctor_nombre 
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

    if (!cita.telefono) {
      return res.status(400).json({
        success: false,
        message: 'El paciente no tiene número de teléfono registrado'
      });
    }

    const resultado = await whatsappService.notificarCitaCancelada(cita.telefono, {
      pacienteNombre: `${cita.name} ${cita.apellido}`,
      doctorNombre: cita.doctor_nombre,
      fecha: cita.dia,
      horario: cita.horario,
      motivo: motivo || 'No especificado'
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'WhatsApp de cancelación enviado exitosamente',
        messageId: resultado.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar WhatsApp',
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

// Enviar WhatsApp de reprogramación
const enviarWhatsAppReprogramacion = async (req, res) => {
  const { citaId, nuevaFecha, nuevoHorario, motivo } = req.body;

  try {
    const citaResult = await query(`
      SELECT c.*, u.telefono, u.name, u.apellido, d.name as doctor_nombre 
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

    if (!cita.telefono) {
      return res.status(400).json({
        success: false,
        message: 'El paciente no tiene número de teléfono registrado'
      });
    }

    const resultado = await whatsappService.notificarCitaReprogramada(cita.telefono, {
      pacienteNombre: `${cita.name} ${cita.apellido}`,
      doctorNombre: cita.doctor_nombre,
      nuevaFecha: nuevaFecha,
      nuevoHorario: nuevoHorario,
      motivo: motivo || 'Reprogramación necesaria'
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'WhatsApp de reprogramación enviado exitosamente',
        messageId: resultado.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar WhatsApp',
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

// Enviar recordatorios masivos por WhatsApp
const enviarRecordatoriosMasivos = async (req, res) => {
  try {
    // Obtener citas para mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaMañana = mañana.toISOString().split('T')[0];

    const citasMañana = await query(`
      SELECT c.*, u.telefono, u.name, u.apellido, d.name as doctor_nombre 
      FROM citas c
      JOIN users u ON c.paciente_id = u.id
      JOIN users d ON c.doctor_id = d.id
      WHERE c.dia = $1 AND c.estado = 'pendiente'
    `, [fechaMañana]);

    let whatsappsEnviados = 0;
    let errores = [];

    // Enviar recordatorio a cada paciente
    for (const cita of citasMañana.rows) {
      if (!cita.telefono) {
        errores.push({
          citaId: cita.id,
          paciente: `${cita.name} ${cita.apellido}`,
          error: 'Sin número de teléfono'
        });
        continue;
      }

      try {
        const resultado = await whatsappService.enviarRecordatorio(cita.telefono, {
          pacienteNombre: `${cita.name} ${cita.apellido}`,
          doctorNombre: cita.doctor_nombre,
          fecha: cita.dia,
          horario: cita.horario
        });

        if (resultado.success) {
          whatsappsEnviados++;
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
      message: `Recordatorios por WhatsApp procesados`,
      total: citasMañana.rows.length,
      enviados: whatsappsEnviados,
      errores: errores.length,
      detallesErrores: errores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar recordatorios por WhatsApp',
      error: error.message
    });
  }
};

// Enviar WhatsApp personalizado
const enviarWhatsAppPersonalizado = async (req, res) => {
  const { telefono, mensaje } = req.body;

  try {
    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const telefonoLimpio = telefono.replace(/\D/g, '');
    
    if (!telefonoLimpio || telefonoLimpio.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Número de teléfono inválido'
      });
    }

    const resultado = await whatsappService.enviarMensajePersonalizado(telefonoLimpio, mensaje);

    if (resultado.success) {
      res.json({
        success: true,
        message: 'WhatsApp personalizado enviado exitosamente',
        messageId: resultado.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar WhatsApp personalizado',
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

// Obtener estadísticas de WhatsApp
const obtenerEstadisticasWhatsApp = async (req, res) => {
  try {
    res.json({
      success: true,
      estadisticas: {
        configuracion: {
          twilioConfiguracion: process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'No configurado',
          servicio: 'Twilio WhatsApp API'
        },
        funcionalidades: [
          'Confirmación de citas',
          'Cancelación de citas', 
          'Reprogramación de citas',
          'Recordatorios automáticos',
          'Mensajes personalizados'
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
  enviarWhatsAppConfirmacion,
  enviarWhatsAppCancelacion,
  enviarWhatsAppReprogramacion,
  enviarRecordatoriosMasivos,
  enviarWhatsAppPersonalizado,
  obtenerEstadisticasWhatsApp
};
