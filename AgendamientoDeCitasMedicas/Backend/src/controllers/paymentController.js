const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const { pool, query } = require('../db/db');

// Inicializar Stripe con la clave secreta (usar variable de entorno)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key');

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'medicitas.system@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your_app_password'
  }
});

// Precio fijo de la cita en centavos (Stripe usa centavos)
const PRECIO_CITA_CENTAVOS = 2000; // $20.00 USD
const PRECIO_CITA_DOLARES = 20.00;

// Tiempo de bloqueo temporal en minutos
const TIEMPO_BLOQUEO_MINUTOS = 10;

/**
 * Bloquear horario temporalmente para evitar concurrencia
 * Implementa un sistema de reserva temporal antes del pago
 */
const bloquearHorario = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { doctor_id, fecha, hora, usuario_id } = req.body;
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    // Limpiar bloqueos expirados (usar timestamp de JS para consistencia)
    const ahoraLimpieza = new Date();
    await client.query(`
      DELETE FROM horarios_bloqueados 
      WHERE bloqueado_hasta < $1
    `, [ahoraLimpieza]);
    
    // Verificar si el horario ya está ocupado por una cita confirmada
    const citaExistente = await client.query(`
      SELECT id FROM citas 
      WHERE doctor_id = $1 
      AND dia = $2 
      AND horario LIKE $3 || '%'
      AND estado != 'cancelada'
      AND (payment_status IS NULL OR payment_status IN ('completado', 'procesando'))
    `, [doctor_id, fecha, hora]);
    
    if (citaExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Este horario ya está ocupado',
        disponible: false 
      });
    }
    
    // Verificar si hay un bloqueo temporal activo de otro usuario
    const ahora = new Date();
    const bloqueoExistente = await client.query(`
      SELECT * FROM horarios_bloqueados 
      WHERE doctor_id = $1 
      AND fecha = $2 
      AND hora = $3
      AND usuario_id != $4
      AND bloqueado_hasta > $5
    `, [doctor_id, fecha, hora, usuario_id, ahora]);
    
    if (bloqueoExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Este horario está siendo reservado por otro usuario. Intente en unos minutos.',
        disponible: false,
        reintentar_en: TIEMPO_BLOQUEO_MINUTOS
      });
    }
    
    // Crear o actualizar bloqueo temporal
    const bloqueadoHasta = new Date(Date.now() + TIEMPO_BLOQUEO_MINUTOS * 60 * 1000);
    const sessionId = `session_${usuario_id}_${Date.now()}`;
    
    await client.query(`
      INSERT INTO horarios_bloqueados (doctor_id, fecha, hora, usuario_id, bloqueado_hasta, session_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (doctor_id, fecha, hora) 
      DO UPDATE SET 
        usuario_id = $4,
        bloqueado_hasta = $5,
        session_id = $6
    `, [doctor_id, fecha, hora, usuario_id, bloqueadoHasta, sessionId]);
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true,
      message: 'Horario bloqueado temporalmente',
      session_id: sessionId,
      expira_en: TIEMPO_BLOQUEO_MINUTOS,
      bloqueado_hasta: bloqueadoHasta
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al bloquear horario:', error);
    res.status(500).json({ error: 'Error al reservar el horario' });
  } finally {
    client.release();
  }
};

/**
 * Crear Payment Intent de Stripe
 * Se llama antes de mostrar el formulario de pago
 */
const crearPaymentIntent = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { doctor_id, fecha, hora, usuario_id, session_id, paciente_email, paciente_nombre } = req.body;
    
    // Verificar que el usuario tiene el bloqueo del horario
    // Usar $5 con el timestamp actual de JavaScript para consistencia de timezone
    const ahora = new Date();
    const bloqueo = await client.query(`
      SELECT * FROM horarios_bloqueados 
      WHERE doctor_id = $1 
      AND fecha = $2 
      AND hora = $3
      AND usuario_id = $4
      AND bloqueado_hasta > $5
    `, [doctor_id, fecha, hora, usuario_id, ahora]);
    
    if (bloqueo.rows.length === 0) {
      return res.status(409).json({ 
        error: 'El tiempo de reserva ha expirado. Por favor, seleccione el horario nuevamente.',
        expiro: true
      });
    }
    
    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PRECIO_CITA_CENTAVOS,
      currency: 'usd',
      metadata: {
        doctor_id: doctor_id.toString(),
        fecha: fecha,
        hora: hora,
        usuario_id: usuario_id.toString(),
        paciente_email: paciente_email,
        paciente_nombre: paciente_nombre
      },
      description: `Cita médica - ${fecha} ${hora}`,
      receipt_email: paciente_email
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      monto: PRECIO_CITA_DOLARES
    });
    
  } catch (error) {
    console.error('Error al crear payment intent:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  } finally {
    client.release();
  }
};

