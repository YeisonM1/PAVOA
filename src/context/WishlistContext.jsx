import { createContext, useState, useCallback, useMemo, useContext } from 'react';

export const WishlistContext = createContext();

const KEY = 'pavoa-wishlist';

function loadWishlist() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(loadWishlist);

  const toggle = useCallback((productoId) => {
    setIds(prev => {
      const next = prev.includes(productoId)
        ? prev.filter(id => id !== productoId)
        : [...prev, productoId];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isWished = useCallback((id) => ids.includes(id), [ids]);

  const getShareableUrl = useCallback(() => {
    if (ids.length === 0) return null;
    return `${window.location.origin}/wishlist?ids=${ids.join(',')}`;
  }, [ids]);

  const value = useMemo(() => ({ wishlist: ids, toggle, isWished, getShareableUrl }), [ids, toggle, isWished, getShareableUrl]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
