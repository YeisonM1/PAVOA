import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  if (newPassword.length < 5) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 5 caracteres.' });
  }

  try {
    // 1. Buscar usuario y verificar token
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, reset_token, reset_expires')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !usuario) {
      return res.status(400).json({ error: 'Solicitud inválida.' });
    }

    if (usuario.reset_token !== token) {
      return res.status(400).json({ error: 'El token es inválido o no coincide.' });
    }

    if (Date.now() > usuario.reset_expires) {
      return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' });
    }

    // 2. Hashear nueva contraseña
    const password_hash = await bcrypt.hash(newPassword, 12);

    // 3. Actualizar contraseña y limpiar tokens
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ 
        password_hash,
        reset_token: null,
        reset_expires: null 
      })
      .eq('id', usuario.id);

    if (updateError) throw updateError;

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error reset password:', err);
    return res.status(500).json({ error: 'Error al actualizar contraseña. Intenta de nuevo.' });
  }
}