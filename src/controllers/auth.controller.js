import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';

// Generar JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
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

    // Crear usuario en tabla usuarios (auto-verificado)
    const { data: newUser, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email,
        password: hashedPassword,
        nombre,
        email_verificado: true, // ✅ Auto-verificado
        verification_token: null, // No necesita token
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear usuario:', error);
      return res.status(500).json({ error: 'Error al crear usuario' });
    }

    // ✅ Respuesta inmediata sin verificación de email
    res.status(201).json({
      message: 'Usuario registrado exitosamente. Ya puedes iniciar sesión.',
      user: {
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
        email_verificado: true
      }
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

    // ✅ Ya no verificar email_verificado - todos pueden hacer login

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
