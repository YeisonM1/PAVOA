import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { CartContext } from '../App';
import CrossSelling from '../sections/CrossSelling';
import { getProductoById } from '../services/productService';
import SEO from '../components/SEO';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);

  const [producto, setProducto]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [imagenActiva, setImagenActiva]   = useState(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [cantidad, setCantidad]           = useState(1);   // ✅ NUEVO
  const [adding, setAdding]               = useState(false);
  const [openAccordion, setOpenAccordion] = useState('detalles');

  useEffect(() => {
    const cargarProducto = async () => {
      setLoading(true);
      const data = await getProductoById(id);
      setProducto(data);
      if (data) setImagenActiva(data.imagen1);
      setLoading(false);
    };
    cargarProducto();
    window.scrollTo(0, 0);
  }, [id]);

  // ── Parsear tallas desde Supabase (JSON string → array) ──
const tallas = (() => {
  if (!producto?.tallas) return [];
  try { return JSON.parse(producto.tallas); }
  catch { return []; }
})();

  const esTallaUnica = tallas.length === 1 && tallas[0] === 'ÚNICA';
  const tieneTallas  = tallas.length > 0;

  // ── Handlers ──
  const handleAddToCart = () => {
    if (tieneTallas && !esTallaUnica && !tallaSeleccionada) {
      // Feedback visual sutil en lugar de alert
      const tallaSection = document.getElementById('talla-selector');
      if (tallaSection) {
        tallaSection.classList.add('animate-pulse');
        setTimeout(() => tallaSection.classList.remove('animate-pulse'), 800);
      }
      return;
    }
    setAdding(true);
    const tallaFinal = esTallaUnica ? 'ÚNICA' : tallaSeleccionada;
    // ✅ Pasa la cantidad al carrito (actualiza addToCart en CartContext — ver nota abajo)
    addToCart(producto, tallaFinal, cantidad);
    setTimeout(() => {
      setAdding(false);
      setTallaSeleccionada(null);
      setCantidad(1);
    }, 1000);
  };

  const toggleAccordion = (seccion) =>
    setOpenAccordion(openAccordion === seccion ? null : seccion);

  const incrementar = () => setCantidad(c => c + 1);
  const decrementar = () => setCantidad(c => Math.max(1, c - 1));

  // ── Estados de carga / error ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: 'var(--font-primary)' }}>
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 animate-pulse">Cargando pieza...</span>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6" style={{ fontFamily: 'var(--font-primary)' }}>
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-900">Pieza no encontrada</span>
        <Link to="/" className="text-[10px] tracking-[0.2em] uppercase border-b border-stone-900 pb-1">Volver al inicio</Link>
      </div>
    );
  }

  const detallesArray = producto.detalles
    ? producto.detalles.split(',')
    : ['Diseño exclusivo PAVOA', 'Material de alta compresión'];
  const cuidadosTexto = producto.cuidados || 'Lavar a máquina en frío con colores similares. No usar secadora.';

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-primary)' }}>

      <SEO
        title={producto.nombre}
        description={producto.descripcion || `Compra ${producto.nombre} en PAVOA. Alta calidad deportiva con envío a toda Colombia.`}
        url={`/producto/${id}`}
      />

      <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto pt-[72px] md:pt-[88px]">

        {/* ── GALERÍA ── */}
        <div className="w-full lg:w-3/5 flex flex-col gap-4 lg:p-4">
          <div className="w-full bg-stone-100 overflow-hidden relative">
            <img
              key={imagenActiva}
              src={imagenActiva}
              alt={producto.nombre}
              width={900} height={1200}
              className="w-full h-auto object-cover animate-fade-in"
              style={{ maxHeight: '75vh' }}
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[producto.imagen1, producto.imagen2].filter(Boolean).map((img, index) => (
              <button
                key={index}
                onClick={() => setImagenActiva(img)}
                className={`w-20 h-24 flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                  imagenActiva === img
                    ? 'border-stone-900 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`${producto.nombre} vista ${index + 1}`}
                  width={80} height={96}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── INFO ── */}
        <div className="w-full lg:w-2/5 px-6 py-12 lg:px-16 lg:py-24 relative">
          <div className="lg:sticky lg:top-[120px]">

            {/* Breadcrumb */}
            <nav aria-label="Ruta de navegación" className="mb-8">
              <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex flex-wrap items-center">
                <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
                <span className="mx-2">/</span>
                <Link to="/categoria" className="hover:text-stone-900 transition-colors">Catálogo</Link>
                <span className="mx-2">/</span>
                {producto.categoria && (
                  <>
                    <Link to={`/categoria/${producto.categoria.toLowerCase()}`} className="hover:text-stone-900 transition-colors">
                      {producto.categoria}
                    </Link>
                    <span className="mx-2">/</span>
                  </>
                )}
                <span className="text-stone-900 font-bold">{producto.nombre}</span>
              </span>
            </nav>

            <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
              {producto.nombre}
            </h1>
            <p className="text-sm md:text-base font-medium text-stone-600 tracking-[0.1em] mb-10">
              {producto.precio}
            </p>
            <p className="text-[12px] md:text-[13px] text-stone-600 tracking-[0.1em] leading-relaxed mb-12 uppercase">
              {producto.descripcion}
            </p>

            {/* ── ✅ SELECTOR DE CANTIDAD (opción B: va antes de tallas) ── */}
            <div className="mb-8">
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-4">
                Cantidad
              </span>
              <div className="inline-flex items-center border border-stone-200">
                <button
                  onClick={decrementar}
                  disabled={cantidad <= 1}
                  aria-label="Disminuir cantidad"
                  className="w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={13} strokeWidth={2} />
                </button>
                <span
                  className="w-12 h-11 flex items-center justify-center text-[13px] font-medium text-stone-900 border-x border-stone-200 select-none"
                  aria-live="polite"
                  aria-label={`Cantidad: ${cantidad}`}
                >
                  {cantidad}
                </span>
                <button
                  onClick={incrementar}
                  aria-label="Aumentar cantidad"
                  className="w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <Plus size={13} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* ── ✅ SELECTOR DE TALLAS — dinámico desde Supabase ── */}
            {tieneTallas && (
              <div id="talla-selector" className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">
                    Talla
                  </span>
                  {!esTallaUnica && (
                    <button className="text-[9px] font-bold tracking-[0.15em] text-stone-400 hover:text-stone-900 uppercase underline transition-colors">
                      Guía de tallas
                    </button>
                  )}
                </div>

                {esTallaUnica ? (
                  // ── TALLA ÚNICA: badge informativo deshabilitado ──
                  <div className="flex flex-col gap-3">
                    <div
                      className="h-12 border border-stone-200 bg-stone-50 flex items-center justify-center gap-3 cursor-default select-none"
                      aria-label="Este producto es talla única"
                    >
                      <span className="text-[11px] font-medium text-stone-400 tracking-[0.15em] uppercase">
                        Talla Única
                      </span>
                    </div>
                    <p className="text-[9px] tracking-[0.15em] text-stone-400 uppercase text-center">
                      Este producto tiene una sola talla · aplica para todas
                    </p>
                  </div>
                ) : (
                  // ── TALLAS NORMALES — dinámicas ──
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(tallas.length, 4)}, minmax(0, 1fr))` }}>
                    {tallas.map(talla => (
                      <button
                        key={talla}
                        onClick={() => setTallaSeleccionada(talla)}
                        className={`h-12 border flex items-center justify-center text-[11px] font-medium tracking-[0.05em] transition-colors uppercase
                          ${tallaSeleccionada === talla
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 text-stone-600 hover:border-stone-900'
                          }
                        `}
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── BOTÓN AÑADIR ── */}
            <button
              onClick={handleAddToCart}
              className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
                ${adding
                  ? 'bg-stone-800 text-white scale-[0.98]'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
                }
              `}
            >
              {adding ? 'Agregado ✔' : 'Añadir a la bolsa'}
            </button>

            <div className="w-full h-[1px] bg-stone-200 my-12" />

            {/* ── ACORDEONES ── */}
            <div className="flex flex-col">
              <div className="border-b border-stone-200">
                <button onClick={() => toggleAccordion('detalles')} className="w-full py-6 flex items-center justify-between text-left">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Detalles del diseño</span>
                  {openAccordion === 'detalles'
                    ? <Minus size={14} className="text-stone-500" />
                    : <Plus  size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'detalles' ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <ul className="list-disc pl-4 flex flex-col gap-2">
                    {detallesArray.map((detalle, idx) => (
                      <li key={idx} className="text-[11px] text-stone-600 tracking-[0.1em] uppercase">{detalle.trim()}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-b border-stone-200">
                <button onClick={() => toggleAccordion('cuidados')} className="w-full py-6 flex items-center justify-between text-left">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Composición y Cuidados</span>
                  {openAccordion === 'cuidados'
                    ? <Minus size={14} className="text-stone-500" />
                    : <Plus  size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'cuidados' ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <p className="text-[11px] text-stone-600 tracking-[0.1em] leading-relaxed uppercase">
                    {cuidadosTexto}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <CrossSelling currentProductId={producto.id} />
    </div>
  );
}