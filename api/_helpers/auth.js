import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Firma un JWT con email y userId.
 * Expiración: 30 días.
 */
export const signToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado');
  return jwt.sign({ ...payload, purpose: 'session' }, JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Verifica el token JWT del header Authorization: Bearer <token>.
 * Devuelve el payload decodificado o null si es inválido/ausente.
 *
 * Los tokens de checkout se firman con este mismo JWT_SECRET, así que la firma
 * por sí sola no distingue una sesión real de un token de pago emitido a un
 * invitado (que además elige el email en el formulario). Solo un token con
 * dueño identificado y sin marcas de checkout autoriza como sesión.
 */
export const verifyToken = (req) => {
  if (!JWT_SECRET) return null;

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    if (payload?.purpose && payload.purpose !== 'session') return null;
    if (payload?.aud === CHECKOUT_TOKEN_OPTIONS.audience) return null;
    // Las sesiones emitidas por login.js siempre llevan dueño; los tokens de
    // checkout nunca. Se acepta `id` porque hubo sesiones antiguas con ese campo.
    if (!(payload?.userId ?? payload?.id)) return null;

    return payload;
  } catch {
    return null;
  }
};

const CHECKOUT_TOKEN_OPTIONS = {
  audience: 'pavoa-checkout',
  issuer: 'pavoa',
};

export const signCheckoutToken = ({ draftOrderId, email, shippingCost }) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado');

  return jwt.sign(
    {
      purpose: 'checkout',
      draftOrderId: String(draftOrderId || ''),
      email: String(email || '').trim().toLowerCase(),
      shippingCost: Number(shippingCost || 0),
    },
    JWT_SECRET,
    { ...CHECKOUT_TOKEN_OPTIONS, expiresIn: '2h' },
  );
};

export const verifyCheckoutToken = (token, { draftOrderId } = {}) => {
  if (!JWT_SECRET || !token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET, CHECKOUT_TOKEN_OPTIONS);
    if (payload?.purpose !== 'checkout') return null;
    if (draftOrderId && String(payload.draftOrderId) !== String(draftOrderId)) return null;
    return payload;
  } catch {
    return null;
  }
};
