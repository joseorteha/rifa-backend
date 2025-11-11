import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import { supabaseAdmin } from './supabase.js';

// Configurar estrategia de Google OAuth
passport.use(new GoogleStrategy.Strategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const nombre = profile.displayName;
    
    // Buscar usuario existente
    const { data: existingUser } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Usuario ya existe
      return done(null, existingUser);
    }

    // Crear nuevo usuario
    const { data: newUser, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email: email,
        password: 'google_oauth', // Password placeholder para OAuth
        nombre: nombre,
        email_verificado: true, // Google ya verificó el email
        verification_token: null,
        provider: 'google',
        google_id: profile.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return done(error, null);
    }

    return done(null, newUser);

  } catch (error) {
    return done(error, null);
  }
}));

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;