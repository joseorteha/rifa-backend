import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    // Verificar JWT propio
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener usuario de Supabase
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Adjuntar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const verifyEmailVerified = (req, res, next) => {
  // ✅ Ya no verificar email - todos los usuarios están auto-verificados
  next();
};
