import express from 'express';

const router = express.Router();

// Test de email
router.post('/test-email', async (req, res) => {
  try {
    const { mailerooService } = await import('../services/maileroo.service.js');
    
    console.log('🧪 Iniciando test de email con Maileroo...');
    console.log('🧪 NODE_ENV:', process.env.NODE_ENV);
    console.log('🧪 FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('🧪 MAILEROO_API_KEY:', process.env.MAILEROO_API_KEY ? '✅ Configurado' : '❌ No configurado');
    
    const testResult = await mailerooService.sendVerificationEmail(
      'joseortegahac@gmail.com',  // Email de prueba
      'test-token-' + Date.now(),
      'Usuario de Prueba'
    );

    res.json({
      success: true,
      message: 'Email enviado correctamente con Maileroo',
      messageId: testResult.messageId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL
    });

  } catch (error) {
    console.error('🧪 Error en test de email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.toString(),
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL
    });
  }
});

// Endpoint para verificar variables de entorno
router.get('/env-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    MAILEROO_API_KEY: process.env.MAILEROO_API_KEY ? '✅ Configurado' : '❌ No configurado',
    MAILEROO_FROM_EMAIL: process.env.MAILEROO_FROM_EMAIL || 'noreply@rifa-siera-code.com',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'
  };

  res.json({
    message: 'Estado de variables de entorno - Maileroo',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

export default router;