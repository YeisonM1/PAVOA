import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Firma un JWT con email y userId.
 * Expiración: 30 días.
 */
export const signToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Verifica el token JWT del header Authorization: Bearer <token>.
 * Devuelve el payload decodificado o null si es inválido/ausente.
 */
export const verifyToken = (req) => {
  if (!JWT_SECRET) return null;

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};
