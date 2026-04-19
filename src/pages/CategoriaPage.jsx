import React, { useState, useEffect, useMemo } from 'react';
import { parsePrice } from '../utils/price';
import { useParams, Link } from 'react-router-dom';
import FilterDrawer from '../sections/FilterDrawer';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import { getProductos, getCategoriaById } from '../services/productService';
import SEO from '../components/SEO';

const parseVariantes = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); }
  catch { return []; }
};

function SkeletonHero() {
  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] bg-stone-200 animate-pulse">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200" />
    </div>
  );
}

export default function CategoriaPage() {
  const { id } = useParams();

  const [productosDB, setProductosDB] = useState([]);
  const [dataHeader, setDataHeader]   = useState(null);
  const [loading, setLoading]         = useState(true);

  const [isSortOpen, setIsSortOpen]     = useState(false);
  const [sortOption, setSortOption]     = useState('Lo más nuevo');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sortOptions = ['Lo más nuevo', 'Precio: Menor a Mayor', 'Precio: Mayor a Menor'];

  const [tallasFiltro, setTallasFiltro]   = useState([]);
  const [coloresFiltro, setColoresFiltro] = useState([]);
  const [visibles, setVisibles]           = useState(12);

  useEffect(() => {
    let cancelled = false;
    const cargarTodo = async () => {
      setLoading(true);
      setTallasFiltro([]);
      setColoresFiltro([]);

      try {
        const todosLosProductos = await getProductos();
        if (cancelled) return;
        const filtrados = id && id !== 'default'
          ? todosLosProductos.filter(p => p.categoria?.toLowerCase() === id.toLowerCase())
          : todosLosProductos;
        setProductosDB(filtrados);

        const categoriaIdBusqueda = id?.toLowerCase().trim() || 'default';
        let infoCategoria = await getCategoriaById(categoriaIdBusqueda);
        if (cancelled) return;
        if (!infoCategoria) infoCategoria = await getCategoriaById('default');
        setDataHeader(infoCategoria || {
          titulo1: 'Cole', titulo2: 'cciones',
          desc: 'Descubre nuestra línea completa.',
          heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80'
        });
      } catch {
        if (!cancelled) setProductosDB([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    cargarTodo();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = isFilterOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isFilterOpen]);

  const tallasDisponibles = useMemo(() => {
    const orden = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ÚNICA'];
    const set = new Set();
    productosDB.forEach(p => {
      parseVariantes(p.variantes).forEach(v => {
        if (v.talla && v.talla !== 'ÚNICA') set.add(v.talla);
      });
    });
    return orden.filter(t => set.has(t));
  }, [productosDB]);

  const coloresDisponibles = useMemo(() => {
    const mapa = new Map();
    productosDB.forEach(p => {
      parseVariantes(p.variantes).forEach(v => {
        if (v.color && v.hex && !mapa.has(v.color)) mapa.set(v.color, v.hex.startsWith('#') ? v.hex : `#${v.hex}`);
      });
    });
    return Array.from(mapa, ([nombre, hex]) => ({ nombre, hex }));
  }, [productosDB]);

  const handleTallaChange  = (t) => setTallasFiltro(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const handleColorChange  = (c) => setColoresFiltro(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const handleLimpiar      = () => { setTallasFiltro([]); setColoresFiltro([]); };

  const productosFiltrados = useMemo(() => {
    let res = [...productosDB];
    if (tallasFiltro.length > 0)
      res = res.filter(p => tallasFiltro.every(t => parseVariantes(p.variantes).map(v => v.talla).includes(t)));
    if (coloresFiltro.length > 0)
      res = res.filter(p => coloresFiltro.every(c => parseVariantes(p.variantes).map(v => v.color).includes(c)));
    if (sortOption === 'Precio: Menor a Mayor') res.sort((a, b) => parsePrice(a.precio) - parsePrice(b.precio));
    if (sortOption === 'Precio: Mayor a Menor') res.sort((a, b) => parsePrice(b.precio) - parsePrice(a.precio));
    return res;
  }, [productosDB, tallasFiltro, coloresFiltro, sortOption]);

  const hayFiltrosActivos = tallasFiltro.length > 0 || coloresFiltro.length > 0;

  useEffect(() => { setVisibles(12); }, [productosFiltrados]);

  // ── SKELETON LOADING ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SkeletonHero />
        {/* Barra de filtros skeleton */}
        <div className="w-full border-b border-stone-200 h-16 md:h-20 flex items-center px-6 md:px-12 lg:px-16 gap-4">
          <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
          <div className="flex-1" />
          <div className="h-3 w-24 bg-stone-200 rounded animate-pulse" />
        </div>
        {/* Grid skeleton */}
        <section className="w-full py-12 px-6 md:px-12 lg:px-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        </section>
      </div>
    );
  }
  // ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white relative">
      <SEO
        title={`${dataHeader.titulo1}${dataHeader.titulo2}`}
        description={dataHeader.desc}
        url={id ? `/categoria/${id}` : '/categoria'}
        image={dataHeader.heroImage}
      />

      {/* ── HERO ── */}
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-end justify-center pb-16 md:pb-24 overflow-hidden">
        <img
          key={dataHeader.heroImage}
          src={dataHeader.heroImage}
          alt={dataHeader.titulo1 + dataHeader.titulo2}
          width={1600} height={900}
          className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-6">
          <nav className="mb-4">
            <span className="text-[10px] tracking-[0.2em] text-white/70 uppercase">
              <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
              <span className="mx-2">/</span> Colecciones
            </span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-light text-white tracking-[0.2em] uppercase mb-4">
            {dataHeader.titulo1}<strong className="font-bold">{dataHeader.titulo2}</strong>
          </h1>
          <p className="text-[11px] md:text-xs text-white/80 tracking-[0.15em] max-w-md mx-auto uppercase leading-relaxed">
            {dataHeader.desc}
          </p>
        </div>
      </section>

      {/* ── BARRA DE FILTROS ── */}
      <div className="sticky top-[72px] md:top-[88px] z-30 w-full bg-white/80 backdrop-blur-md border-b border-stone-200 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsFilterOpen(true)}
              className="text-xs font-medium text-stone-900 tracking-[0.15em] uppercase flex items-center gap-2 hover:opacity-70 transition-opacity">
              Filtros
              {hayFiltrosActivos && (
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[8px] flex items-center justify-center">
                  {tallasFiltro.length + coloresFiltro.length}
                </span>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>
              </svg>
            </button>
            <span className="hidden lg:block text-[11px] font-bold text-stone-900 tracking-[0.2em] uppercase">Catálogo</span>
          </div>

          <div className="hidden md:flex items-center gap-4 relative">
            <span className="text-xs text-stone-500 tracking-[0.15em] uppercase">Ordenar por:</span>
            <button onClick={() => setIsSortOpen(!isSortOpen)}
              className="text-xs font-medium text-stone-900 tracking-[0.15em] uppercase bg-transparent border-none outline-none cursor-pointer flex items-center gap-2 hover:opacity-70 transition-opacity">
              {sortOption}
              <svg className={`w-4 h-4 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`absolute top-full right-0 mt-6 w-64 bg-white border border-stone-200 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 origin-top-right ${isSortOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
              <div className="py-2 flex flex-col">
                {sortOptions.map(option => (
                  <button key={option} onClick={() => { setSortOption(option); setIsSortOpen(false); }}
                    className={`text-left px-6 py-4 text-xs tracking-[0.15em] uppercase hover:bg-stone-50 transition-colors ${sortOption === option ? 'font-bold text-stone-900' : 'font-medium text-stone-500'}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <span className="text-[11px] text-stone-500 tracking-[0.15em] uppercase">
            {productosFiltrados.length} {productosFiltrados.length === 1 ? 'Pieza' : 'Piezas'}
          </span>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <section className="w-full py-12 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          <FilterDrawer
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            tallasDisponibles={tallasDisponibles}
            coloresDisponibles={coloresDisponibles}
            tallasFiltro={tallasFiltro}
            coloresFiltro={coloresFiltro}
            onTallaChange={handleTallaChange}
            onColorChange={handleColorChange}
            onLimpiar={handleLimpiar}
            totalFiltrados={productosFiltrados.length}
          />
          <div className="flex-1">
            {productosFiltrados.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
                  {productosFiltrados.slice(0, visibles).map(p => <ProductCard key={p.id} producto={p} />)}
                </div>
                {visibles < productosFiltrados.length && (
                  <div className="mt-20 flex justify-center">
                    <button
                      onClick={() => setVisibles(v => v + 12)}
                      className="text-[11px] font-bold text-stone-900 tracking-[0.2em] uppercase border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors"
                    >
                      Cargar más piezas
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-stone-300">Sin resultados</span>
                <p className="text-[12px] tracking-[0.15em] text-stone-400 uppercase text-center">No hay piezas con esos filtros</p>
                {hayFiltrosActivos && (
                  <button onClick={handleLimpiar}
                    className="mt-2 text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1 text-stone-900 hover:opacity-60 transition-opacity">
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}