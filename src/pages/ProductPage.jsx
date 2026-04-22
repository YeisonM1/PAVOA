import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Minus, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { CartContext } from '../App';
import CrossSelling from '../sections/CrossSelling';
import { getProductoById } from '../services/productService';
import SEO from '../components/SEO';
import { productImage, heroImage, thumbImage } from '../utils/imageUrl';
import { trackViewItem } from '../lib/analytics';
import GuiaTallasModal from '../components/GuiaTallasModal';
import { saveRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useWishlist } from '../context/WishlistContext';
import { estaAutenticado, getCliente } from '../services/authService';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);

  const [producto, setProducto]               = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [cantidad, setCantidad]               = useState(1);
  const [adding, setAdding]                   = useState(false);
  const [openAccordion, setOpenAccordion]     = useState('detalles');
  const [selectedImage, setSelectedImage]     = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen]   = useState(false);
  const [lbFading, setLbFading]               = useState(false);
  const [showCantidadHint, setShowCantidadHint] = useState(false);
  const [showGuiaTallas, setShowGuiaTallas]   = useState(false);
  const touchStartX                           = useRef(null);
  const addBtnRef                             = useRef(null);
  const [showStickyBar, setShowStickyBar]     = useState(false);
  const [alertEmail, setAlertEmail]           = useState('');
  const [alertSent, setAlertSent]             = useState(false);
  const [alertLoading, setAlertLoading]       = useState(false);
  const { isWished, toggle }                  = useWishlist();

  useEffect(() => {
    let cancelled = false;
    const cargarProducto = async () => {
      setLoading(true);
      try {
        const data = await getProductoById(id);
        if (!cancelled) {
          setProducto(data);
          setLoading(false);
          if (data) { trackViewItem(data); saveRecentlyViewed(data); }
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    cargarProducto();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [id]);

  const imagenes = useMemo(() => {
    if (!producto) return [];
    return [
      producto.imagen1, producto.imagen2, producto.imagen3,
      producto.imagen4, producto.imagen5,
    ].filter(Boolean);
  }, [producto]);

  useEffect(() => {
    if (!producto || imagenes.length <= 1) return;
    imagenes.forEach((img, i) => {
      if (i === 0) return;
      const image = new Image();
      image.src = heroImage(img);
    });
  }, [imagenes]);

  useEffect(() => {
    setSelectedImage(0);
    setIsLightboxOpen(false);
  }, [id]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const total = imagenes.length;
    const onKey = (e) => {
      if (e.key === 'Escape')     setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setSelectedImage(i => (i + 1) % total);
      if (e.key === 'ArrowLeft')  setSelectedImage(i => (i - 1 + total) % total);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen, imagenes]);

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
    return variantes
      .filter(v => v.color === colorSeleccionado)
      .map(v => ({ talla: v.talla, stock: v.stock ?? 0 }));
  }, [variantes, colorSeleccionado]);

  const stockActual = useMemo(() => {
    if (!colorSeleccionado || !tallaSeleccionada) return null;
    const v = variantes.find(v => v.color === colorSeleccionado && v.talla === tallaSeleccionada);
    return v?.stock ?? 0;
  }, [variantes, colorSeleccionado, tallaSeleccionada]);

  const esTallaUnica   = tallasDisponibles.length === 1 && tallasDisponibles[0]?.talla === 'ÚNICA';
  const tieneVariantes = variantes.length > 0;

  useEffect(() => {
    if (esTallaUnica && colorSeleccionado) {
      setTallaSeleccionada('ÚNICA');
    }
  }, [esTallaUnica, colorSeleccionado]);

  const puedeSeleccionarCantidad = tieneVariantes
    ? (colorSeleccionado && (esTallaUnica || tallaSeleccionada))
    : true;

  const handleCantidadBloqueada = () => {
    setShowCantidadHint(true);
    setTimeout(() => setShowCantidadHint(false), 2500);
  };

  const handleColorSelect = (color) => {
    setColorSeleccionado(colorSeleccionado === color ? null : color);
    setTallaSeleccionada(null);
    setCantidad(1);
    setAlertSent(false);
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
    const tallaFinal    = esTallaUnica ? 'ÚNICA' : tallaSeleccionada;
    const varianteElegida = variantes.find(v => v.color === colorSeleccionado && v.talla === tallaFinal);
    addToCart({ ...producto, colorSeleccionado, selectedVariantId: varianteElegida?.variantId || null }, tallaFinal, cantidad);
    setTimeout(() => {
      setAdding(false);
      setTallaSeleccionada(null);
      setColorSeleccionado(null);
      setCantidad(1);
    }, 1000);
  };

  const handleSelectImage = (i) => {
    if (i === selectedImage) return;
    setIsTransitioning(true);
    setTimeout(() => { setSelectedImage(i); setIsTransitioning(false); }, 300);
  };

  const lbNav = (dir) => {
    setLbFading(true);
    setTimeout(() => {
      setSelectedImage(i => (i + dir + imagenes.length) % imagenes.length);
      setLbFading(false);
    }, 180);
  };

  const lbGoTo = (i) => {
    if (i === selectedImage) return;
    setLbFading(true);
    setTimeout(() => { setSelectedImage(i); setLbFading(false); }, 180);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 80) lbNav(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  useEffect(() => {
    if (estaAutenticado()) {
      const cliente = getCliente();
      if (cliente?.email) setAlertEmail(cliente.email);
    }
  }, []);

  useEffect(() => {
    const btn = addBtnRef.current;
    if (!btn) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(btn);
    return () => observer.disconnect();
  }, [producto]);

  const handleStockAlert = async () => {
    if (!alertEmail) return;
    setAlertLoading(true);
    try {
      await fetch('/api/stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:         alertEmail,
          productId:     producto.id,
          productNombre: producto.nombre,
          talla:         tallaSeleccionada,
          color:         colorSeleccionado,
        }),
      });
      setAlertSent(true);
    } catch {} finally { setAlertLoading(false); }
  };

  const toggleAccordion = (s) => setOpenAccordion(openAccordion === s ? null : s);
  const incrementar = () => {
    if (!puedeSeleccionarCantidad) { handleCantidadBloqueada(); return; }
    setCantidad(c => stockActual !== null ? Math.min(c + 1, stockActual) : c + 1);
  };
  const decrementar = () => {
    if (!puedeSeleccionarCantidad) return;
    setCantidad(c => Math.max(1, c - 1));
  };

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

  const detallesArray = producto.detalles
    ? producto.detalles.split(';')
    : ['Diseño exclusivo PAVOA', 'Material de alta compresión'];
  const cuidadosTexto = producto.cuidados || null;

  const mainImgStyle = {
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    opacity:   isTransitioning ? 0 : 1,
    transform: isTransitioning ? 'scale(1.03)' : 'scale(1)',
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion,
    image: producto.imagen1,
    url: `https://pavoa.vercel.app/producto/${id}`,
    brand: { '@type': 'Brand', name: 'PAVOA' },
    offers: {
      '@type': 'Offer',
      url: `https://pavoa.vercel.app/producto/${id}`,
      priceCurrency: 'COP',
      price: producto.precioNumerico,
      availability: variantes.some(v => (v.stock ?? 0) > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'PAVOA' },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://pavoa.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://pavoa.vercel.app/categoria' },
      ...(producto.categoria
        ? [{ '@type': 'ListItem', position: 3, name: producto.categoria, item: `https://pavoa.vercel.app/categoria/${producto.categoria.toLowerCase()}` }]
        : []),
      { '@type': 'ListItem', position: producto.categoria ? 4 : 3, name: producto.nombre, item: `https://pavoa.vercel.app/producto/${id}` },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={producto.nombre}
        description={producto.descripcion || `Compra ${producto.nombre} en PAVOA. Alta calidad deportiva con envío a toda Colombia.`}
        url={`/producto/${id}`}
        image={producto.imagen1}
        type="product"
        jsonLd={[productJsonLd, breadcrumbJsonLd]}
      />

      {/* ── STICKY ADD-TO-CART BAR ── */}
      {showStickyBar && (
        <div className="fixed top-[64px] md:top-[80px] left-0 right-0 z-40 bg-white border-b border-stone-200 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-[52px] bg-stone-100 overflow-hidden flex-shrink-0">
              <img src={thumbImage(producto.imagen1)} alt={producto.nombre} width={40} height={52} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.15em] text-stone-900 uppercase truncate">{producto.nombre}</p>
              <p className="text-[11px] text-stone-500">{producto.precio}</p>
            </div>
            {tallaSeleccionada && (
              <p className="text-[10px] tracking-[0.1em] text-stone-500 uppercase hidden sm:block">Talla: {tallaSeleccionada}</p>
            )}
            <button
              onClick={handleAddToCart}
              disabled={stockActual === 0 || stockActual === null}
              className={`flex-shrink-0 h-10 px-6 text-[9px] font-bold tracking-[0.2em] uppercase transition-colors
                ${stockActual === 0 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' :
                  stockActual === null ? 'bg-stone-300 text-stone-500 cursor-not-allowed' :
                  adding ? 'bg-stone-800 text-white' :
                  'bg-stone-900 text-white hover:bg-stone-800'}`}
            >
              {stockActual === 0 ? 'Agotado' : stockActual === null ? 'Selecciona opciones' : adding ? '✔' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row max-w-[1600px] mx-auto pt-[115px] md:pt-[120px]">

        {/* ── GALERÍA MOBILE ── */}
        <div className="md:hidden w-full flex flex-col px-5 pt-6">
          <div
            className="w-full relative group cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
          >
            <div className="w-full overflow-hidden rounded-sm bg-stone-50" style={{ aspectRatio: '3/4' }}>
              <img
                src={heroImage(imagenes[selectedImage])}
                alt={`${producto.nombre} vista ${selectedImage + 1}`}
                width={900} height={1200}
                className="w-full h-full object-contain block"
                loading="eager"
                style={mainImgStyle}
              />
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 px-2 py-1 pointer-events-none">
              <Maximize2 size={9} className="text-white/70" />
              <span className="text-[7.5px] tracking-[0.18em] text-white/70 font-medium">AMPLIAR</span>
            </div>
          </div>

          {imagenes.length > 1 && (
            <div className="flex gap-3 pt-4 pb-2">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectImage(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`flex-shrink-0 w-[72px] h-[90px] overflow-hidden rounded-sm transition-all duration-200 ${
                    selectedImage === i ? 'ring-1 ring-stone-900 ring-offset-2' : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <img
                    src={productImage(img)}
                    alt={`${producto.nombre} miniatura ${i + 1}`}
                    width={144} height={180}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── GALERÍA DESKTOP ── */}
        <div
          className="hidden md:flex md:w-3/5 gap-3 self-start"
          style={{ position: 'sticky', top: '120px', padding: '40px 20px 60px 40px' }}
        >
          {imagenes.length > 1 && (
            <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 88 }}>
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectImage(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  style={{ aspectRatio: '3/4', width: 88 }}
                  className={`overflow-hidden rounded-sm flex-shrink-0 transition-all duration-200 ${
                    selectedImage === i ? 'ring-1 ring-stone-900 ring-offset-1 opacity-100' : 'opacity-35 hover:opacity-70'
                  }`}
                >
                  <img
                    src={thumbImage(img)}
                    alt={`${producto.nombre} miniatura ${i + 1}`}
                    width={264} height={352}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          <div
            className="relative flex-1 overflow-hidden rounded-sm group cursor-zoom-in bg-stone-50"
            style={{ maxHeight: '78vh' }}
            onClick={() => setIsLightboxOpen(true)}
          >
            <img
              src={heroImage(imagenes[selectedImage])}
              alt={`${producto.nombre} vista ${selectedImage + 1}`}
              width={900} height={1200}
              className="w-full h-full object-contain block"
              loading="eager"
              style={mainImgStyle}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <Maximize2 size={10} className="text-white/75" />
              <span className="text-[8px] tracking-[0.2em] text-white/75 font-medium">AMPLIAR</span>
            </div>
          </div>
        </div>

        {/* ── INFO ── */}
        <div className="w-full md:w-2/5 px-6 py-8 md:px-10 md:py-6 xl:px-16 xl:py-16 relative">
          <div className="md:sticky md:top-[120px] xl:top-[160px]">

            <nav aria-label="Ruta de navegación" className="mb-5 md:mb-8">
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

            <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-3 md:mb-4">
              {producto.nombre}
            </h1>
            <div className="flex items-center justify-between mb-6 md:mb-10">
              <p className="text-sm md:text-base font-medium text-stone-600 tracking-[0.1em]">
                {producto.precio}
              </p>
              <button
                onClick={() => toggle(producto.id)}
                className="text-stone-300 hover:text-stone-900 transition-colors"
                aria-label={isWished(producto.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isWished(producto.id) ? '#0B0B0B' : 'none'} stroke={isWished(producto.id) ? '#0B0B0B' : 'currentColor'} strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
            <div className="text-[12px] md:text-[13px] text-stone-600 tracking-[0.1em] leading-loose mb-6 md:mb-12 uppercase flex flex-col gap-3">
              {producto.descripcion?.split('.').filter(s => s.trim()).map((oracion, i) => (
                <p key={i}>{oracion.trim()}.</p>
              ))}
            </div>

            {/* ── CANTIDAD ── */}
            <div className="mb-5 md:mb-8">
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-4">Cantidad</span>
              <div className="relative inline-block">
                <div
                  className={`inline-flex items-center border transition-colors duration-300 ${
                    !puedeSeleccionarCantidad ? 'border-stone-100' : 'border-stone-200'
                  }`}
                  onClick={!puedeSeleccionarCantidad ? handleCantidadBloqueada : undefined}
                >
                  <button
                    onClick={puedeSeleccionarCantidad ? decrementar : undefined}
                    disabled={!puedeSeleccionarCantidad || cantidad <= 1}
                    aria-label="Disminuir cantidad"
                    className={`w-11 h-11 flex items-center justify-center transition-colors
                      ${!puedeSeleccionarCantidad
                        ? 'text-stone-200 cursor-not-allowed'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                  >
                    <Minus size={13} strokeWidth={2} />
                  </button>
                  <span
                    className={`w-12 h-11 flex items-center justify-center text-[13px] font-medium border-x select-none transition-colors ${
                      !puedeSeleccionarCantidad ? 'text-stone-200 border-stone-100' : 'text-stone-900 border-stone-200'
                    }`}
                    aria-live="polite"
                  >
                    {cantidad}
                  </span>
                  <button
                    onClick={puedeSeleccionarCantidad ? incrementar : handleCantidadBloqueada}
                    aria-label="Aumentar cantidad"
                    className={`w-11 h-11 flex items-center justify-center transition-colors
                      ${!puedeSeleccionarCantidad
                        ? 'text-stone-200 cursor-not-allowed'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                  >
                    <Plus size={13} strokeWidth={2} />
                  </button>
                </div>

                {/* Tooltip premium */}
                <div className={`absolute left-0 -bottom-8 transition-all duration-300 ease-out pointer-events-none ${
                  showCantidadHint ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                }`}>
                  <p style={{ letterSpacing: '0.15em' }} className="text-[9px] text-stone-400 uppercase whitespace-nowrap">
                    ✦ Selecciona primero color y talla
                  </p>
                </div>
              </div>
            </div>

            {/* ── COLORES ── */}
            {tieneVariantes && (
              <div id="color-selector" className="mb-5 md:mb-8">
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

            {/* ── TALLAS ── */}
            {colorSeleccionado && (
              <div id="talla-selector" className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Talla</span>
                  {!esTallaUnica && (
                    <button
                      onClick={() => setShowGuiaTallas(true)}
                      className="text-[9px] font-bold tracking-[0.15em] text-stone-400 hover:text-stone-900 uppercase underline transition-colors"
                    >
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
                      Tecnología de adaptación multidireccional · Se adapta a tu cuerpo desde la talla xs hasta la L
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(tallasDisponibles.length, 4)}, minmax(0, 1fr))` }}>
                    {tallasDisponibles.map(({ talla, stock }) => {
                      const agotado = stock === 0;
                      const activo = tallaSeleccionada === talla;
                      return (
                        <button
                          key={talla}
                          onClick={() => { if (!agotado) { setTallaSeleccionada(talla); setAlertSent(false); } }}
                          disabled={agotado}
                          className={`h-12 border flex items-center justify-center text-[11px] font-medium tracking-[0.05em] transition-colors uppercase relative
                            ${agotado ? 'border-stone-100 text-stone-300 cursor-not-allowed' :
                              activo ? 'border-stone-900 bg-stone-900 text-white' :
                              'border-stone-200 text-stone-600 hover:border-stone-900'}`}
                        >
                          {talla}
                        </button>
                      );
                    })}
                  </div>
                )}
                {stockActual !== null && stockActual <= 3 && stockActual > 0 && (
                  <p className="text-[9px] tracking-[0.15em] text-amber-700 uppercase mt-3">
                    Solo {stockActual} {stockActual === 1 ? 'unidad disponible' : 'unidades disponibles'}
                  </p>
                )}
              </div>
            )}

            {/* ── BOTÓN AGREGAR ── */}
            <button
              ref={addBtnRef}
              onClick={handleAddToCart}
              disabled={stockActual === 0 || stockActual === null}
              className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
                ${stockActual === 0 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' :
                  stockActual === null ? 'bg-stone-300 text-stone-500 cursor-not-allowed' :
                  adding ? 'bg-stone-800 text-white scale-[0.98]' :
                  'bg-stone-900 text-white hover:bg-stone-800'}`}
            >
              {stockActual === 0 ? 'Agotado' : stockActual === null ? 'Selecciona color y talla' : adding ? 'Agregado ✔' : 'Añadir a la bolsa'}
            </button>

            {/* ── AVISO STOCK AGOTADO ── */}
            {stockActual === 0 && tallaSeleccionada && (
              alertSent ? (
                <p className="text-[9px] tracking-[0.15em] text-stone-500 uppercase mt-4">✓ Te avisaremos cuando esté disponible.</p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  <p className="text-[9px] tracking-[0.15em] text-stone-400 uppercase">Esta talla está agotada. Avísame cuando vuelva:</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={alertEmail}
                      onChange={e => setAlertEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="flex-1 border-b border-stone-200 focus:border-stone-900 outline-none py-2.5 text-[12px] text-stone-900 placeholder-stone-300 bg-transparent transition-colors"
                    />
                    <button
                      onClick={handleStockAlert}
                      disabled={alertLoading || !alertEmail}
                      className="text-[9px] font-bold tracking-[0.15em] uppercase text-white bg-stone-900 px-4 py-2 hover:bg-stone-700 transition-colors disabled:opacity-40"
                    >
                      {alertLoading ? '...' : 'Avísame'}
                    </button>
                  </div>
                </div>
              )
            )}

            <div className="w-full h-[1px] bg-stone-200 my-12" />

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
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Cuidados de la Prenda</span>
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

      {/* ── LIGHTBOX ── */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ background: 'rgba(8, 6, 6, 0.96)' }}
          role="dialog" aria-modal="true" aria-label="Visor de imágenes"
        >
          <div className="flex items-center justify-between px-6 py-5 flex-shrink-0">
            <span className="text-[9px] tracking-[0.3em] text-white/30 font-medium select-none">
              {selectedImage + 1} / {imagenes.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="text-white/50 hover:text-white transition-colors p-2 -mr-2"
              aria-label="Cerrar visor"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center px-12 md:px-20 relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {imagenes.length > 1 && (
              <button onClick={() => lbNav(-1)} className="absolute left-3 md:left-5 text-white/30 hover:text-white/80 transition-colors p-2" aria-label="Imagen anterior">
                <ChevronLeft size={26} strokeWidth={1.2} />
              </button>
            )}
            <img
              key={selectedImage}
              src={heroImage(imagenes[selectedImage])}
              alt={`${producto.nombre} vista ${selectedImage + 1}`}
              className="max-h-[80vh] max-w-full object-contain select-none"
              style={{ transition: 'opacity 0.2s ease', opacity: lbFading ? 0 : 1 }}
              draggable={false}
            />
            {imagenes.length > 1 && (
              <button onClick={() => lbNav(1)} className="absolute right-3 md:right-5 text-white/30 hover:text-white/80 transition-colors p-2" aria-label="Siguiente imagen">
                <ChevronRight size={26} strokeWidth={1.2} />
              </button>
            )}
          </div>

          {imagenes.length > 1 && (
            <div className="flex justify-center gap-2.5 px-6 py-5 flex-shrink-0">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => lbGoTo(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`w-12 h-[60px] overflow-hidden rounded-sm flex-shrink-0 transition-all duration-200 ${
                    selectedImage === i ? 'ring-1 ring-white/70 ring-offset-1 ring-offset-transparent opacity-100' : 'opacity-25 hover:opacity-55'
                  }`}
                >
                  <img src={thumbImage(img)} alt="" aria-hidden="true" className="w-full h-full object-cover object-top" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showGuiaTallas && <GuiaTallasModal onClose={() => setShowGuiaTallas(false)} />}
    </div>
  );
}