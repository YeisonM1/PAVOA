import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  try {
    // 1. Buscar usuario en Supabase
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    // 2. Verificar que el email esté verificado
    if (!usuario.email_verified) {
      return res.status(401).json({ error: 'Debes verificar tu correo antes de iniciar sesión.' });
    }

    // 3. Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    // 4. Generar token de sesión
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 días

    return res.status(200).json({
      ok: true,
      token: sessionToken,
      expiresAt,
      usuario: {
        id:         usuario.id,
        firstName:  usuario.first_name,
        lastName:   usuario.last_name,
        email:      usuario.email,
      },
    });

  } catch (err) {
    console.error('Error login:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión. Intenta de nuevo.' });
  }
}