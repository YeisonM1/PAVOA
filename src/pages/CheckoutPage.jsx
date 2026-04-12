import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../App';
import SEO from '../components/SEO';
import { thumbImage } from '../utils/imageUrl';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;
if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-CO' });
} else {
  console.error('[PAVOA] VITE_MP_PUBLIC_KEY no está definida. El formulario de pago no cargará.');
}

const NUMERO_WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER;

const HORARIOS = ['Mañana (8am - 12pm)', 'Tarde (12pm - 6pm)', 'Noche (6pm - 9pm)'];

const CAMPO = ({ label, name, value, onChange, placeholder, type = 'text', required = true }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">
      {label} {required && <span className="text-stone-400">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full border-b border-stone-200 focus:border-stone-900 outline-none py-3 text-[13px] text-stone-900 placeholder-stone-300 tracking-[0.05em] transition-colors bg-transparent"
    />
  </div>
);

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartCount, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

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
  const [enviando, setEnviando]           = useState(false);
  const [pagandoOnline, setPagandoOnline] = useState(false);
  const [errors, setErrors]               = useState({});
  const [mostrarFormPago, setMostrarFormPago] = useState(false);
  const [resultadoPago, setResultadoPago]     = useState(null); // { status, status_detail, payment_id }
  const [errorBrick, setErrorBrick]           = useState(!MP_PUBLIC_KEY);
  const [errorPago, setErrorPago]             = useState(null); // mensaje de error visible al usuario

  if (cartCount === 0 && !resultadoPago) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <p className="text-[11px] tracking-[0.2em] uppercase text-stone-500">Tu bolsa está vacía</p>
        <Link to="/" className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.nombre.trim())    nuevosErrores.nombre    = 'Requerido';
    if (!form.telefono.trim())  nuevosErrores.telefono  = 'Requerido';
    if (!form.ciudad.trim())    nuevosErrores.ciudad    = 'Requerido';
    if (!form.direccion.trim()) nuevosErrores.direccion = 'Requerido';
    if (!form.barrio.trim())    nuevosErrores.barrio    = 'Requerido';
    if (!form.horario)          nuevosErrores.horario   = 'Selecciona un horario';
    return nuevosErrores;
  };

  // ── FUNCIÓN 1: PAGO POR WHATSAPP ──
  const handleConfirmar = async () => {
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      const primerError = document.querySelector('.error-field');
      if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setEnviando(true);

    try {
      await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, cartItems, cartTotal }),
      });
    } catch (err) {
      console.warn('Draft order no creado:', err);
    }

    let mensaje = `Hola PAVOA, me gustaría confirmar mi pedido 🛍️\n\n`;
    mensaje += `*DATOS DE ENVÍO*\n`;
    mensaje += `───────────────\n`;
    mensaje += `👤 Nombre: ${form.nombre}\n`;
    if (form.email) mensaje += `📧 Email: ${form.email}\n`;
    mensaje += `📞 Teléfono: ${form.telefono}\n`;
    mensaje += `🏙️ Ciudad: ${form.ciudad}\n`;
    mensaje += `📍 Dirección: ${form.direccion}, ${form.barrio}\n`;
    if (form.referencia) mensaje += `📌 Referencia: ${form.referencia}\n`;
    mensaje += `🕐 Horario: ${form.horario}\n\n`;
    mensaje += `*DETALLE DEL PEDIDO*\n`;
    mensaje += `───────────────\n`;

    cartItems.forEach((item, i) => {
      const color = item.producto.colorSeleccionado ? ` · Color: ${item.producto.colorSeleccionado}` : '';
      mensaje += `${i + 1}. ${item.producto.nombre}\n`;
      mensaje += `   Talla: ${item.talla}${color}\n`;
      mensaje += `   Cantidad: ${item.cantidad}\n`;
      mensaje += `   Precio: ${item.producto.precio}\n\n`;
    });

    mensaje += `───────────────\n`;
    mensaje += `*Total estimado: $${cartTotal.toLocaleString('es-CO')}*\n\n`;
    mensaje += `Quedo atenta a los pasos para confirmar el pago.`;

    setTimeout(() => {
      window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`, '_blank');
      setEnviando(false);
      navigate('/');
    }, 600);
  };

  // ── FUNCIÓN 2: MOSTRAR FORMULARIO DE TARJETA ──
  // Solo valida el formulario de envío y muestra el CardPayment.
  // El pedido en Shopify se crea DESPUÉS de confirmar el pago — no antes.
  const handleMercadoPago = () => {
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      const primerError = document.querySelector('.error-field');
      if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setMostrarFormPago(true);
    setTimeout(() => {
      document.getElementById('seccion-pago')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ── FUNCIÓN 3: PROCESAR PAGO CON TARJETA — callback de CardPayment ──
  // 1. Crea el draft order en Shopify
  // 2. Procesa el pago con el token recibido del Brick
  // El pedido solo queda registrado si el pago resulta aprobado o pendiente.
  const handlePagarConTarjeta = async (formData) => {
    setErrorPago(null);
    // Variable local — no depende del ciclo de render de React
    let errorLocal = null;

    const fallar = (mensaje) => {
      errorLocal = mensaje;
      setErrorPago(mensaje);
      throw new Error(mensaje);
    };

    try {
      // Paso 1 — Crear draft order en Shopify
      let dataPedido;
      try {
        const resPedido = await fetch('/api/pedido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form, cartItems, cartTotal }),
        });
        dataPedido = await resPedido.json();
        if (!resPedido.ok || !dataPedido.ok || !dataPedido.draftOrderId) {
          fallar(`No se pudo registrar el pedido: ${dataPedido?.error || `HTTP ${resPedido.status}`}`);
        }
      } catch (e) {
        if (errorLocal) throw e;
        fallar('No se pudo conectar con el servidor para registrar el pedido.');
      }

      // Paso 2 — Procesar pago en Mercado Pago
      let data;
      try {
        const resPago = await fetch('/api/procesar-pago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token:              formData.token,
            payment_method_id:  formData.payment_method_id,
            installments:       formData.installments,
            issuer_id:          formData.issuer_id,
            draftOrderId:       dataPedido.draftOrderId,
            transaction_amount: cartTotal,
            payer: {
              email:          form.email || 'cliente@pavoa.com',
              identification: formData.payer?.identification,
            },
          }),
        });
        data = await resPago.json();
        if (!resPago.ok) {
          fallar(`Error del servidor al procesar el pago: ${data?.error || `HTTP ${resPago.status}`}`);
        }
      } catch (e) {
        if (errorLocal) throw e;
        fallar('No se pudo conectar con el servidor para procesar el pago.');
      }

      if (data.status === 'approved') {
        setResultadoPago(data);
        clearCart();
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (data.status === 'pending') {
        setResultadoPago(data);
        return;
      }

      // rejected / cancelled
      fallar(`Pago rechazado (${data.status_detail || 'motivo desconocido'}). Verifica los datos de tu tarjeta.`);

    } catch (err) {
      if (!errorLocal) {
        setErrorPago('Error inesperado. Intenta de nuevo o usa WhatsApp.');
      }
      throw err;
    }
  };

  const handleCambiarMetodo = () => {
    setMostrarFormPago(false);
    setResultadoPago(null);
    setErrorPago(null);
    setErrorBrick(!MP_PUBLIC_KEY);
  };

  return (
    <div className="min-h-screen bg-white pt-[88px] md:pt-[104px]">
      <SEO title="Checkout — PAVOA" url="/checkout" />

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
                <CAMPO label="Nombre completo" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre y apellido" />
                {errors.nombre && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.nombre}</p>}
              </div>

              <CAMPO label="Correo electrónico" name="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com" type="email" required={false} />

              <div className={errors.telefono ? 'error-field' : ''}>
                <CAMPO label="Teléfono / WhatsApp" name="telefono" value={form.telefono} onChange={handleChange} placeholder="3XX XXX XXXX" type="tel" />
                {errors.telefono && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.telefono}</p>}
              </div>

              <div className={errors.ciudad ? 'error-field' : ''}>
                <CAMPO label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ej: Medellín" />
                {errors.ciudad && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.ciudad}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={errors.direccion ? 'error-field' : ''}>
                  <CAMPO label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, Carrera, Av..." />
                  {errors.direccion && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.direccion}</p>}
                </div>
                <div className={errors.barrio ? 'error-field' : ''}>
                  <CAMPO label="Barrio" name="barrio" value={form.barrio} onChange={handleChange} placeholder="Nombre del barrio" />
                  {errors.barrio && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.barrio}</p>}
                </div>
              </div>

              <CAMPO label="Punto de referencia" name="referencia" value={form.referencia} onChange={handleChange} placeholder="Ej: Frente al parque, casa azul..." required={false} />

              <div className={errors.horario ? 'error-field' : ''}>
                <label className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-4">
                  Horario de entrega <span className="text-stone-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {HORARIOS.map(h => (
                    <button key={h} type="button" onClick={() => { setForm(p => ({ ...p, horario: h })); setErrors(p => ({ ...p, horario: '' })); }}
                      className={`py-3 px-4 border text-[10px] tracking-[0.1em] uppercase transition-all duration-200 ${form.horario === h ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}>
                      {h}
                    </button>
                  ))}
                </div>
                {errors.horario && <p className="text-[10px] text-red-400 mt-2 tracking-[0.1em]">{errors.horario}</p>}
              </div>
            </div>

            {/* ── BOTONES DE PAGO (se ocultan cuando aparece el formulario de tarjeta) ── */}
            {!mostrarFormPago && (
              <>
                <button onClick={handleConfirmar} disabled={enviando || pagandoOnline} className={`mt-12 w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3 ${enviando ? 'bg-stone-700 text-white scale-[0.98]' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                  {enviando ? 'Redirigiendo a WhatsApp...' : 'Confirmar pedido por WhatsApp'}
                  {!enviando && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-[1px] bg-stone-100" />
                  <span className="text-[9px] tracking-[0.2em] text-stone-300 uppercase">o</span>
                  <div className="flex-1 h-[1px] bg-stone-100" />
                </div>

                <button onClick={handleMercadoPago} disabled={enviando || pagandoOnline} className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3 border border-stone-900 ${pagandoOnline ? 'bg-stone-100 text-stone-400 border-stone-200' : 'bg-white text-stone-900 hover:bg-stone-50'}`}>
                  {pagandoOnline ? 'Preparando pago...' : 'Pagar en línea ahora'}
                </button>

                <p className="text-[10px] text-stone-400 tracking-[0.1em] uppercase text-center mt-4 italic">
                  Selecciona tu método de preferencia para finalizar
                </p>
              </>
            )}

            {/* ── FORMULARIO DE TARJETA (Checkout API) ── */}
            {mostrarFormPago && (
              <div id="seccion-pago" className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">
                    Datos de pago
                  </h2>
                  <button
                    onClick={handleCambiarMetodo}
                    className="text-[10px] tracking-[0.1em] text-stone-400 uppercase border-b border-stone-200 hover:border-stone-900 hover:text-stone-900 transition-colors"
                  >
                    Cambiar método
                  </button>
                </div>

                {/* Error visible al usuario (fallo de API o pago rechazado) */}
                {errorPago && (
                  <div className="mb-6 p-4 border border-red-200 bg-red-50">
                    <p className="text-[11px] font-bold tracking-[0.15em] text-red-700 uppercase mb-1">
                      Error al procesar el pago
                    </p>
                    <p className="text-[10px] text-red-500 tracking-[0.08em]">
                      {errorPago}
                    </p>
                  </div>
                )}

                {/* Mensaje de pago aprobado */}
                {resultadoPago?.status === 'approved' && (
                  <div className="mb-6 p-4 border border-stone-900 bg-stone-50">
                    <p className="text-[11px] font-bold tracking-[0.15em] text-stone-900 uppercase">
                      Pago aprobado
                    </p>
                    <p className="text-[10px] text-stone-500 tracking-[0.08em] mt-1">
                      Tu pedido fue confirmado. Redirigiendo...
                    </p>
                  </div>
                )}

                {/* Mensaje de pago pendiente (PSE / Efecty) */}
                {resultadoPago?.status === 'pending' && (
                  <div className="mb-6 p-4 border border-stone-300 bg-stone-50">
                    <p className="text-[11px] font-bold tracking-[0.15em] text-stone-700 uppercase">
                      Pago en proceso
                    </p>
                    <p className="text-[10px] text-stone-500 tracking-[0.08em] mt-1">
                      Tu pago está siendo procesado. Recibirás confirmación por correo cuando esté aprobado.
                    </p>
                  </div>
                )}

                {!resultadoPago && !errorBrick && (
                  <CardPayment
                    initialization={{ amount: cartTotal }}
                    onSubmit={handlePagarConTarjeta}
                    onError={() => setErrorBrick(true)}
                  />
                )}

                {!resultadoPago && errorBrick && (
                  <div className="p-5 border border-stone-200 bg-stone-50">
                    <p className="text-[11px] font-bold tracking-[0.15em] text-stone-700 uppercase mb-2">
                      No se pudo cargar el formulario de pago
                    </p>
                    <p className="text-[10px] text-stone-500 tracking-[0.08em] mb-4">
                      Hubo un problema al inicializar el sistema de pago. Puedes intentarlo de nuevo o completar tu pedido por WhatsApp.
                    </p>
                    <button
                      onClick={() => { setErrorBrick(false); setMostrarFormPago(false); setDraftOrderId(null); }}
                      className="text-[10px] font-bold tracking-[0.15em] uppercase border-b border-stone-900 pb-0.5 hover:text-stone-600 transition-colors"
                    >
                      Volver a intentar
                    </button>
                  </div>
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
                  <span className="text-[13px] text-stone-900">${cartTotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Envío</span>
                  <span className="text-[11px] text-stone-500 uppercase tracking-[0.1em]">A coordinar</span>
                </div>
                <div className="flex justify-between items-center border-t border-stone-100 pt-4 mt-1">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-stone-900 uppercase">Total</span>
                  <span className="text-[16px] font-bold text-stone-900">${cartTotal.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
