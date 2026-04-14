const GA_ID = 'G-MLC7S1Q64S';

const gtag = (...args) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
};

export const trackPageView = (path) => {
  gtag('event', 'page_view', { page_path: path, send_to: GA_ID });
};

export const trackViewItem = (producto) => {
  gtag('event', 'view_item', {
    currency: 'COP',
    value: producto.precioNumerico || 0,
    items: [{
      item_id:       String(producto.id),
      item_name:     producto.nombre,
      item_category: producto.categoria || '',
      price:         producto.precioNumerico || 0,
      quantity:      1,
    }],
  });
};

export const trackAddToCart = (producto, talla, cantidad) => {
  gtag('event', 'add_to_cart', {
    currency: 'COP',
    value: (producto.precioNumerico || 0) * cantidad,
    items: [{
      item_id:       String(producto.id),
      item_name:     producto.nombre,
      item_category: producto.categoria || '',
      item_variant:  talla,
      price:         producto.precioNumerico || 0,
      quantity:      cantidad,
    }],
  });
};

export const trackBeginCheckout = (cartItems, cartTotal) => {
  gtag('event', 'begin_checkout', {
    currency: 'COP',
    value: cartTotal,
    items: cartItems.map(item => ({
      item_id:      String(item.producto.id),
      item_name:    item.producto.nombre,
      item_category: item.producto.categoria || '',
      item_variant: item.talla,
      price:        item.producto.precioNumerico || 0,
      quantity:     item.cantidad,
    })),
  });
};

export const trackPurchase = ({ paymentId, items, total }) => {
  gtag('event', 'purchase', {
    transaction_id: String(paymentId),
    currency:       'COP',
    value:          total,
    items: items.map((item, i) => ({
      item_id:      String(i),
      item_name:    item.nombre,
      item_variant: item.talla,
      price:        parseInt(String(item.precio).replace(/[$,.]/g, ''), 10) || 0,
      quantity:     item.cantidad,
    })),
  });
};
