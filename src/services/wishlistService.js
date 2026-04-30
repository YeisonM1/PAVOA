import { getToken } from './authService';

const authHeaders = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchWishlist = async () => {
  const res = await fetch('/api/wishlist', { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.ids || [];
};

export const addToWishlistAPI = async (productId) => {
  await fetch('/api/wishlist', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ productId }),
  });
};

export const removeFromWishlistAPI = async (productId) => {
  await fetch('/api/wishlist', {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ productId }),
  });
};
