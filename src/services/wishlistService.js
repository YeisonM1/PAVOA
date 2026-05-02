import { getToken } from './authService';

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const post = (action, body = {}) =>
  fetch('/api/mis-pedidos', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action, ...body }),
  });

export const fetchWishlist = async () => {
  const res = await post('wishlist-get');
  if (!res.ok) return [];
  const data = await res.json();
  return data.ids || [];
};

export const addToWishlistAPI = (productId) =>
  post('wishlist-add', { productId }).catch(() => {});

export const removeFromWishlistAPI = (productId) =>
  post('wishlist-remove', { productId }).catch(() => {});

const ANON_ID_KEY = 'pavoa_anon_id';

const getAnonId = () => {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
};

export const trackWishlistEvent = ({ productId, actionType }) =>
  post('wishlist-track', {
    productId,
    actionType,
    anonId: getAnonId(),
  }).catch(() => {});
