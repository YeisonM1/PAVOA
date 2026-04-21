// ── Login — llama a nuestra API serverless ────────────
export const login = async (email, password) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión.');

  localStorage.setItem('pavoa_token', data.token);
  localStorage.setItem('pavoa_token_expires', data.expiresAt);
  localStorage.setItem('pavoa_usuario', JSON.stringify(data.usuario));

  return data;
};

// ── Register — llama a nuestra API serverless ─────────
export const register = async ({ firstName, lastName, email, password }) => {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta.');

  return data;
};

// ── Cerrar sesión ─────────────────────────────────────
export const cerrarSesion = () => {
  localStorage.removeItem('pavoa_token');
  localStorage.removeItem('pavoa_token_expires');
  localStorage.removeItem('pavoa_usuario');
};

// ── Obtener token activo ──────────────────────────────
export const getToken = () => {
  const token   = localStorage.getItem('pavoa_token');
  const expires = localStorage.getItem('pavoa_token_expires');
  if (!token || Date.now() > Number(expires)) return null;
  return token;
};

// ── Verificar si está autenticado ─────────────────────
export const estaAutenticado = () => !!getToken();

// ── Obtener perfil del cliente (desde localStorage) ───
export const getCliente = () => {
  const usuario = localStorage.getItem('pavoa_usuario');
  if (!usuario) return null;
  try {
    return JSON.parse(usuario);
  } catch {
    localStorage.removeItem('pavoa_usuario');
    return null;
  }
};

// ── Obtener pedidos del cliente desde Supabase ────────
export const getPedidos = async () => {
  const usuario = getCliente();
  if (!usuario) throw new Error('No autenticado');

  const res = await fetch('/api/mis-pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: usuario.email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener pedidos');

  const mapFulfillment = (s) => {
    if (s === 'fulfilled')  return 'FULFILLED';
    if (s === 'partial')    return 'UNFULFILLED';
    return 'UNFULFILLED';
  };

  return (data.pedidos || []).map(p => ({
    id:                p.id,
    name:              p.shopify_order_name || `#${p.id.slice(0, 6).toUpperCase()}`,
    processedAt:       p.created_at,
    financialStatus:   'PAID',
    fulfillmentStatus: mapFulfillment(p.fulfillment_status),
    totalPrice:        { amount: p.total, currencyCode: 'COP' },
    totalOriginal:     p.total_original || 0,
    descuentoAplicado: p.descuento_aplicado || false,
    lineItems: {
      edges: (p.items || []).map(item => ({
        node: { title: item.nombre, quantity: item.cantidad, variant: null },
      })),
    },
  }));
};

// ── Recuperar contraseña ─────────────────────────────
export const forgotPassword = async (email) => {
  const res = await fetch('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al procesar la solicitud.');
  return data;
};

// ── Restablecer contraseña ───────────────────────────
export const resetPassword = async (email, token, newPassword) => {
  const res = await fetch('/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al restablecer la contraseña.');
  return data;
};