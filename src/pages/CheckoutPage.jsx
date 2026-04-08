import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../App';
import SEO from '../components/SEO';

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
  const { cartItems, cartTotal, cartCount } = useContext(CartContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    barrio: '',
    referencia: '',
    horario: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [errors, setErrors]     = useState({});

  // Si el carrito está vacío, redirigir al inicio
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

  const handleConfirmar = () => {
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      // Scroll al primer error
      const primerError = document.querySelector('.error-field');
      if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setEnviando(true);

    // Construir mensaje WhatsApp
    let mensaje = `Hola PAVOA, me gustaría confirmar mi pedido 🛍️\n\n`;
    mensaje += `*DATOS DE ENVÍO*\n`;
    mensaje += `───────────────\n`;
    mensaje += `👤 Nombre: ${form.nombre}\n`;
    mensaje += `📞 Teléfono: ${form.telefono}\n`;
    mensaje += `🏙️ Ciudad: ${form.ciudad}\n`;
    mensaje += `📍 Dirección: ${form.direccion}, ${form.barrio}\n`;
    if (form.referencia) mensaje += `📌 Referencia: ${form.referencia}\n`;
    mensaje += `🕐 Horario: ${form.horario}\n\n`;
    mensaje += `*DETALLE DEL PEDIDO*\n`;
    mensaje += `───────────────\n`;

    cartItems.forEach((item, i) => {
      const color = item.producto.colorSeleccionado
        ? ` · Color: ${item.producto.colorSeleccionado}` : '';
      mensaje += `${i + 1}. ${item.producto.nombre}\n`;
      mensaje += `   Talla: ${item.talla}${color}\n`;
      mensaje += `   Cantidad: ${item.cantidad}\n`;
      mensaje += `   Precio: ${item.producto.precio}\n\n`;
    });

    mensaje += `───────────────\n`;
    mensaje += `*Total estimado: $${cartTotal.toLocaleString('es-CO')}*\n\n`;
    mensaje += `Quedo atenta a los pasos para confirmar el pago.`;

    setTimeout(() => {
      window.open(
        `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`,
        '_blank'
      );
      setEnviando(false);
      navigate('/');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white pt-[88px] md:pt-[104px]">
      <SEO title="Checkout — PAVOA" url="/checkout" />

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-12 md:py-20">

        {/* Breadcrumb */}
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

          {/* ── FORMULARIO ── */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-2">
              Datos de <strong className="font-bold">Envío</strong>
            </h1>
            <p className="text-[11px] text-stone-400 tracking-[0.1em] uppercase mb-10">
              Completa la información para coordinar tu pedido
            </p>

            <div className="flex flex-col gap-8">

              {/* Nombre */}
              <div className={errors.nombre ? 'error-field' : ''}>
                <CAMPO label="Nombre completo" name="nombre" value={form.nombre}
                  onChange={handleChange} placeholder="Tu nombre y apellido" />
                {errors.nombre && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.nombre}</p>}
              </div>

              {/* Teléfono */}
              <div className={errors.telefono ? 'error-field' : ''}>
                <CAMPO label="Teléfono / WhatsApp" name="telefono" value={form.telefono}
                  onChange={handleChange} placeholder="3XX XXX XXXX" type="tel" />
                {errors.telefono && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.telefono}</p>}
              </div>

              {/* Ciudad */}
              <div className={errors.ciudad ? 'error-field' : ''}>
                <CAMPO label="Ciudad" name="ciudad" value={form.ciudad}
                  onChange={handleChange} placeholder="Ej: Medellín" />
                {errors.ciudad && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.ciudad}</p>}
              </div>

              {/* Dirección + Barrio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={errors.direccion ? 'error-field' : ''}>
                  <CAMPO label="Dirección" name="direccion" value={form.direccion}
                    onChange={handleChange} placeholder="Calle, Carrera, Av..." />
                  {errors.direccion && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.direccion}</p>}
                </div>
                <div className={errors.barrio ? 'error-field' : ''}>
                  <CAMPO label="Barrio" name="barrio" value={form.barrio}
                    onChange={handleChange} placeholder="Nombre del barrio" />
                  {errors.barrio && <p className="text-[10px] text-red-400 mt-1 tracking-[0.1em]">{errors.barrio}</p>}
                </div>
              </div>

              {/* Referencia */}
              <CAMPO label="Punto de referencia" name="referencia" value={form.referencia}
                onChange={handleChange} placeholder="Ej: Frente al parque, casa azul..." required={false} />

              {/* Horario */}
              <div className={errors.horario ? 'error-field' : ''}>
                <label className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-4">
                  Horario de entrega <span className="text-stone-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {HORARIOS.map(h => (
                    <button key={h} type="button" onClick={() => { setForm(p => ({ ...p, horario: h })); setErrors(p => ({ ...p, horario: '' })); }}
                      className={`py-3 px-4 border text-[10px] tracking-[0.1em] uppercase transition-all duration-200
                        ${form.horario === h
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 text-stone-600 hover:border-stone-900'
                        }`}>
                      {h}
                    </button>
                  ))}
                </div>
                {errors.horario && <p className="text-[10px] text-red-400 mt-2 tracking-[0.1em]">{errors.horario}</p>}
              </div>

            </div>

            {/* Botón confirmar */}
            <button
              onClick={handleConfirmar}
              disabled={enviando}
              className={`mt-12 w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
                ${enviando ? 'bg-stone-700 text-white scale-[0.98]' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
            >
              {enviando ? 'Redirigiendo a WhatsApp...' : 'Confirmar pedido por WhatsApp'}
              {!enviando && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>

            <p className="text-[10px] text-stone-400 tracking-[0.1em] uppercase text-center mt-4">
              Serás redirigido a WhatsApp para confirmar tu pedido
            </p>
          </div>

          {/* ── RESUMEN DEL PEDIDO ── */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="lg:sticky lg:top-[120px]">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase mb-6">
                Resumen del pedido
              </h2>

              <div className="flex flex-col gap-5 mb-8">
                {cartItems.map(item => (
                  <div key={`${item.producto.id}-${item.talla}`} className="flex gap-4">
                    <div className="w-16 h-20 bg-stone-100 overflow-hidden flex-shrink-0 relative">
                      <img src={item.producto.imagen1} alt={item.producto.nombre}
                        className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {item.cantidad}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center gap-1 flex-grow">
                      <p className="text-[11px] font-bold tracking-[0.12em] text-stone-900 uppercase">
                        {item.producto.nombre}
                      </p>
                      <p className="text-[10px] text-stone-400 tracking-[0.08em] uppercase">
                        Talla: {item.talla}
                        {item.producto.colorSeleccionado && ` · ${item.producto.colorSeleccionado}`}
                      </p>
                      <p className="text-[12px] font-semibold text-stone-900 mt-1">
                        {item.producto.precio}
                      </p>
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