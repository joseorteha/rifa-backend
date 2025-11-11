import express from 'express';

const router = express.Router();

// Debug de configuración OAuth
router.get('/oauth-config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NO SET',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    backendUrl: process.env.BACKEND_URL,
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV,
    callbackUrl: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    expectedCallbackUrls: [
      'https://rifa-backend-ao4w.onrender.com/api/auth/google/callback',
      'http://localhost:5000/api/auth/google/callback',
      'https://obpnvgiaizfyrtdlpzcr.supabase.co/auth/v1/callback'
    ],
    currentHost: req.get('host'),
    fullCallbackUrl: `${req.protocol}://${req.get('host')}/api/auth/google/callback`
  });
});

// Test de email (legacy - mantener para compatibilidad)
router.post('/test-email', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Email verification disabled - auto verification enabled',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('🧪 Error en test de email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      environment: process.env.NODE_ENV
    });
  }
});

// Test de conexión a Supabase
router.get('/supabase-test', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('../config/supabase.js');
    
    // Test: Consultar tabla usuarios
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre')
      .limit(1);
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error conectando a Supabase',
        error: error.message
      });
    }
    
    res.json({
      status: 'success',
      message: 'Conexión a Supabase exitosa',
      usuariosCount: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en test de Supabase',
      error: error.message
    });
  }
});

// Endpoint para verificar variables de entorno
router.get('/env-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ No configurado',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'
  };

  res.json({
    message: 'Estado de variables de entorno - Google OAuth',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

export default router;