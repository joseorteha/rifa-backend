import dotenv from 'dotenv';
import { gmailService } from './src/services/gmail.service.js';

// Cargar variables de entorno
dotenv.config();

console.log('🔍 Verificando configuración de email...\n');

// Verificar variables de entorno
console.log('Variables de entorno:');
console.log('GMAIL_USER:', process.env.GMAIL_USER || '❌ No configurado');
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 
  `✅ Configurado (length: ${process.env.GMAIL_APP_PASSWORD.length})` : '❌ No configurado');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ No configurado');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.log('\n❌ Error: Variables de Gmail no configuradas');
  process.exit(1);
}

// Probar envío de email
async function testEmail() {
  try {
    console.log('\n📧 Enviando email de prueba...');
    
    const testToken = 'test-token-123';
    const result = await gmailService.sendVerificationEmail(
      'joseortegahac@gmail.com',  // Email de prueba
      testToken,
      'Usuario de Prueba'
    );
    
    console.log('✅ Email enviado correctamente!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.log('❌ Error al enviar email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Solución posible:');
      console.log('1. Verifica que GMAIL_APP_PASSWORD sea correcto');
      console.log('2. Asegúrate de que la verificación en 2 pasos esté activada');
      console.log('3. Genera una nueva "App Password" en Google Account');
      console.log('4. Quita espacios del App Password en el .env');
    }
  }
}

testEmail();