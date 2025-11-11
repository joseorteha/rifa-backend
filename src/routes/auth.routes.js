import express from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { 
  register, 
  login,
  getProfile 
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import passport from '../config/passport.js';

const router = express.Router();

// Generar JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Registro
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('nombre').trim().isLength({ min: 3 })
  ],
  register
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  login
);

// ✨ AUTENTICACIÓN CON GOOGLE
// Iniciar autenticación con Google
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback de Google
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      // Generar JWT token
      const token = generateToken(req.user.id);
      
      // Redirigir al frontend con el token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: req.user.id,
        email: req.user.email,
        nombre: req.user.nombre,
        email_verificado: req.user.email_verificado
      }))}`);
    } catch (error) {
      console.error('Error en Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=auth_failed`);
    }
  }
);

// Obtener perfil (protegido)
router.get('/profile', verifyToken, getProfile);

export default router;
