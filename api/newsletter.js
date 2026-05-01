import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const _attempts = new Map();
const LIMIT  = 10;
const WINDOW = 10 * 60 * 1000;

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = _attempts.get(ip) || { count: 0, reset: now + WINDOW };
  if (now > entry.reset) { _attempts.set(ip, { count: 1, reset: now + WINDOW }); return false; }
  if (entry.count >= LIMIT) return true;
  entry.count++;
  _attempts.set(ip, entry);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Demasiados intentos.' });

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: email.toLowerCase() });

  // Email duplicado → devolver ok igual (no revelar si ya existe)
  if (error && error.code !== '23505') {
    console.error('[newsletter]', error.message);
    return res.status(500).json({ error: 'Error al suscribirse. Intenta de nuevo.' });
  }

  return res.status(200).json({ ok: true });
}
