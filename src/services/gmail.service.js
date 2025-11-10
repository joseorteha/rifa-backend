import nodemailer from 'nodemailer';

class GmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // NO es tu contraseña normal, es una "App Password"
      }
    });
  }

  async sendVerificationEmail(email, verificationToken, userName = '') {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Rifa Siera Code" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎮 Verifica tu cuenta - Rifa Siera Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🎮 ¡Verifica tu cuenta!</h1>
          <p>¡Hola${userName ? ` ${userName}` : ''}!</p>
          
          <p>Gracias por registrarte en la Rifa Siera Code. Para completar tu registro, haz clic en el botón de abajo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              ✅ Verificar mi correo
            </a>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🏆 Detalles del Premio:</h3>
            <p><strong>Kit Gamer 4-en-1 Profesional</strong></p>
            <p>Fecha: <strong>21 de noviembre, 8:00 PM</strong></p>
            <p>Boletos: <strong>$30 MXN c/u</strong></p>
          </div>
          
          <p><small>Si el botón no funciona, copia y pega este enlace: ${verificationUrl}</small></p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Este correo fue enviado a ${email}<br>
            Si no solicitaste crear una cuenta, puedes ignorar este correo.
          </p>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      throw error;
    }
  }
}

export const gmailService = new GmailService();