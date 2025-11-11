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
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      try {
        if (err) {
          console.error('❌ Passport error:', err);
          return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_error`);
        }
        
        if (!user) {
          console.error('❌ No user returned from Google OAuth');
          return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=no_user`);
        }

        // Generar JWT token
        const token = generateToken(user.id);
        console.log('✅ Token generado para usuario:', user.email);
        
        // Redirigir al frontend con el token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('❌ Error en Google callback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=callback_error`);
      }
    })(req, res, next);
  }
);

// Obtener perfil (protegido)
router.get('/profile', verifyToken, getProfile);

export default router;
