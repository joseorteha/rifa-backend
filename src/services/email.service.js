import { Resend } from 'resend';

// Solo inicializar Resend si tenemos la API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export class EmailService {
  /**
   * Envía un email de verificación de cuenta
   */
  static async sendVerificationEmail(email, verificationToken, userName = '') {
    try {
      // Verificar que Resend esté configurado
      if (!resend) {
        throw new Error('Resend no está configurado. Verifica que RESEND_API_KEY esté en el .env');
      }
      
      const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${verificationToken}`;
      
      // En desarrollo, solo permitir el email registrado en Resend
      const targetEmail = process.env.NODE_ENV === 'development' ? 'joseortegahac@gmail.com' : email;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verifica tu cuenta - Rifa Siera Code</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .title {
              color: #1f2937;
              font-size: 28px;
              margin: 0 0 15px 0;
            }
            .subtitle {
              color: #6b7280;
              font-size: 16px;
              margin: 0;
            }
            .content {
              margin: 30px 0;
            }
            .btn {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .btn:hover {
              background: #1d4ed8;
            }
            .prize-info {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              border-left: 4px solid #2563eb;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎮 Rifa Siera Code</div>
              <h1 class="title">¡Verifica tu cuenta!</h1>
              <p class="subtitle">Solo falta un paso para participar en la rifa</p>
            </div>
            
            <div class="content">
              <p>¡Hola${userName ? ` ${userName}` : ''}! 👋</p>
              
              <p>¡Gracias por registrarte en la Rifa Siera Code! Estás muy cerca de poder participar por el increíble <strong>Kit Gamer 4-en-1 Profesional</strong>.</p>
              
              <div class="prize-info">
                <h3 style="margin-top: 0; color: #2563eb;">🏆 Premio del Sorteo</h3>
                <p><strong>Kit Gamer 4-en-1 Profesional</strong></p>
                <p>Fecha del sorteo: <strong>21 de noviembre, 8:00 PM</strong></p>
                <p>Precio por boleto: <strong>$30 MXN</strong></p>
              </div>
              
              <p>Para completar tu registro y poder comprar boletos, necesitas verificar tu correo electrónico haciendo clic en el botón de abajo:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="btn">✅ Verificar mi correo</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px;">
                ${verificationUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expira en 24 horas. Si necesitas un nuevo enlace, puedes solicitarlo desde la página de verificación.
              </div>
              
              <p><strong>¿Por qué verificar tu correo?</strong></p>
              <ul>
                <li>Para confirmar que eres el propietario de esta cuenta</li>
                <li>Para recibir actualizaciones importantes sobre el sorteo</li>
                <li>Para proteger tu cuenta y tus boletos</li>
                <li>Para notificarte si resultas ganador 🎉</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Este correo fue enviado a <strong>${targetEmail}</strong></p>
              ${process.env.NODE_ENV === 'development' ? `<p><em>[DESARROLLO] Email original: ${email}</em></p>` : ''}
              <p>Si no solicitaste crear una cuenta en Rifa Siera Code, puedes ignorar este correo.</p>
              <p>© 2024 Equipo Siera Code - Rifa HackaTec</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Rifa Siera Code <noreply@rifa.sieracode.com>',
        to: targetEmail, // En desarrollo usa joseortegahac@gmail.com
        subject: '🎮 Verifica tu cuenta - Rifa Siera Code',
        html: htmlContent,
        // Fallback para clientes que no soportan HTML
        text: `
¡Hola${userName ? ` ${userName}` : ''}!

¡Gracias por registrarte en la Rifa Siera Code! 

Para completar tu registro y poder comprar boletos para el Kit Gamer 4-en-1 Profesional, verifica tu correo electrónico haciendo clic en este enlace:

${verificationUrl}

Este enlace expira en 24 horas.

${process.env.NODE_ENV === 'development' ? `[DESARROLLO] Email original: ${email}` : ''}

Premio: Kit Gamer 4-en-1 Profesional
Fecha del sorteo: 21 de noviembre, 8:00 PM
Precio por boleto: $30 MXN

Si no solicitaste crear una cuenta, puedes ignorar este correo.

© 2024 Equipo Siera Code - Rifa HackaTec
        `
      });

      console.log('✅ Email de verificación enviado:', result);
      
      // En desarrollo, mostrar información adicional
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 [DESARROLLO] Email enviado a: ${targetEmail} (original: ${email})`);
      }
      
      return { success: true, messageId: result.id };
      
    } catch (error) {
      console.error('❌ Error al enviar email de verificación:', error);
      throw error;
    }
  }

  /**
   * Envía un email de confirmación cuando el pago es aprobado
   */
  static async sendPaymentConfirmationEmail(email, ticketNumbers, userName = '') {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>¡Pago confirmado! - Rifa Siera Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { padding: 20px 0; }
            .tickets { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .ticket-number { display: inline-block; background: #10b981; color: white; padding: 5px 10px; margin: 3px; border-radius: 4px; font-family: monospace; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Pago Confirmado!</h1>
              <p>Ya estás participando en la rifa</p>
            </div>
            
            <div class="content">
              <p>¡Hola${userName ? ` ${userName}` : ''}!</p>
              
              <p>¡Excelentes noticias! Tu pago ha sido verificado y confirmado. Ahora oficialmente estás participando en la Rifa Siera Code por el <strong>Kit Gamer 4-en-1 Profesional</strong>.</p>
              
              <div class="tickets">
                <h3>🎫 Tus números de la suerte:</h3>
                ${ticketNumbers.map(num => `<span class="ticket-number">${num.padStart(3, '0')}</span>`).join('')}
              </div>
              
              <p><strong>Detalles del sorteo:</strong></p>
              <ul>
                <li>📅 Fecha: 21 de noviembre de 2025</li>
                <li>⏰ Hora: 8:00 PM</li>
                <li>🎮 Premio: Kit Gamer 4-en-1 Profesional</li>
                <li>📍 Transmisión en vivo por nuestras redes sociales</li>
              </ul>
              
              <p>Puedes ver todos los boletos participantes y la transparencia del sorteo en nuestra página de <a href="${process.env.FRONTEND_URL}/transparencia">Transparencia</a>.</p>
              
              <p>¡Gracias por apoyar al equipo Siera Code! 🚀</p>
            </div>
            
            <div class="footer">
              <p>Equipo Siera Code - Rifa HackaTec</p>
              <p>Este correo fue enviado a ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Rifa Siera Code <noreply@rifa.sieracode.com>',
        to: email,
        subject: '🎉 ¡Pago confirmado! Ya estás participando - Rifa Siera Code',
        html: htmlContent
      });

      return { success: true, messageId: result.id };
      
    } catch (error) {
      console.error('❌ Error al enviar email de confirmación:', error);
      throw error;
    }
  }
}