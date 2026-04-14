import { useState, createContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parsePrice } from '../utils/price';
import { trackAddToCart } from '../lib/analytics';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems]             = useLocalStorage('pavoa-cart', []);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [showToast, setShowToast]             = useState(null);

  const addToCart = useCallback((producto, talla, cantidad = 1) => {
    setCartItems((prev) => {
      const itemExistente = prev.find(
        item => item.producto.id === producto.id && item.talla === talla
      );
      if (itemExistente) {
        return prev.map(item =>
          item.producto.id === producto.id && item.talla === talla
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...prev, { producto, talla, cantidad }];
    });

    trackAddToCart(producto, talla, cantidad);
    setIsCartAnimating(true);
    setShowToast(`${producto.nombre} añadido`);
    setTimeout(() => setIsCartAnimating(false), 300);
    setTimeout(() => setShowToast(null), 3000);
  }, [setCartItems]);

  const removeFromCart = useCallback((productoId, talla) => {
    setCartItems(prev =>
      prev.filter(item => !(item.producto.id === productoId && item.talla === talla))
    );
  }, [setCartItems]);

  const updateQuantity = useCallback((productoId, talla, delta) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.producto.id === productoId && item.talla === talla) {
            return { ...item, cantidad: item.cantidad + delta };
          }
          return item;
        })
        .filter(item => item.cantidad > 0)
    );
  }, [setCartItems]);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.cantidad, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + (parsePrice(item.producto.precio) * item.cantidad), 0),
    [cartItems]
  );

  const clearCart = useCallback(() => setCartItems([]), [setCartItems]);

  const value = useMemo(() => ({
    cartItems, cartCount, cartTotal,
    addToCart, removeFromCart, updateQuantity, clearCart,
    isCartAnimating, showToast,
  }), [cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isCartAnimating, showToast]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
