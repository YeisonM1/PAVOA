import React, { useState, useContext, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CartContext } from '../App';
import { trackBeginCheckout } from '../lib/analytics';
import { getFunnelSessionId, trackFunnelEvent } from '../lib/funnel';
import SEO from '../components/SEO';
import { thumbImage } from '../utils/imageUrl';
import { getShippingConfig } from '../services/productService';
import { CIUDADES_POR_DEPARTAMENTO, DEPARTAMENTOS } from '../utils/ciudades';
import { estaAutenticado, getCliente, getToken } from '../services/authService';

const HORARIOS = ['Mañana (8am - 12pm)', 'Tarde (12pm - 6pm)', 'Noche (6pm - 9pm)'];

const CHECKOUT_STEPS = [
  { key: 'bag', label: 'Bolsa' },
  { key: 'data', label: 'Datos' },
  { key: 'payment', label: 'Pago' },
  { key: 'done', label: 'Confirmación' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOLO_DIGITOS = /\D/g;
const CHECKOUT_FORM_KEY = 'pavoa-checkout-form-v1';
const CHECKOUT_SESSION_KEY = 'pavoa-checkout-session';
const CHECKOUT_SESSION_MAX_AGE_MS = 30 * 60 * 1000;

const buildCheckoutLineItems = (cartItems = []) =>
  cartItems.map((item) => ({
    product_id: item?.producto?.id || null,
    product_name: item?.producto?.nombre || null,
    variant_id: item?.producto?.selectedVariantId || null,
    color: item?.producto?.colorSeleccionado || null,
    size: item?.talla || null,
    quantity: Number(item?.cantidad || 0),
    amount: Number(item?.producto?.precioNumerico || 0),
  }));

const getSingleCheckoutItem = (cartItems = []) => {
  if (cartItems.length !== 1) return null;
  const [item] = cartItems;
  return {
    productId: item?.producto?.id || null,
    productName: item?.producto?.nombre || null,
    variantId: item?.producto?.selectedVariantId || null,
    color: item?.producto?.colorSeleccionado || null,
    size: item?.talla || null,
  };
};

const buildCheckoutCartHash = (cartItems = []) =>
  cartItems.map((item) => `${item?.producto?.id || ''}|${item?.talla || ''}|${item?.cantidad || 0}`).join(',');

const formatBackendError = (error, detail) => {
  const base = String(error || '').trim();
  if (!detail) return base || 'Ocurrio un error.';
  if (typeof detail === 'string') return [base, detail].filter(Boolean).join(' ');
  try {
    return [base, JSON.stringify(detail)].filter(Boolean).join(' ');
  } catch {
    return base || 'Ocurrio un error.';
  }
};

const getJsonHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const readCheckoutSession = () => {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCheckoutSession = (session) => {
  try {
    sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(session));
  } catch {}
};

const clearCheckoutSession = () => {
  try {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  } catch {}
};

const limpiarDraftPendiente = async (draftOrderId, checkoutToken) => {
  const id = String(draftOrderId || '').trim();
  const accessToken = String(checkoutToken || '').trim();
  if (!id || !accessToken) return false;

  try {
    const res = await fetch('/api/procesar-pago', {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ type: 'cancel-draft-order', draftOrderId: id, checkoutToken: accessToken }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      console.warn('[PAVOA] No se pudo limpiar draft order pendiente:', id, data?.error || res.status);
      return false;
    }
    console.info('[PAVOA] Draft order limpiado tras fallo de pago:', id);
    return true;
  } catch (err) {
    console.warn('[PAVOA] Error limpiando draft order pendiente:', id, err);
    return false;
  }
};

const CAMPO = ({ label, name, value, onChange, onBlur, placeholder, type = 'text', required = true, error = '' }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">
      {label} {required && <span className="text-stone-400">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      className={`w-full border-b outline-none py-3 text-[13px] text-stone-900 placeholder-stone-300 tracking-[0.05em] transition-colors bg-transparent ${
        error ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'
      }`}
    />
    {error && <p className="text-[10px] text-red-400 tracking-[0.08em]">{error}</p>}
  </div>
);

const SELECTOR = ({ label, name, value, onChange, onBlur, options, placeholder, disabled = false, required = true, error = '' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt } });
    if (onBlur) onBlur({ target: { name, value: opt } });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <label className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">
        {label} {required && <span className="text-stone-400">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(o => !o)}
          onBlur={() => onBlur && onBlur({ target: { name, value } })}
          className={`w-full border-b py-3 text-left text-[13px] tracking-[0.05em] transition-colors bg-transparent flex items-center justify-between gap-2 outline-none ${
            disabled
              ? 'text-stone-300 border-stone-100 cursor-not-allowed'
              : value
              ? 'text-stone-900 cursor-pointer'
              : 'text-stone-300 cursor-pointer'
          } ${error ? 'border-red-300' : 'border-stone-200 focus:border-stone-900'}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <svg
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-stone-200' : 'text-stone-400'}`}
            viewBox="0 0 20 20" fill="none"
          >
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-stone-100 shadow-md max-h-48 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-2.5 text-[12px] tracking-[0.05em] transition-colors ${
                  opt === value
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-400 tracking-[0.08em]">{error}</p>}
    </div>
  );
};

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartCount } = useContext(CartContext);
  const [searchParams] = useSearchParams();
  const isRedirectingToPaymentRef = React.useRef(false);
  const abandonTrackingReadyRef = React.useRef(false);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    departamento: '',
    ciudad: '',
    dirección: '',
    barrio: '',
    referencia: '',
    horario: '',
    observaciones: '',
  });
  const [shippingCost, setShippingCost] = useState(18900);
  const [baseShippingCost, setBaseShippingCost] = useState(18900);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    try {
      const savedForm = JSON.parse(sessionStorage.getItem(CHECKOUT_FORM_KEY) || 'null');
      if (!savedForm || typeof savedForm !== 'object') return;
      setForm((prev) => ({ ...prev, ...savedForm }));
    } catch {}
  }, []);

  // Pre-rellenar con datos del usuario logueado
  React.useEffect(() => {
    if (estaAutenticado()) {
      const cliente = getCliente();
      if (cliente) {
        setForm(prev => ({
          ...prev,
          nombre: prev.nombre || `${cliente.firstName} ${cliente.lastName}`.trim(),
          email:  prev.email  || cliente.email || '',
        }));
      }
    }
  }, []);

  useEffect(() => {
    getShippingConfig().then(cfg => {
      const precio = cfg.precioEnvio || 18900;
      setBaseShippingCost(precio);
      setShippingCost(precio);
    }).catch(() => {});
  }, []);

  const [cargandoPago, setCargandoPago] = useState(false);
  const [cargandoCod, setCargandoCod] = useState(false);
  const [errors, setErrors]           = useState({});
  const [tieneDescuento, setTieneDescuento] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const funnelSessionId = getFunnelSessionId();
  const checkoutStep = (cargandoPago || cargandoCod) ? 2 : 1;
  const statusFromMP = (searchParams.get('status') || '').toLowerCase();
  const statusDetailFromMP = (searchParams.get('status_detail') || '').toLowerCase();
  const paymentIdFromMP = (searchParams.get('payment_id') || '').trim();
  const currentCartHash = buildCheckoutCartHash(cartItems);

  const trackCheckoutAbandon = (reason, extraMeta = {}) => {
    const isReturningFromMercadoPago = Boolean(statusFromMP || paymentIdFromMP);
    if (isReturningFromMercadoPago || isRedirectingToPaymentRef.current) return false;

    const checkoutSession = readCheckoutSession();
    const draftOrderId = String(checkoutSession?.draftOrderId || '').trim() || null;
    const sessionCartHash = String(checkoutSession?.cartHash || '').trim() || currentCartHash;
    const abandonKey = `checkout_abandon:${funnelSessionId}:${draftOrderId || sessionCartHash}:${checkoutSession?.ts || 'no-ts'}`;

    if (checkoutSession?.abandonEventKey && checkoutSession.abandonEventKey === abandonKey) {
      return false;
    }

    if (checkoutSession) {
      writeCheckoutSession({
        ...checkoutSession,
        abandonEventKey: abandonKey,
        abandonReason: reason,
        abandonTrackedAt: Date.now(),
      });
    }

    const singleItem = getSingleCheckoutItem(cartItems);
    trackFunnelEvent('checkout_abandon', {
      eventKey: abandonKey,
      productId: singleItem?.productId || null,
      productName: singleItem?.productName || null,
      variantId: singleItem?.variantId || null,
      color: singleItem?.color || null,
      size: singleItem?.size || null,
      orderId: draftOrderId,
      amount: cartTotal,
      meta: {
        reason,
        line_count: cartItems.length,
        item_count: cartItems.reduce((total, item) => total + Number(item.cantidad || 0), 0),
        line_items: buildCheckoutLineItems(cartItems),
        ...extraMeta,
      },
    });

    return true;
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    const activationTimer = window.setTimeout(() => {
      abandonTrackingReadyRef.current = true;
    }, 0);

    const handleBeforeUnload = () => {
      if (!abandonTrackingReadyRef.current) return;
      trackCheckoutAbandon('page_exit');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.clearTimeout(activationTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!abandonTrackingReadyRef.current) return;
      trackCheckoutAbandon('route_exit');
    };
  }, []);

  useEffect(() => {
    if (!estaAutenticado()) return;
    const cliente = getCliente();
    if (!cliente?.email) return;
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch('/api/check-descuento', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: cliente.email }),
    })
      .then(r => r.json())
      .then(d => setTieneDescuento(d.disponible || false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const isReturningFromMercadoPago = Boolean(statusFromMP || paymentIdFromMP);
    if (isReturningFromMercadoPago) return;

    try {
      const checkoutSession = readCheckoutSession();
      if (!checkoutSession) return;
      const storedDraftOrderId = String(checkoutSession?.draftOrderId || '').trim();
      const storedCheckoutToken = String(checkoutSession?.checkoutToken || '').trim();
      const storedCartHash = String(checkoutSession?.cartHash || '').trim();
      const storedTs = Number(checkoutSession?.ts || 0);
      const isExpired = !storedTs || (Date.now() - storedTs > CHECKOUT_SESSION_MAX_AGE_MS);
      const cartChanged = storedCartHash && storedCartHash !== currentCartHash;

      if (!isExpired && !cartChanged) return;

      if (!checkoutSession?.abandonTrackedAt) {
        trackCheckoutAbandon(isExpired ? 'session_expired' : 'cart_changed', {
          stored_cart_hash: storedCartHash || null,
          current_cart_hash: currentCartHash || null,
        });
      }

      if (storedDraftOrderId) {
        limpiarDraftPendiente(storedDraftOrderId, storedCheckoutToken);
      }

      clearCheckoutSession();
    } catch {}
  }, [currentCartHash, paymentIdFromMP, statusFromMP]);

  useEffect(() => {
    if (cartItems.length === 0) return;

    const isReturningFromMercadoPago = Boolean(statusFromMP || paymentIdFromMP);
    if (isReturningFromMercadoPago) return;

    const checkoutSession = readCheckoutSession();
    const storedCartHash = String(checkoutSession?.cartHash || '').trim();
    const storedTs = Number(checkoutSession?.ts || 0);
    const isExpired = !storedTs || (Date.now() - storedTs > CHECKOUT_SESSION_MAX_AGE_MS);
    const sameCart = storedCartHash && storedCartHash === currentCartHash;

    if (sameCart && !isExpired && checkoutSession?.beginCheckoutEventKey) {
      return;
    }

    const sessionTimestamp = sameCart && !isExpired ? storedTs : Date.now();
    const beginCheckoutEventKey = `begin_checkout:${funnelSessionId}:${currentCartHash}:${sessionTimestamp}`;
    const singleItem = getSingleCheckoutItem(cartItems);

    writeCheckoutSession({
      ...(checkoutSession && typeof checkoutSession === 'object' ? checkoutSession : {}),
      cartHash: currentCartHash,
      ts: sessionTimestamp,
      beginCheckoutEventKey,
    });

    trackBeginCheckout(cartItems, cartTotal);
    trackFunnelEvent('begin_checkout', {
      eventKey: beginCheckoutEventKey,
      productId: singleItem?.productId || null,
      productName: singleItem?.productName || null,
      variantId: singleItem?.variantId || null,
      color: singleItem?.color || null,
      size: singleItem?.size || null,
      amount: cartTotal,
      meta: {
        line_count: cartItems.length,
        item_count: cartItems.reduce((total, item) => total + item.cantidad, 0),
        line_items: buildCheckoutLineItems(cartItems),
        cart_hash: currentCartHash,
      },
    });
  }, [cartItems, cartTotal, currentCartHash, funnelSessionId, paymentIdFromMP, statusFromMP]);

  useEffect(() => {
    if (cartCount !== 0) return;
    try {
      sessionStorage.removeItem(CHECKOUT_FORM_KEY);
    } catch {}
  }, [cartCount]);

  useEffect(() => {
    const isRejected = statusFromMP === 'failure' || statusFromMP === 'rejected';
    if (!isRejected) return;

    trackFunnelEvent('checkout_error', {
      amount: cartTotal,
      meta: {
        stage: 'mercadopago_return',
        status: statusFromMP,
        status_detail: statusDetailFromMP || null,
      },
    });

    try {
      const checkoutSession = readCheckoutSession();
      const draftOrderId = checkoutSession?.draftOrderId || '';
      const checkoutToken = checkoutSession?.checkoutToken || '';
      if (draftOrderId) {
        limpiarDraftPendiente(draftOrderId, checkoutToken);
      }
    } catch {}

    clearCheckoutSession();

    const rejectionMessages = {
      cc_rejected_insufficient_amount: 'Tu banco rechazo el pago por fondos o cupo insuficiente.',
      cc_rejected_call_for_authorize: 'Tu banco requiere autorizacion para esta compra. Intenta de nuevo o llama a tu banco.',
      cc_rejected_card_disabled: 'La tarjeta no esta habilitada para compras en linea.',
      cc_rejected_duplicated_payment: 'MercadoPago detectó intento duplicado. Ya generamos una nueva sesión para reintentar.',
      cc_rejected_high_risk: 'La operacion fue rechazada por validacion de seguridad. Intenta con otro medio de pago.',
      cc_rejected_other_reason: 'El banco rechazo la operacion. Intenta con otro medio de pago.',
      cc_rejected_max_attempts: 'Superaste el limite de intentos con este medio. Intenta con otro.',
    };

    setErrors((prev) => ({
      ...prev,
      general: rejectionMessages[statusDetailFromMP] || 'No se pudo procesar tu pago. Intenta nuevamente o usa otro medio.',
    }));

    try {
      const debugRaw = sessionStorage.getItem('pavoa-last-mp-debug');
      if (debugRaw) {
        console.warn('[PAVOA][MP DEBUG][ultimo intento]', JSON.parse(debugRaw));
      }
    } catch {}
  }, [statusFromMP, statusDetailFromMP]);

  if (cartCount === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <p className="text-[11px] tracking-[0.2em] uppercase text-stone-500">Tu bolsa está vacía</p>
        <Link to="/" className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const formatTelefono = (value) => {
    const digits = String(value || '').replace(SOLO_DIGITOS, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const validateField = (field, value) => {
    if (field === 'nombre') {
      if (!String(value || '').trim()) return 'Escribe tu nombre y apellido.';
      return '';
    }
    if (field === 'email') {
      const email = String(value || '').trim();
      if (!email) return 'Escribe tu correo para enviarte la confirmación.';
      if (!EMAIL_REGEX.test(email)) return 'Escribe un correo válido.';
      return '';
    }
    if (field === 'telefono') {
      const telefono = String(value || '').trim();
      if (!telefono) return 'Escribe tu teléfono.';
      if (telefono.replace(SOLO_DIGITOS, '').length < 10) return 'Revisa tu número, parece incompleto.';
      return '';
    }
    if (field === 'departamento') {
      if (!String(value || '').trim()) return 'Selecciona el departamento.';
      return '';
    }
    if (field === 'ciudad') {
      if (!String(value || '').trim()) return 'Selecciona la ciudad de entrega.';
      return '';
    }
    if (field === 'dirección') {
      const dirección = String(value || '').trim();
      if (!dirección) return 'Escribe una dirección de entrega.';
      if (dirección.length < 6) return 'Tu dirección esta muy corta, agrega más detalle.';
      return '';
    }
    if (field === 'barrio') {
      if (!String(value || '').trim()) return 'Escribe el barrio para facilitar la entrega.';
      return '';
    }
    if (field === 'horario') {
      if (!value) return 'Selecciona un horario de entrega.';
      return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'telefono' ? formatTelefono(value) : value;
    const nextForm = { ...form, [name]: nextValue };
    setForm(nextForm);
    setErrors((prev) => ({
      ...prev,
      general: '',
      [name]: touched[name] ? validateField(name, nextValue) : '',
    }));
  };

  // Cambio #7: Detectar ciudad Bogotá y ajustar costo de envío
  const handleCiudadChange = (e) => {
    handleChange(e);
    const ciudad = String(e.target.value || '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (ciudad === 'bogota') {
      setShippingCost(10000);
    } else {
      setShippingCost(baseShippingCost);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleDepto = (e) => {
    const nextDepto = e.target.value;
    setForm(prev => ({ ...prev, departamento: nextDepto, ciudad: '' }));
    setErrors(prev => ({
      ...prev,
      general: '',
      departamento: touched.departamento ? validateField('departamento', nextDepto) : '',
      ciudad: '',
    }));
  };

  const validar = () => {
    const nuevosErrores = {};
    ['nombre', 'email', 'telefono', 'departamento', 'ciudad', 'dirección', 'barrio', 'horario'].forEach((field) => {
      const fieldError = validateField(field, form[field]);
      if (fieldError) nuevosErrores[field] = fieldError;
    });
    return nuevosErrores;
  };

  // Pago en línea (Checkout Pro)
  const handlePagarOnline = async () => {
    let draftOrderIdCreado = '';
    let checkoutTokenCreado = '';
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      trackFunnelEvent('checkout_error', {
        amount: cartTotal,
        meta: {
          stage: 'validation',
          fields: Object.keys(nuevosErrores),
        },
      });
      setTouched((prev) => ({
        ...prev,
        nombre: true,
        email: true,
        telefono: true,
        departamento: true,
        ciudad: true,
        dirección: true,
        barrio: true,
        horario: true,
      }));
      setErrors(nuevosErrores);
      const primerError = document.querySelector('.error-field');
      if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const cartHash = currentCartHash;
    // Clave de idempotencia corta: absorbe doble-clicks y retries inmediatos
    // en pedido y preferencia de pago, pero cada intento nuevo sigue creando su propia sesion.
    const minuteBucket    = Math.floor(Date.now() / 60000);
    const idempotencyKey  = `${form.email || 'anon'}-${cartHash}-${minuteBucket}`;

    clearCheckoutSession();

    setCargandoPago(true);

    try {
      // El stock y los precios se validan en el backend (/api/pedido) con datos
      // frescos de Shopify; no se repite la verificacion aqui para no sumar latencia.
      trackFunnelEvent('payment_click', {
        productId: getSingleCheckoutItem(cartItems)?.productId || null,
        productName: getSingleCheckoutItem(cartItems)?.productName || null,
        variantId: getSingleCheckoutItem(cartItems)?.variantId || null,
        color: getSingleCheckoutItem(cartItems)?.color || null,
        size: getSingleCheckoutItem(cartItems)?.size || null,
        amount: cartTotal,
        meta: {
          line_count: cartItems.length,
          item_count: cartItems.reduce((total, item) => total + item.cantidad, 0),
          line_items: buildCheckoutLineItems(cartItems),
        },
      });

      // Paso 2 - Crear draft order en Shopify
      const resPedido = await fetch('/api/pedido', {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ form, cartItems, cartTotal, shippingCost, idempotencyKey, funnelSessionId }),
      });
      const dataPedido = await resPedido.json();
      if (!resPedido.ok || !dataPedido.ok || !dataPedido.draftOrderId || !dataPedido.checkoutToken) {
        trackFunnelEvent('checkout_error', {
          amount: cartTotal,
          meta: {
            stage: 'draft_order',
            message: dataPedido?.error || 'No se pudo registrar el pedido.',
          },
        });
        setErrors({ general: formatBackendError(dataPedido?.error || 'No se pudo registrar el pedido.', dataPedido?.detail) });
        setCargandoPago(false);
        return;
      }
      draftOrderIdCreado = dataPedido.draftOrderId;
      checkoutTokenCreado = dataPedido.checkoutToken;
      const serverShippingCost = Number(dataPedido.shippingCost || 0);
      setShippingCost(serverShippingCost);

      // Paso 3 - Crear preferencia en MercadoPago
      const resPref = await fetch('/api/procesar-pago', {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({
          form,
          cartItems,
          cartTotal,
          checkoutToken: checkoutTokenCreado,
          draftOrderId: draftOrderIdCreado,
          funnelSessionId,
          idempotencyKey: `${idempotencyKey}-payment`,
        }),
      });
      const dataPref = await resPref.json();
      if (!resPref.ok || !dataPref.init_point) {
        await limpiarDraftPendiente(draftOrderIdCreado, checkoutTokenCreado);
        trackFunnelEvent('checkout_error', {
          amount: cartTotal,
          orderId: draftOrderIdCreado,
          meta: {
            stage: 'payment_preference',
            message: dataPref?.error || 'No se pudo iniciar el pago.',
          },
        });
        setErrors({ general: dataPref?.error || 'No se pudo iniciar el pago.' });
        setCargandoPago(false);
        return;
      }

      if (dataPref?.debug) {
        sessionStorage.setItem('pavoa-last-mp-debug', JSON.stringify(dataPref.debug));
        console.info('[PAVOA][MP DEBUG]', dataPref.debug);
      }

      // Paso 4 - Guardar datos del pedido y sesión de checkout en sessionStorage
      const _subtotal = dataPref.descuento_aplicado ? Math.round(cartTotal * 0.9) : cartTotal;
      sessionStorage.setItem('pavoa-pending-order', JSON.stringify({
        items: cartItems.map(item => ({
          nombre:   item.producto.nombre,
          talla:    item.talla,
          color:    item.producto.colorSeleccionado || '',
          cantidad: item.cantidad,
          precio:   item.producto.precio,
          imagen:   item.producto.imagen1,
        })),
        subtotal:          _subtotal,
        shippingCost:      serverShippingCost,
        total:             _subtotal + serverShippingCost,
        descuentoAplicado: dataPref.descuento_aplicado || false,
        email:             form.email,
        nombre:            form.nombre,
        checkoutToken:     checkoutTokenCreado,
      }));
      writeCheckoutSession({
        initPoint:    dataPref.init_point,
        draftOrderId: draftOrderIdCreado,
        checkoutToken: checkoutTokenCreado,
        cartHash,
        ts:           Date.now(),
      });

      // Paso 5 - Redirigir a MercadoPago
      isRedirectingToPaymentRef.current = true;
      window.location.href = dataPref.init_point;

    } catch (err) {
      if (draftOrderIdCreado) {
        await limpiarDraftPendiente(draftOrderIdCreado, checkoutTokenCreado);
      }
      console.error('[PAVOA] Error al iniciar pago:', err);
      trackFunnelEvent('checkout_error', {
        amount: cartTotal,
        orderId: draftOrderIdCreado || null,
        meta: {
          stage: 'unexpected',
          message: err?.message || 'Error inesperado.',
        },
      });
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' });
      setCargandoPago(false);
    }
  };

  const handlePagarContraentrega = async () => {
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setTouched((prev) => ({
        ...prev,
        nombre: true, email: true, telefono: true,
        departamento: true, ciudad: true, dirección: true, barrio: true, horario: true,
      }));
      setErrors(nuevosErrores);
      const primerError = document.querySelector('.error-field');
      if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setCargandoCod(true);
    let draftOrderIdCreado = '';
    let checkoutTokenCreado = '';

    try {
      const cartHash = currentCartHash;
      const minuteBucket = Math.floor(Date.now() / 60000);
      const idempotencyKey = `${form.email || 'anon'}-${cartHash}-${minuteBucket}-cod`;

      // Crear draft order en Shopify con tag contraentrega
      const resPedido = await fetch('/api/pedido', {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ form, cartItems, cartTotal, shippingCost, paymentMethod: 'cod', idempotencyKey, funnelSessionId }),
      });
      const dataPedido = await resPedido.json();
      if (!resPedido.ok || !dataPedido.ok || !dataPedido.draftOrderId || !dataPedido.checkoutToken) {
        setErrors({ general: dataPedido?.error || 'No se pudo registrar el pedido.' });
        setCargandoCod(false);
        return;
      }
      draftOrderIdCreado = dataPedido.draftOrderId;
      checkoutTokenCreado = dataPedido.checkoutToken;

      // Completar como contraentrega
      const resCod = await fetch('/api/procesar-pago', {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({
          type: 'contraentrega',
          draftOrderId: draftOrderIdCreado,
          checkoutToken: checkoutTokenCreado,
          form,
          cartItems,
          cartTotal,
          shippingCost,
          funnelSessionId,
        }),
      });
      const dataCod = await resCod.json();
      if (!resCod.ok || !dataCod.ok) {
        setErrors({ general: dataCod?.error || 'No se pudo confirmar el pedido.' });
        setCargandoCod(false);
        return;
      }

      const finalShippingCost = Number.isFinite(Number(dataCod.shippingCost))
        ? Number(dataCod.shippingCost)
        : shippingCost;
      const finalTotal = Number.isFinite(Number(dataCod.total))
        ? Number(dataCod.total)
        : cartTotal + finalShippingCost;
      const finalSubtotal = Number.isFinite(Number(dataCod.subtotal))
        ? Number(dataCod.subtotal)
        : Math.max(0, finalTotal - finalShippingCost);

      sessionStorage.setItem('pavoa-pending-order-cod', JSON.stringify({
        items: cartItems.map(item => ({
          nombre:   item.producto.nombre,
          talla:    item.talla,
          color:    item.producto.colorSeleccionado || '',
          cantidad: item.cantidad,
          precio:   item.producto.precio,
          imagen:   item.producto.imagen1,
        })),
        subtotal:  finalSubtotal,
        shippingCost: finalShippingCost,
        total:     finalTotal,
        email:     form.email,
        nombre:    form.nombre,
        orderName: dataCod.orderName || '',
      }));

      window.location.href = '/orden-contraentrega';
    } catch (err) {
      console.error('[PAVOA] Error en pago contraentrega:', err);
      if (draftOrderIdCreado) await limpiarDraftPendiente(draftOrderIdCreado, checkoutTokenCreado);
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' });
      setCargandoCod(false);
    }
  };

  const ejecutarDiagnosticoPago = async () => {
    setDiagnosticResult(null);
    setDiagnosticLoading(true);
    try {
      const debugRaw = sessionStorage.getItem('pavoa-last-mp-debug');
      const debug = debugRaw ? JSON.parse(debugRaw) : null;
      const preferenceId = debug?.preference_id || '';

      const res = await fetch('/api/procesar-pago', {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ type: 'mp-diagnostico', preferenceId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setDiagnosticResult({ error: data?.error || 'No se pudo ejecutar el diagnostico.' });
        return;
      }
      setDiagnosticResult(data.diagnostico || { error: 'Sin datos de diagnostico.' });
    } catch {
      setDiagnosticResult({ error: 'Error de red al ejecutar diagnostico.' });
    } finally {
      setDiagnosticLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-[88px] md:pt-[104px]">
      <SEO title="Checkout" url="/checkout" noIndex />

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-12 md:py-20">

        <nav className="mb-10">
          <span className="text-[10px] tracking-[0.2em] text-stone-400 uppercase flex items-center gap-2">
            <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
            <span>/</span>
            <Link to="/categoria" className="hover:text-stone-900 transition-colors">Catálogo</Link>
            <span>/</span>
            <span className="text-stone-900 font-bold">Checkout</span>
          </span>
        </nav>

        <div className="mb-12 border border-stone-100 bg-stone-50 px-4 md:px-6 py-4">
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {CHECKOUT_STEPS.map((step, idx) => {
              const isDone = idx < checkoutStep;
              const isActive = idx === checkoutStep;
              return (
                <div key={step.key} className="flex items-center gap-2 min-w-0">
                  <span className={`w-5 h-5 md:w-6 md:h-6 border text-[9px] md:text-[10px] font-bold tracking-[0.08em] flex items-center justify-center flex-shrink-0 ${
                    isDone || isActive ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`text-[9px] md:text-[10px] tracking-[0.14em] uppercase truncate ${
                    isDone || isActive ? 'text-stone-900' : 'text-stone-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-2">
              Datos de <strong className="font-bold">Envío</strong>
            </h1>
            <p className="text-[11px] text-stone-400 tracking-[0.1em] uppercase mb-10">
              Completa la información para coordinar tu pedido
            </p>

            <div className="flex flex-col gap-8">
              <div className={errors.nombre ? 'error-field' : ''}>
                <CAMPO label="Nombre completo" name="nombre" value={form.nombre} onChange={handleChange} onBlur={handleBlur} placeholder="Tu nombre y apellido" error={errors.nombre} />
              </div>

              <div className={errors.email ? 'error-field' : ''}>
                <CAMPO label="Correo electrónico" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur} placeholder="tu@correo.com" type="email" required={true} error={errors.email} />
              </div>

              <div className={errors.telefono ? 'error-field' : ''}>
                <CAMPO label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} onBlur={handleBlur} placeholder="3XX XXX XXXX" type="tel" error={errors.telefono} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={errors.departamento ? 'error-field' : ''}>
                  <SELECTOR
                    label="Departamento"
                    name="departamento"
                    value={form.departamento}
                    onChange={handleDepto}
                    onBlur={(e) => { setTouched(p => ({ ...p, departamento: true })); setErrors(p => ({ ...p, departamento: validateField('departamento', e.target.value) })); }}
                    options={DEPARTAMENTOS}
                    placeholder="Selecciona el departamento"
                    error={errors.departamento}
                  />
                </div>
                <div className={errors.ciudad ? 'error-field' : ''}>
                  <SELECTOR
                    label="Ciudad"
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleCiudadChange}
                    onBlur={handleBlur}
                    options={form.departamento ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || []) : []}
                    placeholder={form.departamento ? 'Selecciona la ciudad' : 'Primero elige departamento'}
                    disabled={!form.departamento}
                    error={errors.ciudad}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={errors.dirección ? 'error-field' : ''}>
                  <CAMPO label="Dirección" name="dirección" value={form.dirección} onChange={handleChange} onBlur={handleBlur} placeholder="Calle, Carrera, Av..." error={errors.dirección} />
                </div>
                <div className={errors.barrio ? 'error-field' : ''}>
                  <CAMPO label="Barrio" name="barrio" value={form.barrio} onChange={handleChange} onBlur={handleBlur} placeholder="Nombre del barrio" error={errors.barrio} />
                </div>
              </div>

              <CAMPO label="Punto de referencia" name="referencia" value={form.referencia} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Frente al parque, casa azul..." required={false} />

              <div className={errors.horario ? 'error-field' : ''}>
                <label className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-4">
                  Horario de entrega <span className="text-stone-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {HORARIOS.map(h => (
                    <button key={h} type="button" onClick={() => { setForm(p => ({ ...p, horario: h })); setTouched((p) => ({ ...p, horario: true })); setErrors(p => ({ ...p, horario: validateField('horario', h) })); }}
                      className={`py-3 px-4 border text-[10px] tracking-[0.1em] uppercase transition-all duration-200 ${form.horario === h ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}>
                      {h}
                    </button>
                  ))}
                </div>
                {errors.horario && <p className="text-[10px] text-red-400 mt-2 tracking-[0.1em]">{errors.horario}</p>}
              </div>

              {/* Cambio #9: Campo de Observaciones */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">
                  Observaciones de entrega
                  <span className="text-stone-400 font-normal ml-2">(opcional)</span>
                </label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Ej: Dejar con el portero, llamar antes de llegar, no doblar en el paquete..."
                  rows={3}
                  className="w-full border-b border-stone-200 focus:border-stone-900 outline-none py-3 text-[13px] text-stone-900 placeholder-stone-300 tracking-[0.05em] transition-colors bg-transparent resize-none"
                />
              </div>
            </div>

            {/* BOTONES DE PAGO */}
            <div className="mt-12 flex flex-col gap-3">
              <button
                onClick={handlePagarOnline}
                disabled={cargandoPago || cargandoCod}
                className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3 border border-stone-900 ${(cargandoPago || cargandoCod) ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
              >
                {cargandoPago
                  ? <><span className="w-3.5 h-3.5 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />Redirigiendo a MercadoPago...</>
                  : 'Pagar en línea ahora'}
              </button>
              <button
                onClick={handlePagarContraentrega}
                disabled={cargandoPago || cargandoCod}
                className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3 border ${(cargandoPago || cargandoCod) ? 'border-stone-200 text-stone-300 cursor-not-allowed' : 'border-stone-900 text-stone-900 hover:bg-stone-50'}`}
              >
                {cargandoCod
                  ? <><span className="w-3.5 h-3.5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />Registrando pedido...</>
                  : 'Pago contra entrega'}
              </button>
            </div>

            {errors.general && (
              <p className="text-[10px] text-red-500 tracking-[0.08em] text-center mt-4">{errors.general}</p>
            )}

            {import.meta.env.DEV && (errors.general || statusFromMP === 'failure' || statusFromMP === 'rejected') && (
              <div className="mt-4 border border-stone-200 bg-stone-50 p-4">
                <button
                  type="button"
                  onClick={ejecutarDiagnosticoPago}
                  disabled={diagnosticLoading}
                  className={`w-full h-11 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
                    diagnosticLoading ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  {diagnosticLoading ? 'Ejecutando diagnostico...' : 'Diagnosticar pago'}
                </button>

                {diagnosticResult && (
                  <>
                  {Array.isArray(diagnosticResult.resumen) && diagnosticResult.resumen.length > 0 && (
                    <div className="mt-3 bg-white border border-stone-200 p-3">
                      <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-stone-900 mb-2">Resumen</p>
                      <div className="flex flex-col gap-2">
                        {diagnosticResult.resumen.map((item, idx) => (
                          <div key={`${item.code || 'item'}-${idx}`} className="text-[10px] text-stone-700">
                            <p className="font-semibold text-stone-900">{item.message}</p>
                            {item.detail && <p className="text-stone-500">{item.detail}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <pre className="mt-3 text-[10px] text-stone-700 bg-white border border-stone-200 p-3 overflow-auto max-h-[220px] whitespace-pre-wrap break-words">
{JSON.stringify(diagnosticResult, null, 2)}
                  </pre>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RESUMEN DEL PEDIDO */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="lg:sticky lg:top-[120px]">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase mb-6">Resumen del pedido</h2>
              <div className="flex flex-col gap-5 mb-8">
                {cartItems.map(item => (
                  <div key={`${item.producto.id}-${item.talla}`} className="flex gap-4">
                    <div className="w-16 h-20 bg-stone-100 overflow-hidden flex-shrink-0 relative">
                      <img src={thumbImage(item.producto.imagen1)} alt={item.producto.nombre} width={64} height={80} className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{item.cantidad}</span>
                    </div>
                    <div className="flex flex-col justify-center gap-1 flex-grow">
                      <p className="text-[11px] font-bold tracking-[0.12em] text-stone-900 uppercase">{item.producto.nombre}</p>
                      <p className="text-[10px] text-stone-400 tracking-[0.08em] uppercase">Talla: {item.talla} {item.producto.colorSeleccionado && ` · ${item.producto.colorSeleccionado}`}</p>
                      <p className="text-[12px] font-semibold text-stone-900 mt-1">{item.producto.precio}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 pt-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Subtotal</span>
                  <span className={`text-[13px] ${tieneDescuento ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                    ${cartTotal.toLocaleString('es-CO')}
                  </span>
                </div>
                {tieneDescuento && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] text-stone-900 uppercase flex items-center gap-1.5">
                      <span>✦</span> Descuento bienvenida −10%
                    </span>
                    <span className="text-[13px] text-stone-900">
                      −${Math.round(cartTotal * 0.1).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Envío</span>
                  <span className="text-[13px] text-stone-900">${shippingCost.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between items-center border-t border-stone-100 pt-4 mt-1">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-stone-900 uppercase">Total</span>
                  <span className="text-[16px] font-bold text-stone-900">
                    ${((tieneDescuento ? Math.round(cartTotal * 0.9) : cartTotal) + shippingCost).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

