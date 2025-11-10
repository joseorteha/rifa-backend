import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  verifyEmail, 
  resendVerification,
  getProfile 
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

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

// Verificar email
router.get('/verify/:token', verifyEmail);

// Reenviar verificación
router.post('/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  resendVerification
);

// Obtener perfil (protegido)
router.get('/profile', verifyToken, getProfile);

export default router;
