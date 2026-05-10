import { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { AUTH_STORAGE_CHANGED_EVENT, estaAutenticado } from '../services/authService';
import {
  fetchWishlist,
  addToWishlistAPI,
  removeFromWishlistAPI,
  mergeGuestWishlistAPI,
  trackWishlistEvent,
} from '../services/wishlistService';

export const WishlistContext = createContext();

const KEY = 'pavoa-wishlist';

function loadWishlist() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(loadWishlist);

  const persistWishlist = useCallback((nextIds) => {
    try { localStorage.setItem(KEY, JSON.stringify(nextIds)); } catch {}
  }, []);

  const clearStoredWishlist = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  const syncAuthenticatedWishlist = useCallback(async () => {
    const guestIds = loadWishlist();

    if (guestIds.length > 0) {
      try {
        const mergedIds = await mergeGuestWishlistAPI(guestIds);
        persistWishlist(mergedIds);
        return mergedIds;
      } catch {}
    }

    const remoteIds = await fetchWishlist();
    persistWishlist(remoteIds);
    return remoteIds;
  }, [persistWishlist]);

  useEffect(() => {
    let active = true;

    const syncFromAuthState = async () => {
      if (!estaAutenticado()) return;

      try {
        const nextIds = await syncAuthenticatedWishlist();
        if (!active) return;
        setIds(nextIds);
      } catch {}
    };

    const handleAuthChanged = () => {
      if (!estaAutenticado()) {
        if (!active) return;
        setIds([]);
        clearStoredWishlist();
        return;
      }

      syncFromAuthState();
    };

    syncFromAuthState();
    window.addEventListener(AUTH_STORAGE_CHANGED_EVENT, handleAuthChanged);

    return () => {
      active = false;
      window.removeEventListener(AUTH_STORAGE_CHANGED_EVENT, handleAuthChanged);
    };
  }, [clearStoredWishlist, syncAuthenticatedWishlist]);

  const toggle = useCallback((productoId) => {
    setIds(prev => {
      const wished = prev.includes(productoId);
      const next = wished
        ? prev.filter(id => id !== productoId)
        : [...prev, productoId];

      persistWishlist(next);

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
  }, [persistWishlist]);

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
