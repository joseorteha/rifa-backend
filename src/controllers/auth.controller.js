import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { EmailService } from '../services/email.service.js';
import { gmailService } from '../services/gmail.service.js';

// Generar JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generar token de verificación
const generateVerificationToken = () => {
  return uuidv4();
};

// REGISTRO
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nombre } = req.body;

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();

    // Crear usuario en tabla usuarios
    const { data: newUser, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email,
        password: hashedPassword,
        nombre,
        email_verificado: false,
        verification_token: verificationToken,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear usuario:', error);
      return res.status(500).json({ error: 'Error al crear usuario' });
    }

    // Enviar email de verificación
    try {
      const emailService = process.env.EMAIL_SERVICE === 'gmail' ? gmailService : EmailService;
      await emailService.sendVerificationEmail(email, verificationToken, nombre);
      console.log('✅ Email de verificación enviado a:', email);
    } catch (emailError) {
      console.error('⚠️ Error al enviar email, pero usuario creado:', emailError);
      // No fallar el registro si el email falla, solo logear el error
    }

    res.status(201).json({
      message: 'Usuario registrado. Por favor verifica tu correo electrónico.',
      // Solo mostrar URL en desarrollo
      ...(process.env.NODE_ENV === 'development' && {
        verificationUrl: `${process.env.FRONTEND_URL}/auth/verify?token=${verificationToken}`
      })
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken(user.id);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        email_verificado: user.email_verificado
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// VERIFICAR EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar usuario con ese token
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Token de verificación inválido' });
    }

    if (user.email_verificado) {
      return res.json({ message: 'El correo ya fue verificado anteriormente' });
    }

    // Actualizar usuario
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ 
        email_verificado: true, 
        verification_token: null 
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Error al verificar correo' });
    }

    res.json({ message: 'Correo verificado exitosamente. Ya puedes iniciar sesión.' });

  } catch (error) {
    console.error('Error en verifyEmail:', error);
    res.status(500).json({ error: 'Error al verificar correo' });
  }
};

// REENVIAR VERIFICACIÓN
export const resendVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.email_verificado) {
      return res.json({ message: 'El correo ya está verificado' });
    }

    const verificationToken = generateVerificationToken();

    await supabaseAdmin
      .from('usuarios')
      .update({ verification_token: verificationToken })
      .eq('id', user.id);

    // Enviar email de verificación
    try {
      const emailService = process.env.EMAIL_SERVICE === 'gmail' ? gmailService : EmailService;
      await emailService.sendVerificationEmail(email, verificationToken, user.nombre);
      console.log('✅ Email de verificación reenviado a:', email);
    } catch (emailError) {
      console.error('⚠️ Error al reenviar email:', emailError);
      return res.status(500).json({ error: 'Error al enviar el correo de verificación' });
    }

    res.json({ 
      message: 'Correo de verificación enviado. Revisa tu bandeja de entrada.',
      // Solo mostrar URL en desarrollo  
      ...(process.env.NODE_ENV === 'development' && {
        verificationUrl: `${process.env.FRONTEND_URL}/auth/verify?token=${verificationToken}`
      })
    });

  } catch (error) {
    console.error('Error en resendVerification:', error);
    res.status(500).json({ error: 'Error al reenviar verificación' });
  }
};

// OBTENER PERFIL
export const getProfile = async (req, res) => {
  try {
    const user = req.user; // Ya viene del middleware

    res.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      email_verificado: user.email_verificado,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};
