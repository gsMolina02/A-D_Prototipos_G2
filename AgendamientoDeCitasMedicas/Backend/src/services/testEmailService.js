const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConnection() {
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || 'test';
    
    if (emailProvider.toLowerCase() === 'test') {
      console.log('🧪 Modo de prueba - Email simulado enviado');
      return;
    }
    
    // Configurar transportador para Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.verify();
    
    const testEmail = {
      from: `"Sistema de Citas Médicas" <${process.env.EMAIL_USER}>`,
      to: 'axeldoge4@gmail.com',
      subject: '🧪 Prueba de Email - Sistema de Citas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2563eb; color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h1>🏥 Sistema de Citas Médicas</h1>
            <h2>✅ Prueba de Email Exitosa</h2>
          </div>
          <div style="background: #f8f9fa; padding: 20px; margin-top: 20px; border-radius: 10px;">
            <p><strong>¡Felicidades!</strong> El sistema de emails está funcionando correctamente.</p>
            <p><strong>Fecha de prueba:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Remitente:</strong> ${process.env.EMAIL_USER}</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email de prueba enviado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba de email:', error.message);
  }
}

testEmailConnection().then(() => {
  process.exit(0);
});
