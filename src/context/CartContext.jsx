import { useState, createContext, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parsePrice } from '../utils/price';
import { repairCartItems } from '../utils/cart';
import { trackAddToCart } from '../lib/analytics';
import { trackFunnelEvent } from '../lib/funnel';

export const CartContext = createContext();

const sameCartItem = (item, producto, talla) => {
  const currentVariant = item.producto?.selectedVariantId || null;
  const nextVariant = producto?.selectedVariantId || null;
  if (currentVariant || nextVariant) return currentVariant === nextVariant;
  return item.producto.id === producto.id && item.talla === talla;
};

const getCartItemAmount = (producto, cantidad = 1) =>
  (producto?.precioNumerico || parsePrice(producto?.precio) || 0) * cantidad;

const buildCartEventMeta = (item, extra = {}) => ({
  quantity: Number(item?.cantidad || 0),
  ...extra,
});

export function CartProvider({ children }) {
  const [cartItems, setCartItems]             = useLocalStorage('pavoa-cart', []);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [showToast, setShowToast]             = useState(null);
  const [toastKey, setToastKey]               = useState(0);

  // Las bolsas guardadas antes de armar el item desde la variante traen el
  // precio mínimo del producto y la imagen del primer color; sin reparar
  // seguirían siendo rechazadas en el checkout. El item guarda sus variantes
  // y el variantId elegido, así que se corrige sin consultar al servidor.
  useEffect(() => {
    setCartItems((prev) => repairCartItems(prev).items);
  }, [setCartItems]);

  const addToCart = useCallback((producto, talla, cantidad = 1) => {
    setCartItems((prev) => {
      const itemExistente = prev.find(item => sameCartItem(item, producto, talla));
      if (itemExistente) {
        return prev.map(item =>
          sameCartItem(item, producto, talla)
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...prev, { producto, talla, cantidad }];
    });

    trackAddToCart(producto, talla, cantidad);
    trackFunnelEvent('add_to_cart', {
      productId: producto.id,
      productName: producto.nombre,
      variantId: producto.selectedVariantId || null,
      color: producto.colorSeleccionado || null,
      size: talla,
      amount: getCartItemAmount(producto, cantidad),
      meta: buildCartEventMeta({ cantidad }, { quantity_added: cantidad }),
    });
    setIsCartAnimating(true);
    setToastKey(k => k + 1);
    setShowToast(`${producto.nombre} añadido`);
    setTimeout(() => setIsCartAnimating(false), 300);
    setTimeout(() => setShowToast(null), 3000);
  }, [setCartItems]);

  const removeFromCart = useCallback((productoId, talla, variantId = null) => {
    const itemToRemove = cartItems.find((item) => {
      const sameVariant = variantId && item.producto?.selectedVariantId
        ? item.producto.selectedVariantId === variantId
        : true;
      return item.producto.id === productoId && item.talla === talla && sameVariant;
    });

    if (itemToRemove) {
      trackFunnelEvent('remove_from_cart', {
        productId: itemToRemove.producto.id,
        productName: itemToRemove.producto.nombre,
        variantId: itemToRemove.producto.selectedVariantId || null,
        color: itemToRemove.producto.colorSeleccionado || null,
        size: itemToRemove.talla,
        amount: getCartItemAmount(itemToRemove.producto, itemToRemove.cantidad),
        meta: buildCartEventMeta(itemToRemove, { action: 'remove' }),
      });
    }

    setCartItems(prev =>
      prev.filter((item) => {
        const sameVariant = variantId && item.producto?.selectedVariantId
          ? item.producto.selectedVariantId === variantId
          : true;
        return !(item.producto.id === productoId && item.talla === talla && sameVariant);
      })
    );
  }, [cartItems, setCartItems]);

  const updateQuantity = useCallback((productoId, talla, delta, variantId = null) => {
    const itemToUpdate = cartItems.find((item) => {
      const sameVariant = variantId && item.producto?.selectedVariantId
        ? item.producto.selectedVariantId === variantId
        : true;
      return item.producto.id === productoId && item.talla === talla && sameVariant;
    });

    if (!itemToUpdate || !delta) return;

    const nextQuantity = itemToUpdate.cantidad + delta;
    if (nextQuantity <= 0) {
      trackFunnelEvent('remove_from_cart', {
        productId: itemToUpdate.producto.id,
        productName: itemToUpdate.producto.nombre,
        variantId: itemToUpdate.producto.selectedVariantId || null,
        color: itemToUpdate.producto.colorSeleccionado || null,
        size: itemToUpdate.talla,
        amount: getCartItemAmount(itemToUpdate.producto, itemToUpdate.cantidad),
        meta: buildCartEventMeta(itemToUpdate, { action: 'quantity_to_zero', quantity_delta: delta }),
      });
    } else {
      trackFunnelEvent('update_cart_quantity', {
        productId: itemToUpdate.producto.id,
        productName: itemToUpdate.producto.nombre,
        variantId: itemToUpdate.producto.selectedVariantId || null,
        color: itemToUpdate.producto.colorSeleccionado || null,
        size: itemToUpdate.talla,
        amount: getCartItemAmount(itemToUpdate.producto, nextQuantity),
        meta: buildCartEventMeta(itemToUpdate, {
          previous_quantity: itemToUpdate.cantidad,
          quantity: nextQuantity,
          quantity_delta: delta,
        }),
      });
    }

    setCartItems(prev =>
      prev
        .map(item => {
          const sameVariant = variantId && item.producto?.selectedVariantId
            ? item.producto.selectedVariantId === variantId
            : true;
          if (item.producto.id === productoId && item.talla === talla && sameVariant) {
            return { ...item, cantidad: item.cantidad + delta };
          }
          return item;
        })
        .filter(item => item.cantidad > 0)
    );
  }, [cartItems, setCartItems]);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.cantidad, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + (parsePrice(item.producto?.precio) * item.cantidad), 0),
    [cartItems]
  );

  const clearCart = useCallback(() => setCartItems([]), [setCartItems]);

  const value = useMemo(() => ({
    cartItems, cartCount, cartTotal,
    addToCart, removeFromCart, updateQuantity, clearCart,
    isCartAnimating, showToast, toastKey,
  }), [cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isCartAnimating, showToast, toastKey]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
