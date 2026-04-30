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
