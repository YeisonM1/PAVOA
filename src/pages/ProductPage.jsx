import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { CartContext } from '../App';
import CrossSelling from '../sections/CrossSelling';
import { getProductoById } from '../services/productService';
import SEO from '../components/SEO';
import { productImage, thumbImage } from '../utils/imageUrl';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);

  const [producto, setProducto]                   = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [imagenActiva, setImagenActiva]           = useState(null);
  const [fadeKey, setFadeKey]                     = useState(0); // ✅ para fade
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [cantidad, setCantidad]                   = useState(1);
  const [adding, setAdding]                       = useState(false);
  const [openAccordion, setOpenAccordion]         = useState('detalles');

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

  // ── VARIANTES ──────────────────────────────────────────────
  const variantes = useMemo(() => {
    if (!producto?.variantes) return [];
    try {
      const parsed = typeof producto.variantes === 'string'
        ? JSON.parse(producto.variantes)
        : producto.variantes;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [producto?.variantes]);

  const coloresUnicos = useMemo(() => {
    const vistos = new Set();
    return variantes.filter(v => {
      if (vistos.has(v.color)) return false;
      vistos.add(v.color);
      return true;
    });
  }, [variantes]);

  const tallasDisponibles = useMemo(() => {
    if (!colorSeleccionado) return [];
    return variantes.filter(v => v.color === colorSeleccionado).map(v => v.talla);
  }, [variantes, colorSeleccionado]);

  const stockActual = useMemo(() => {
    if (!colorSeleccionado || !tallaSeleccionada) return null;
    const v = variantes.find(v => v.color === colorSeleccionado && v.talla === tallaSeleccionada);
    return v?.stock ?? 0;
  }, [variantes, colorSeleccionado, tallaSeleccionada]);

  const esTallaUnica   = tallasDisponibles.length === 1 && tallasDisponibles[0] === 'ÚNICA';
  const tieneVariantes = variantes.length > 0;
  // ──────────────────────────────────────────────────────────

  // ✅ Cambio de imagen con fade
  const handleImageChange = (img) => {
    if (img === imagenActiva) return;
    setImagenActiva(img);
    setFadeKey(k => k + 1);
  };

  const handleColorSelect = (color) => {
    setColorSeleccionado(colorSeleccionado === color ? null : color);
    setTallaSeleccionada(null);
  };

  const handleAddToCart = () => {
    if (!colorSeleccionado) {
      const el = document.getElementById('color-selector');
      if (el) { el.classList.add('animate-pulse'); setTimeout(() => el.classList.remove('animate-pulse'), 800); }
      return;
    }
    if (!esTallaUnica && !tallaSeleccionada) {
      const el = document.getElementById('talla-selector');
      if (el) { el.classList.add('animate-pulse'); setTimeout(() => el.classList.remove('animate-pulse'), 800); }
      return;
    }
    setAdding(true);
    const tallaFinal = esTallaUnica ? 'ÚNICA' : tallaSeleccionada;
    addToCart({ ...producto, colorSeleccionado }, tallaFinal, cantidad);
    setTimeout(() => {
      setAdding(false);
      setTallaSeleccionada(null);
      setColorSeleccionado(null);
      setCantidad(1);
    }, 1000);
  };

  const toggleAccordion = (s) => setOpenAccordion(openAccordion === s ? null : s);
  const incrementar = () => setCantidad(c => c + 1);
  const decrementar = () => setCantidad(c => Math.max(1, c - 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 animate-pulse">Cargando pieza...</span>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-900">Pieza no encontrada</span>
        <Link to="/" className="text-[10px] tracking-[0.2em] uppercase border-b border-stone-900 pb-1">Volver al inicio</Link>
      </div>
    );
  }

  const imagenes = [producto.imagen1, producto.imagen2].filter(Boolean);
  const detallesArray = producto.detalles
    ? producto.detalles.split(',')
    : ['Diseño exclusivo PAVOA', 'Material de alta compresión'];
  const cuidadosTexto = producto.cuidados || null;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={producto.nombre}
        description={producto.descripcion || `Compra ${producto.nombre} en PAVOA. Alta calidad deportiva con envío a toda Colombia.`}
        url={`/producto/${id}`}
      />

      {/* ✅ pt mayor para separar del header */}
      <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto pt-[100px] md:pt-[120px]">

        {/* ── GALERÍA ── */}
        <div className="w-full lg:w-3/5 flex flex-row gap-3 lg:p-4">

          {/* ✅ Thumbnails verticales a la izquierda — solo desktop */}
          {imagenes.length > 1 && (
            <div className="hidden lg:flex flex-col gap-3 w-[72px] flex-shrink-0">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleImageChange(img)}
                  className={`w-full overflow-hidden border transition-all duration-300 ${
                    imagenActiva === img
                      ? 'border-stone-900 opacity-100'
                      : 'border-transparent opacity-40 hover:opacity-80'
                  }`}
                  style={{ aspectRatio: '3/4' }}
                >
                  <img
                    src={thumbImage(img)}
                    alt={`${producto.nombre} vista ${i + 1}`}
                    width={72} height={96}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* ✅ Imagen principal con fade */}
          <div className="flex-1 bg-stone-100 overflow-hidden relative" style={{ maxHeight: '85vh' }}>
            <img
              key={fadeKey}
              src={productImage(imagenActiva)}
              alt={producto.nombre}
              width={900} height={1200}
              className="w-full h-full object-contain"
              style={{ animation: 'fadeIn 0.4s ease', maxHeight: '85vh' }}
            />
            <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
          </div>

          {/* ✅ Thumbnails horizontales móvil — solo mobile */}
          {imagenes.length > 1 && (
            <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 mt-3 w-full px-1">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleImageChange(img)}
                  className={`w-24 h-32 flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                    imagenActiva === img
                      ? 'border-stone-900 opacity-100'
                      : 'border-transparent opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={thumbImage(img)} alt={`${producto.nombre} vista ${i + 1}`}
                    width={96} height={128} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── INFO ── */}
        <div className="w-full lg:w-2/5 px-6 py-12 lg:px-16 lg:py-16 relative">
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
            <div className="text-[12px] md:text-[13px] text-stone-600 tracking-[0.1em] leading-loose mb-12 uppercase flex flex-col gap-3">
              {producto.descripcion?.split('.').filter(s => s.trim()).map((oracion, i) => (
                <p key={i}>{oracion.trim()}.</p>
              ))}
            </div>

            {/* ── CANTIDAD ── */}
            <div className="mb-8">
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-4">Cantidad</span>
              <div className="inline-flex items-center border border-stone-200">
                <button onClick={decrementar} disabled={cantidad <= 1} aria-label="Disminuir cantidad"
                  className="w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <Minus size={13} strokeWidth={2} />
                </button>
                <span className="w-12 h-11 flex items-center justify-center text-[13px] font-medium text-stone-900 border-x border-stone-200 select-none" aria-live="polite">
                  {cantidad}
                </span>
                <button onClick={incrementar} aria-label="Aumentar cantidad"
                  className="w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors">
                  <Plus size={13} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* ── SELECTOR DE COLOR ── */}
            {tieneVariantes && (
              <div id="color-selector" className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Color</span>
                  {colorSeleccionado && (
                    <span className="text-[9px] tracking-[0.15em] text-stone-500 uppercase">{colorSeleccionado}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {coloresUnicos.map(v => {
                    const activo = colorSeleccionado === v.color;
                    return (
                      <button key={v.color} onClick={() => handleColorSelect(v.color)} title={v.color}
                        className="flex flex-col items-center gap-1.5 group"
                        aria-label={`Color ${v.color}${activo ? ', seleccionado' : ''}`}>
                        <div className={`w-7 h-7 rounded-full border transition-all duration-200 group-hover:scale-110
                          ${activo ? 'ring-2 ring-offset-2 ring-stone-900 border-stone-300 scale-110' : 'border-stone-200 shadow-sm'}`}
                          style={{ backgroundColor: v.hex }} />
                        <span className={`text-[8px] tracking-[0.1em] uppercase transition-colors ${activo ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
                          {v.color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SELECTOR DE TALLAS ── */}
            {colorSeleccionado && (
              <div id="talla-selector" className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Talla</span>
                  {!esTallaUnica && (
                    <button className="text-[9px] font-bold tracking-[0.15em] text-stone-400 hover:text-stone-900 uppercase underline transition-colors">
                      Guía de tallas
                    </button>
                  )}
                </div>
                {esTallaUnica ? (
                  <div className="flex flex-col gap-3">
                    <div className="h-12 border border-stone-200 bg-stone-50 flex items-center justify-center cursor-default select-none">
                      <span className="text-[11px] font-medium text-stone-400 tracking-[0.15em] uppercase">Talla Única</span>
                    </div>
                    <p className="text-[9px] tracking-[0.15em] text-stone-400 uppercase text-center">
                      Este producto tiene una sola talla · aplica para todas
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(tallasDisponibles.length, 4)}, minmax(0, 1fr))` }}>
                    {tallasDisponibles.map(talla => (
                      <button key={talla} onClick={() => setTallaSeleccionada(talla)}
                        className={`h-12 border flex items-center justify-center text-[11px] font-medium tracking-[0.05em] transition-colors uppercase
                          ${tallaSeleccionada === talla ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}>
                        {talla}
                      </button>
                    ))}
                  </div>
                )}
                {stockActual !== null && stockActual <= 3 && stockActual > 0 && (
                  <p className="text-[9px] tracking-[0.15em] text-amber-700 uppercase mt-3">
                    Solo {stockActual} {stockActual === 1 ? 'unidad disponible' : 'unidades disponibles'}
                  </p>
                )}
              </div>
            )}

            {/* ── BOTÓN AÑADIR ── */}
            <button onClick={handleAddToCart}
              className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
                ${adding ? 'bg-stone-800 text-white scale-[0.98]' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
              {adding ? 'Agregado ✔' : 'Añadir a la bolsa'}
            </button>

            <div className="w-full h-[1px] bg-stone-200 my-12" />

            {/* ── ACORDEONES ── */}
            <div className="flex flex-col">
              <div className="border-b border-stone-200">
                <button onClick={() => toggleAccordion('detalles')} className="w-full py-6 flex items-center justify-between text-left">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Detalles del diseño</span>
                  {openAccordion === 'detalles' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'detalles' ? 'max-h-[600px] pb-6' : 'max-h-0'}`}>
                  <ul className="list-disc pl-4 flex flex-col gap-2">
                    {detallesArray.map((d, i) => (
                      <li key={i} className="text-[11px] text-stone-600 tracking-[0.1em] uppercase">{d.trim()}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="border-b border-stone-200">
                <button onClick={() => toggleAccordion('cuidados')} className="w-full py-6 flex items-center justify-between text-left">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Composición y Cuidados</span>
                  {openAccordion === 'cuidados' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'cuidados' ? 'max-h-[600px] pb-6' : 'max-h-0'}`}>
                  {cuidadosTexto
                    ? <p className="text-[11px] text-stone-600 tracking-[0.1em] leading-relaxed uppercase">{cuidadosTexto}</p>
                    : <p className="text-[11px] text-stone-400 tracking-[0.1em] uppercase">Sin indicaciones especiales.</p>
                  }
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