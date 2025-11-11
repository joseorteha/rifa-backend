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
    const googleId = profile.id;

    console.log('🔍 Google OAuth - Profile received:', { email, nombre, googleId });
    
    // Buscar usuario existente por email o google_id
    const { data: existingUser, error: searchError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .or(`email.eq.${email},google_id.eq.${googleId}`)
      .maybeSingle();

    if (searchError) {
      console.error('❌ Error buscando usuario:', searchError);
      return done(searchError, null);
    }

    if (existingUser) {
      console.log('✅ Usuario existente encontrado:', existingUser.id);
      // Si el usuario existe pero no tiene google_id, actualizarlo
      if (!existingUser.google_id) {
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ 
            google_id: googleId,
            email_verificado: true 
          })
          .eq('id', existingUser.id);
          
        if (updateError) {
          console.error('❌ Error actualizando google_id:', updateError);
        } else {
          console.log('✅ Google ID agregado al usuario existente');
        }
      }
      return done(null, existingUser);
    }

    // Crear nuevo usuario
    console.log('🆕 Creando nuevo usuario con Google OAuth...');
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email: email,
        nombre: nombre,
        google_id: googleId,
        email_verificado: true, // Google ya verificó el email
        password_hash: null // No hay password para usuarios OAuth
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creando usuario:', insertError);
      return done(insertError, null);
    }

    console.log('✅ Usuario creado exitosamente:', newUser.id);
    return done(null, newUser);

  } catch (error) {
    console.error('❌ Error en Google OAuth:', error);
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