import express from 'express';

const router = express.Router();

// Test de email
router.post('/test-email', async (req, res) => {
  try {
    const { gmailService } = await import('../services/gmail.service.js');
    
    console.log('🧪 Iniciando test de email...');
    console.log('🧪 NODE_ENV:', process.env.NODE_ENV);
    console.log('🧪 FRONTEND_URL:', process.env.FRONTEND_URL);
    
    const testResult = await gmailService.sendVerificationEmail(
      '226W0448@zongolica.tecnm.mx',  // Email de prueba
      'test-token-' + Date.now(),
      'Usuario de Prueba'
    );

    res.json({
      success: true,
      message: 'Email enviado correctamente',
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
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
    GMAIL_USER: process.env.GMAIL_USER ? '✅ Configurado' : '❌ No configurado',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '✅ Configurado' : '❌ No configurado',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'
  };

  res.json({
    message: 'Estado de variables de entorno',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

export default router;