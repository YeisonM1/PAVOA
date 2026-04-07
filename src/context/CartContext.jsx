import { useState, createContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parsePrice } from '../utils/price';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems]             = useLocalStorage('pavoa-cart', []);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [showToast, setShowToast]             = useState(null);

  const addToCart = (producto, talla, cantidad = 1) => {
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

    setIsCartAnimating(true);
    setShowToast(`${producto.nombre} añadido`);
    setTimeout(() => setIsCartAnimating(false), 300);
    setTimeout(() => setShowToast(null), 3000);
  };

  const removeFromCart = (productoId, talla) => {
    setCartItems(prev =>
      prev.filter(item => !(item.producto.id === productoId && item.talla === talla))
    );
  };

  const updateQuantity = (productoId, talla, delta) => {
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
  };

  const cartCount = cartItems.reduce((total, item) => total + item.cantidad, 0);
  const cartTotal = cartItems.reduce((total, item) => {
    return total + (parsePrice(item.producto.precio) * item.cantidad);
  }, 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal,
      addToCart, removeFromCart, updateQuantity,
      isCartAnimating, showToast,
    }}>
      {children}
    </CartContext.Provider>
  );
}
