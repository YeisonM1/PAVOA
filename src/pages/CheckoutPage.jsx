import React, { useState, useContext, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CartContext } from '../App';
import { trackBeginCheckout } from '../lib/analytics';
import SEO from '../components/SEO';
import { thumbImage } from '../utils/imageUrl';
import { verificarStock } from '../services/productService';
import { estaAutenticado, getCliente, getToken } from '../services/authService';

const HORARIOS = ['Mañana (8am - 12pm)', 'Tarde (12pm - 6pm)', 'Noche (6pm - 9pm)'];

const CHECKOUT_STEPS = [
  { key: 'bag', label: 'Bolsa' },
  { key: 'data', label: 'Datos' },
  { key: 'payment', label: 'Pago' },
  { key: 'done', label: 'Confirmacion' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOLO_DIGITOS = /\D/g;
const CHECKOUT_FORM_KEY = 'pavoa-checkout-form-v1';

const limpiarDraftPendiente = async (draftOrderId) => {
  const id = String(draftOrderId || '').trim();
  if (!id) return false;

  try {
    const res = await fetch('/api/procesar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cancel-draft-order', draftOrderId: id }),
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

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartCount } = useContext(CartContext);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (cartItems.length > 0) trackBeginCheckout(cartItems, cartTotal);
  }, []);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    barrio: '',
    referencia: '',
    horario: '',
  });
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

  const [cargandoPago, setCargandoPago] = useState(false);
  const [errors, setErrors]           = useState({});
  const [tieneDescuento, setTieneDescuento] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const checkoutStep = cargandoPago ? 2 : 1;
  const statusFromMP = (searchParams.get('status') || '').toLowerCase();
  const statusDetailFromMP = (searchParams.get('status_detail') || '').toLowerCase();

  useEffect(() => {
    try {
      sessionStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    if (!estaAutenticado()) return;
    const cliente = getCliente();
    if (!cliente?.email) return;
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('/api/check-descuento', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: cliente.email }),
    })
      .then(r => r.json())
      .then(d => setTieneDescuento(d.disponible || false))
      .catch(() => {});
  }, []);

  // Limpiar sesion de checkout si el carrito cambia
  useEffect(() => {
    sessionStorage.removeItem('pavoa-checkout-session');
  }, [cartItems.length]);

  useEffect(() => {
    if (cartCount !== 0) return;
    try {
      sessionStorage.removeItem(CHECKOUT_FORM_KEY);
    } catch {}
  }, [cartCount]);

  useEffect(() => {
    const isRejected = statusFromMP === 'failure' || statusFromMP === 'rejected';
    if (!isRejected) return;

    try {
      const checkoutSession = JSON.parse(sessionStorage.getItem('pavoa-checkout-session') || 'null');
      const draftOrderId = checkoutSession?.draftOrderId || '';
      if (draftOrderId) {
        limpiarDraftPendiente(draftOrderId);
      }
    } catch {}

    sessionStorage.removeItem('pavoa-checkout-session');

    const rejectionMessages = {
      cc_rejected_insufficient_amount: 'Tu banco rechazo el pago por fondos o cupo insuficiente.',
      cc_rejected_call_for_authorize: 'Tu banco requiere autorizacion para esta compra. Intenta de nuevo o llama a tu banco.',
      cc_rejected_card_disabled: 'La tarjeta no esta habilitada para compras en linea.',
      cc_rejected_duplicated_payment: 'MercadoPago detecto intento duplicado. Ya generamos una nueva sesion para reintentar.',
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
      if (!email) return 'Escribe tu correo para enviarte la confirmacion.';
      if (!EMAIL_REGEX.test(email)) return 'Escribe un correo valido.';
      return '';
    }
    if (field === 'telefono') {
      const telefono = String(value || '').trim();
      if (!telefono) return 'Escribe tu telefono o WhatsApp.';
      if (telefono.replace(SOLO_DIGITOS, '').length < 10) return 'Revisa tu numero, parece incompleto.';
      return '';
    }
    if (field === 'ciudad') {
      if (!String(value || '').trim()) return 'Indicanos en que ciudad recibes el pedido.';
      return '';
    }
    if (field === 'direccion') {
      const direccion = String(value || '').trim();
      if (!direccion) return 'Escribe una direccion de entrega.';
      if (direccion.length < 6) return 'Tu direccion esta muy corta, agrega mas detalle.';
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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validar = () => {
    const nuevosErrores = {};
    ['nombre', 'email', 'telefono', 'ciudad', 'direccion', 'barrio', 'horario'].forEach((field) => {
      const fieldError = validateField(field, form[field]);
      if (fieldError) nuevosErrores[field] = fieldError;
    });
    return nuevosErrores;
  };

  // ── PAGO EN LÍNEA (Checkout Pro) ──
  const handlePagarOnline = async () => {
    let draftOrderIdCreado = '';
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setTouched((prev) => ({
        ...prev,
        nombre: true,
        email: true,
        telefono: true,
        ciudad: true,
        direccion: true,
        barrio: true,
        horario: true,
      }));
      setErrors(nuevosErrores);
      const primerError = document.querySelector('.error-field');
      if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Proteccion doble pago: siempre crear una preferencia nueva.
    // Reutilizar init_point estaba generando redirecciones a sesiones viejas de MP.
    const cartHash = cartItems.map(i => `${i.producto.id}|${i.talla}|${i.cantidad}`).join(',');
    // Clave de idempotencia por minuto: evita crear dos Draft Orders por doble-click o retry rápido
    const minuteBucket    = Math.floor(Date.now() / 60000);
    const idempotencyKey  = `${form.email || 'anon'}-${cartHash}-${minuteBucket}`;

    sessionStorage.removeItem('pavoa-checkout-session');

    setCargandoPago(true);

    try {
      // Paso 1 — Verificar stock
      const erroresStock = await verificarStock(cartItems);
      if (erroresStock.length > 0) {
        setErrors({ general: erroresStock.join(' ') });
        setCargandoPago(false);
        return;
      }

      // Paso 2 — Crear draft order en Shopify
      const resPedido = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, cartItems, cartTotal, idempotencyKey }),
      });
      const dataPedido = await resPedido.json();
      if (!resPedido.ok || !dataPedido.ok || !dataPedido.draftOrderId) {
        setErrors({ general: dataPedido?.error || 'No se pudo registrar el pedido.' });
        setCargandoPago(false);
        return;
      }
      draftOrderIdCreado = dataPedido.draftOrderId;

      // Paso 3 — Crear preferencia en MercadoPago
      const resPref = await fetch('/api/procesar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, cartItems, cartTotal, draftOrderId: draftOrderIdCreado }),
      });
      const dataPref = await resPref.json();
      if (!resPref.ok || !dataPref.init_point) {
        await limpiarDraftPendiente(draftOrderIdCreado);
        setErrors({ general: dataPref?.error || 'No se pudo iniciar el pago.' });
        setCargandoPago(false);
        return;
      }

      if (dataPref?.debug) {
        sessionStorage.setItem('pavoa-last-mp-debug', JSON.stringify(dataPref.debug));
        console.info('[PAVOA][MP DEBUG]', dataPref.debug);
      }

      // Paso 4 — Guardar datos del pedido y sesión de checkout en sessionStorage
      sessionStorage.setItem('pavoa-pending-order', JSON.stringify({
        items: cartItems.map(item => ({
          nombre:   item.producto.nombre,
          talla:    item.talla,
          color:    item.producto.colorSeleccionado || '',
          cantidad: item.cantidad,
          precio:   item.producto.precio,
          imagen:   item.producto.imagen1,
        })),
        total:  cartTotal,
        email:  form.email,
        nombre: form.nombre,
      }));
      sessionStorage.setItem('pavoa-checkout-session', JSON.stringify({
        initPoint:    dataPref.init_point,
        draftOrderId: draftOrderIdCreado,
        cartHash,
        ts:           Date.now(),
      }));

      // Paso 5 — Redirigir a MercadoPago
      window.location.href = dataPref.init_point;

    } catch (err) {
      if (draftOrderIdCreado) {
        await limpiarDraftPendiente(draftOrderIdCreado);
      }
      console.error('[PAVOA] Error al iniciar pago:', err);
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' });
      setCargandoPago(false);
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
        headers: { 'Content-Type': 'application/json' },
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
                <CAMPO label="Teléfono / WhatsApp" name="telefono" value={form.telefono} onChange={handleChange} onBlur={handleBlur} placeholder="3XX XXX XXXX" type="tel" error={errors.telefono} />
              </div>

              <div className={errors.ciudad ? 'error-field' : ''}>
                <CAMPO label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Medellín" error={errors.ciudad} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={errors.direccion ? 'error-field' : ''}>
                  <CAMPO label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} onBlur={handleBlur} placeholder="Calle, Carrera, Av..." error={errors.direccion} />
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
            </div>

            {/* ── BOTÓN DE PAGO ── */}
            <button onClick={handlePagarOnline} disabled={cargandoPago} className={`mt-12 w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3 border border-stone-900 ${cargandoPago ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
              {cargandoPago
                ? <><span className="w-3.5 h-3.5 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />Redirigiendo a MercadoPago...</>
                : 'Pagar en línea ahora'}
            </button>

            {errors.general && (
              <p className="text-[10px] text-red-500 tracking-[0.08em] text-center mt-4">{errors.general}</p>
            )}

            {(errors.general || statusFromMP === 'failure' || statusFromMP === 'rejected') && (
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

          {/* ── RESUMEN DEL PEDIDO ── */}
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
                    <span className="text-[10px] tracking-[0.15em] uppercase flex items-center gap-1.5" style={{ color: '#DFCDB4' }}>
                      <span>✦</span> Descuento bienvenida −10%
                    </span>
                    <span className="text-[13px]" style={{ color: '#DFCDB4' }}>
                      −${Math.round(cartTotal * 0.1).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Envío</span>
                  <span className="text-[11px] text-stone-500 uppercase tracking-[0.1em]">A coordinar</span>
                </div>
                <div className="flex justify-between items-center border-t border-stone-100 pt-4 mt-1">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-stone-900 uppercase">Total</span>
                  <span className="text-[16px] font-bold text-stone-900">
                    ${(tieneDescuento ? Math.round(cartTotal * 0.9) : cartTotal).toLocaleString('es-CO')}
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