/**
 * Confirmar pago y crear cita
 * Se llama después de que Stripe confirma el pago exitoso
 */
const confirmarPagoYCrearCita = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      payment_intent_id, 
      doctor_id, 
      paciente_id, 
      fecha, 
      hora, 
      motivo,
      paciente_email,
      paciente_nombre,
      doctor_nombre,
      especialidad
    } = req.body;
    
    await client.query('BEGIN');
    
    // Verificar el estado del pago en Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'El pago no fue exitoso',
        status: paymentIntent.status 
      });
    }
    
    // Verificar una última vez que el horario no está ocupado (doble verificación)
    const citaDuplicada = await client.query(`
      SELECT id FROM citas 
      WHERE doctor_id = $1 
      AND dia = $2 
      AND horario LIKE $3 || '%'
      AND estado != 'cancelada'
      AND payment_status = 'completado'
    `, [doctor_id, fecha, hora]);
    
    if (citaDuplicada.rows.length > 0) {
      // Reembolsar el pago si hay duplicado
      await stripe.refunds.create({
        payment_intent: payment_intent_id,
        reason: 'duplicate'
      });
      
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Este horario fue reservado por otro usuario. Se ha reembolsado su pago.',
        reembolsado: true
      });
    }
    
    // Crear la cita con pago completado
    const resultado = await client.query(`
      INSERT INTO citas (doctor_id, paciente_id, dia, horario, especialidad, estado, payment_intent_id, payment_status, monto)
      VALUES ($1, $2, $3, $4, $5, 'agendada', $6, 'completado', $7)
      RETURNING *
    `, [doctor_id, paciente_id, fecha, hora, especialidad || 'Consulta General', payment_intent_id, PRECIO_CITA_DOLARES]);
    const citaCreada = resultado.rows[0];
    
    // Eliminar el bloqueo temporal
    await client.query(`
      DELETE FROM horarios_bloqueados 
      WHERE doctor_id = $1 AND fecha = $2 AND hora = $3
    `, [doctor_id, fecha, hora]);
    
    await client.query('COMMIT');
    
    // Enviar email de confirmación (async, no bloquea la respuesta)
    enviarEmailConfirmacion({
      email: paciente_email,
      nombre: paciente_nombre,
      fecha: fecha,
      hora: hora,
      doctor: doctor_nombre,
      especialidad: especialidad,
      monto: PRECIO_CITA_DOLARES,
      citaId: citaCreada.id,
      paymentIntentId: payment_intent_id
    }).catch(err => console.error('Error enviando email:', err));
    
    res.json({
      success: true,
      message: 'Cita agendada y pago confirmado',
      cita: citaCreada,
      pago: {
        id: payment_intent_id,
        monto: PRECIO_CITA_DOLARES,
        estado: 'completado'
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: 'Error al procesar la cita' });
  } finally {
    client.release();
  }
};

/**
 * Enviar email de confirmación de pago y cita
 */
