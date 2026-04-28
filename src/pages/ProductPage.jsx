import { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CartContext } from '../App';
import CrossSelling from '../sections/CrossSelling';
import { getProductoById } from '../services/productService';
import SEO from '../components/SEO';
import { heroImage } from '../utils/imageUrl';
import { trackViewItem } from '../lib/analytics';
import GuiaTallasModal from '../components/GuiaTallasModal';
import { saveRecentlyViewed } from '../hooks/useRecentlyViewed';
import { estaAutenticado, getCliente } from '../services/authService';
import ProductGallery from '../components/product/ProductGallery';
import ProductLightbox from '../components/product/ProductLightbox';
import ProductInfo from '../components/product/ProductInfo';
import ProductVariantSelector from '../components/product/ProductVariantSelector';
import ProductAccordion from '../components/product/ProductAccordion';
import StickyAddBar from '../components/product/StickyAddBar';

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
  const [showCantidadHint, setShowCantidadHint] = useState(false);
  const [showGuiaTallas, setShowGuiaTallas]   = useState(false);
  const addBtnRef                             = useRef(null);
  const [showStickyBar, setShowStickyBar]     = useState(false);
  const [alertEmail, setAlertEmail]           = useState('');
  const [alertSent, setAlertSent]             = useState(false);
  const [alertLoading, setAlertLoading]       = useState(false);

  // ── Data loading ──
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

  // ── Derived data ──
  const imagenes = useMemo(() => {
    if (!producto) return [];
    return [producto.imagen1, producto.imagen2, producto.imagen3, producto.imagen4, producto.imagen5].filter(Boolean);
  }, [producto]);

  const variantes = useMemo(() => {
    if (!producto?.variantes) return [];
    try {
      const parsed = typeof producto.variantes === 'string' ? JSON.parse(producto.variantes) : producto.variantes;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [producto?.variantes]);

  const coloresUnicos = useMemo(() => {
    const vistos = new Set();
    return variantes.filter(v => { if (vistos.has(v.color)) return false; vistos.add(v.color); return true; });
  }, [variantes]);

  const tallasDisponibles = useMemo(() => {
    if (!colorSeleccionado) return [];
    return variantes.filter(v => v.color === colorSeleccionado).map(v => ({ talla: v.talla, stock: v.stock ?? 0 }));
  }, [variantes, colorSeleccionado]);

  const stockActual = useMemo(() => {
    if (!colorSeleccionado || !tallaSeleccionada) return null;
    const v = variantes.find(v => v.color === colorSeleccionado && v.talla === tallaSeleccionada);
    return v?.stock ?? 0;
  }, [variantes, colorSeleccionado, tallaSeleccionada]);

  const esTallaUnica   = tallasDisponibles.length === 1 && tallasDisponibles[0]?.talla === 'ÚNICA';
  const tieneVariantes = variantes.length > 0;
  const puedeSeleccionarCantidad = tieneVariantes ? (colorSeleccionado && (esTallaUnica || tallaSeleccionada)) : true;

  // ── Effects ──
  useEffect(() => { if (esTallaUnica && colorSeleccionado) setTallaSeleccionada('ÚNICA'); }, [esTallaUnica, colorSeleccionado]);
  useEffect(() => { setSelectedImage(0); setIsLightboxOpen(false); }, [id]);

  useEffect(() => {
    if (!producto || imagenes.length <= 1) return;
    const nextImage = imagenes[selectedImage + 1];
    if (!nextImage) return;
    const image = new Image();
    image.src = heroImage(nextImage);
  }, [imagenes, producto, selectedImage]);

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
  }, []);

  const crossSellingRef = useRef(null);
  const [showCrossSelling, setShowCrossSelling] = useState(false);

  useEffect(() => {
    const section = crossSellingRef.current;
    if (!section || showCrossSelling) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) return; setShowCrossSelling(true); observer.disconnect(); },
      { rootMargin: '300px 0px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [showCrossSelling]);

  // ── Handlers ──
  const handleCantidadBloqueada = () => { setShowCantidadHint(true); setTimeout(() => setShowCantidadHint(false), 2500); };
  const handleColorSelect = (color) => { setColorSeleccionado(colorSeleccionado === color ? null : color); setTallaSeleccionada(null); setCantidad(1); setAlertSent(false); };
  const incrementar = () => { if (!puedeSeleccionarCantidad) { handleCantidadBloqueada(); return; } setCantidad(c => stockActual !== null ? Math.min(c + 1, stockActual) : c + 1); };
  const decrementar = () => { if (!puedeSeleccionarCantidad) return; setCantidad(c => Math.max(1, c - 1)); };
  const toggleAccordion = (s) => setOpenAccordion(openAccordion === s ? null : s);

  const handleSelectImage = (i) => {
    if (i === selectedImage) return;
    setIsTransitioning(true);
    setTimeout(() => { setSelectedImage(i); setIsTransitioning(false); }, 300);
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
    const varianteElegida = variantes.find(v => v.color === colorSeleccionado && v.talla === tallaFinal);
    addToCart({ ...producto, colorSeleccionado, selectedVariantId: varianteElegida?.variantId || null }, tallaFinal, cantidad);
    setTimeout(() => { setAdding(false); setTallaSeleccionada(null); setColorSeleccionado(null); setCantidad(1); }, 1000);
  };

  const handleStockAlert = async () => {
    if (!alertEmail) return;
    setAlertLoading(true);
    try {
      await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stock-alert', email: alertEmail, productId: producto.id, productNombre: producto.nombre, talla: tallaSeleccionada, color: colorSeleccionado }),
      });
      setAlertSent(true);
    } catch {} finally { setAlertLoading(false); }
  };

  // ── Loading / Not found ──
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

  const detallesArray = producto.detalles ? producto.detalles.split(';') : ['Diseño exclusivo PAVOA', 'Material de alta compresión'];
  const cuidadosTexto = producto.cuidados || null;

  const productJsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: producto.nombre, description: producto.descripcion, image: producto.imagen1,
    url: `https://pavoa.vercel.app/producto/${id}`,
    brand: { '@type': 'Brand', name: 'PAVOA' },
    offers: {
      '@type': 'Offer', url: `https://pavoa.vercel.app/producto/${id}`, priceCurrency: 'COP',
      price: producto.precioNumerico,
      availability: variantes.some(v => (v.stock ?? 0) > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'PAVOA' },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://pavoa.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://pavoa.vercel.app/categoria' },
      ...(producto.categoria ? [{ '@type': 'ListItem', position: 3, name: producto.categoria, item: `https://pavoa.vercel.app/categoria/${producto.categoria.toLowerCase()}` }] : []),
      { '@type': 'ListItem', position: producto.categoria ? 4 : 3, name: producto.nombre, item: `https://pavoa.vercel.app/producto/${id}` },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO title={producto.nombre} description={producto.descripcion || `Compra ${producto.nombre} en PAVOA. Alta calidad deportiva con envío a toda Colombia.`} url={`/producto/${id}`} image={producto.imagen1} type="product" jsonLd={[productJsonLd, breadcrumbJsonLd]} />

      {showStickyBar && <StickyAddBar producto={producto} tallaSeleccionada={tallaSeleccionada} stockActual={stockActual} adding={adding} onAddToCart={handleAddToCart} />}

      <div className="flex flex-col md:flex-row max-w-[1600px] mx-auto pt-[115px] md:pt-[120px]">
        <ProductGallery imagenes={imagenes} selectedImage={selectedImage} onSelectImage={handleSelectImage} onOpenLightbox={() => setIsLightboxOpen(true)} producto={producto} isTransitioning={isTransitioning} />

        <div className="w-full md:w-2/5 px-6 py-8 md:px-10 md:py-6 xl:px-16 xl:py-16 relative">
          <div className="md:sticky md:top-[120px] xl:top-[160px]">
            <ProductInfo producto={producto} id={id} />

            <ProductVariantSelector
              variantes={variantes} coloresUnicos={coloresUnicos} tallasDisponibles={tallasDisponibles}
              esTallaUnica={esTallaUnica} tieneVariantes={tieneVariantes}
              colorSeleccionado={colorSeleccionado} tallaSeleccionada={tallaSeleccionada}
              cantidad={cantidad} stockActual={stockActual}
              puedeSeleccionarCantidad={puedeSeleccionarCantidad} showCantidadHint={showCantidadHint} adding={adding}
              onColorSelect={handleColorSelect} onTallaSelect={(t) => { setTallaSeleccionada(t); setAlertSent(false); }}
              onIncrementar={incrementar} onDecrementar={decrementar} onCantidadBloqueada={handleCantidadBloqueada}
              onAddToCart={handleAddToCart} onShowGuiaTallas={() => setShowGuiaTallas(true)} addBtnRef={addBtnRef}
              alertEmail={alertEmail} alertSent={alertSent} alertLoading={alertLoading}
              onAlertEmailChange={setAlertEmail} onStockAlert={handleStockAlert}
            />

            <div className="w-full h-[1px] bg-stone-200 my-12" />
            <ProductAccordion detallesArray={detallesArray} cuidadosTexto={cuidadosTexto} openAccordion={openAccordion} onToggle={toggleAccordion} />
          </div>
        </div>
      </div>

      <div ref={crossSellingRef}>
        {showCrossSelling && <CrossSelling currentProductId={producto.id} />}
      </div>

      {isLightboxOpen && <ProductLightbox imagenes={imagenes} selectedImage={selectedImage} onClose={() => setIsLightboxOpen(false)} onSelectImage={setSelectedImage} producto={producto} />}
      {showGuiaTallas && <GuiaTallasModal onClose={() => setShowGuiaTallas(false)} />}
    </div>
  );
}
