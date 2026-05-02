import { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { estaAutenticado } from '../services/authService';
import { fetchWishlist, addToWishlistAPI, removeFromWishlistAPI, trackWishlistEvent } from '../services/wishlistService';

export const WishlistContext = createContext();

const KEY = 'pavoa-wishlist';

function loadWishlist() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(loadWishlist);

  // Si está autenticado, sincronizar con Supabase al montar
  useEffect(() => {
    if (!estaAutenticado()) return;
    fetchWishlist()
      .then(remoteIds => {
        setIds(remoteIds);
        try { localStorage.setItem(KEY, JSON.stringify(remoteIds)); } catch {}
      })
      .catch(() => {});
  }, []);

  const toggle = useCallback((productoId) => {
    setIds(prev => {
      const wished = prev.includes(productoId);
      const next = wished
        ? prev.filter(id => id !== productoId)
        : [...prev, productoId];

      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}

      if (estaAutenticado()) {
        if (wished) removeFromWishlistAPI(productoId).catch(() => {});
        else        addToWishlistAPI(productoId).catch(() => {});
      }

      trackWishlistEvent({
        productId: productoId,
        actionType: wished ? 'remove' : 'add',
      }).catch(() => {});

      return next;
    });
  }, []);

  const isWished = useCallback((id) => ids.includes(id), [ids]);

  const clearWishlist = useCallback(() => {
    setIds([]);
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  const getShareableUrl = useCallback(() => {
    if (ids.length === 0) return null;
    return `${window.location.origin}/wishlist?ids=${ids.join(',')}`;
  }, [ids]);

  const value = useMemo(() => ({
    wishlist: ids, toggle, isWished, clearWishlist, getShareableUrl,
  }), [ids, toggle, isWished, clearWishlist, getShareableUrl]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