const enviarEmailConfirmacion = async ({ email, nombre, fecha, hora, doctor, especialidad, monto, citaId, paymentIntentId }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'medicitas.system@gmail.com',
    to: email,
    subject: 'Confirmación de Cita Médica - MediCitas',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-weight: 500; }
          .value { color: #1f2937; font-weight: 600; }
          .total { background: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px; }
          .total-amount { font-size: 24px; color: #059669; font-weight: 700; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .checkmark { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="checkmark">&#10003;</div>
            <h1 style="margin: 0;">Pago Confirmado</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Su cita ha sido agendada exitosamente</p>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            <p>Su cita médica ha sido confirmada y el pago procesado correctamente.</p>
            
            <div class="details">
              <h3 style="margin-top: 0; color: #1f2937;">Detalles de la Cita</h3>
              <div class="detail-row">
                <span class="label">Número de Cita:</span>
                <span class="value">#${citaId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Fecha:</span>
                <span class="value">${fecha}</span>
              </div>
              <div class="detail-row">
                <span class="label">Hora:</span>
                <span class="value">${hora}</span>
              </div>
              <div class="detail-row">
                <span class="label">Doctor:</span>
                <span class="value">${doctor || 'Médico asignado'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Especialidad:</span>
                <span class="value">${especialidad || 'Medicina General'}</span>
              </div>
            </div>
            
            <div class="total">
              <p style="margin: 0; color: #065f46;">Monto Pagado</p>
              <div class="total-amount">$${monto.toFixed(2)} USD</div>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">ID de Transacción: ${paymentIntentId}</p>
            </div>
            
            <p style="margin-top: 20px;">
              <strong>Importante:</strong> Por favor, llegue 15 minutos antes de su cita.
              Si necesita cancelar o reprogramar, hágalo con al menos 24 horas de anticipación.
            </p>
          </div>
          
          <div class="footer">
            <p>MediCitas - Sistema de Agendamiento de Citas Médicas</p>
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
            <p>&copy; 2026 MediCitas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    
    // Marcar email como enviado en la BD
    await query(`
      UPDATE citas SET email_confirmacion_enviado = true WHERE id = $1
    `, [citaId]);
    
    console.log('Email de confirmación enviado a:', email);
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};

/**
 * Verificar disponibilidad de horario en tiempo real
 */
const verificarDisponibilidad = async (req, res) => {
  try {
    const { doctor_id, fecha, hora } = req.query;
    
    // Verificar citas existentes
    const cita = await query(`
      SELECT id FROM citas 
      WHERE doctor_id = $1 
      AND dia = $2 
      AND horario LIKE $3 || '%'
      AND estado != 'cancelada'
      AND (payment_status IS NULL OR payment_status IN ('completado', 'procesando'))
    `, [doctor_id, fecha, hora]);
    
    // Verificar bloqueos temporales
    const bloqueo = await query(`
      SELECT usuario_id, bloqueado_hasta FROM horarios_bloqueados 
      WHERE doctor_id = $1 
      AND fecha = $2 
      AND hora = $3
      AND bloqueado_hasta > NOW()
    `, [doctor_id, fecha, hora]);
    
    if (cita.rows.length > 0) {
      return res.json({ 
        disponible: false, 
        razon: 'ocupado',
        mensaje: 'Este horario ya está ocupado'
      });
    }
    
    if (bloqueo.rows.length > 0) {
      return res.json({ 
        disponible: false, 
        razon: 'bloqueado',
        mensaje: 'Este horario está siendo reservado por otro usuario',
        bloqueado_por: bloqueo.rows[0].usuario_id
      });
    }
    
    res.json({ disponible: true });
    
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    res.status(500).json({ error: 'Error al verificar disponibilidad' });
  }
};

/**
 * Liberar bloqueo de horario (si el usuario cancela antes de pagar)
 */
const liberarBloqueo = async (req, res) => {
  try {
    const { doctor_id, fecha, hora, usuario_id } = req.body;
    
    await query(`
      DELETE FROM horarios_bloqueados 
      WHERE doctor_id = $1 
      AND fecha = $2 
      AND hora = $3
      AND usuario_id = $4
    `, [doctor_id, fecha, hora, usuario_id]);
    
    res.json({ success: true, message: 'Bloqueo liberado' });
    
  } catch (error) {
    console.error('Error liberando bloqueo:', error);
    res.status(500).json({ error: 'Error al liberar bloqueo' });
  }
};

/**
 * Webhook de Stripe para manejar eventos de pago
 */
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Manejar eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Pago exitoso:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('Pago fallido:', event.data.object.id);
      // Liberar el bloqueo del horario
      const metadata = event.data.object.metadata;
      if (metadata) {
        await query(`
          DELETE FROM horarios_bloqueados 
          WHERE doctor_id = $1 AND fecha = $2 AND hora = $3
        `, [metadata.doctor_id, metadata.fecha, metadata.hora]);
      }
      break;
    default:
      console.log(`Evento no manejado: ${event.type}`);
  }
  
  res.json({ received: true });
};

module.exports = {
  bloquearHorario,
  crearPaymentIntent,
  confirmarPagoYCrearCita,
  verificarDisponibilidad,
  liberarBloqueo,
  stripeWebhook,
  PRECIO_CITA_DOLARES
};
