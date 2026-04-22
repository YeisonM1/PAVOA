const GA_ID = 'G-MLC7S1Q64S';

let analyticsRequested = false;
let analyticsLoaded = false;
let listenersAttached = false;
const queuedEvents = [];

const flushQueue = () => {
  if (!analyticsLoaded || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  while (queuedEvents.length > 0) {
    window.gtag(...queuedEvents.shift());
  }
};

const markLoaded = () => {
  analyticsLoaded = true;
  flushQueue();
};

const injectAnalyticsScript = () => {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`script[data-ga-id="${GA_ID}"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  script.dataset.gaId = GA_ID;
  script.onload = markLoaded;
  document.head.appendChild(script);
};

const requestAnalytics = () => {
  if (analyticsRequested || typeof window === 'undefined') return;
  analyticsRequested = true;
  injectAnalyticsScript();
};

const attachDeferredLoadTriggers = () => {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  const start = () => {
    requestAnalytics();
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
    window.removeEventListener('scroll', start, true);
    window.removeEventListener('touchstart', start, true);
  };

  window.addEventListener('pointerdown', start, { once: true, passive: true });
  window.addEventListener('keydown', start, { once: true });
  window.addEventListener('scroll', start, { once: true, passive: true, capture: true });
  window.addEventListener('touchstart', start, { once: true, passive: true, capture: true });

  const defer = () => window.setTimeout(requestAnalytics, 3000);

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => defer(), { timeout: 4000 });
  } else {
    defer();
  }
};

attachDeferredLoadTriggers();

const gtag = (...args) => {
  if (typeof window === 'undefined') return;
  queuedEvents.push(args);
  requestAnalytics();
  flushQueue();
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
