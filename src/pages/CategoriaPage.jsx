import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CartContext } from '../App';
import FilterDrawer from '../sections/FilterDrawer';
import { getProductos, getCategoriaById } from '../services/productService'; // 👈 Esta es la línea clave
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';

// ── PÁGINA PRINCIPAL DE CATEGORÍA ──
export default function CategoriaPage() {
  const { id } = useParams();

  // 1. Estados para los datos de Supabase
  const [productosDB, setProductosDB] = useState([]);
  const [dataHeader, setDataHeader] = useState(null); // 👈 Nuevo estado para el banner
  const [loading, setLoading] = useState(true);

  // 2. Estados para UI
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState('Lo más nuevo');
  const sortOptions = ['Lo más nuevo', 'Precio: Menor a Mayor', 'Precio: Mayor a Menor'];
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 3. Efecto para cargar TODO desde Supabase
useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);

      // --- A. Cargar los Productos ---
      const todosLosProductos = await getProductos();
      if (id && id !== 'default') {
        const filtrados = todosLosProductos.filter(
          p => p.categoria && p.categoria.toLowerCase() === id.toLowerCase()
        );
        setProductosDB(filtrados);
      } else {
        setProductosDB(todosLosProductos);
      }

      // --- B. Cargar el Banner de la Categoría ---
      // Forzamos a que el ID sea siempre minúsculas y sin espacios para buscar en Supabase
      const categoriaIdBusqueda = id ? id.toLowerCase().trim() : 'default';
      
      let infoCategoria = await getCategoriaById(categoriaIdBusqueda);
      
      // Si no existe esa categoría específica, intentamos buscar 'default'
      if (!infoCategoria) {
        console.log(`⚠️ Categoría "${categoriaIdBusqueda}" no encontrada en DB, cargando banner default...`);
        infoCategoria = await getCategoriaById('default');
      }

      // Si ni siquiera existe el 'default' en Supabase, usamos este respaldo manual
      setDataHeader(infoCategoria || {
        titulo1: 'Cole',
        titulo2: 'cciones',
        desc: 'Descubre nuestra línea completa de prendas diseñadas para ser tu segunda piel.',
        heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80'
      });

      setLoading(false);
    };

    cargarTodo();
  }, [id]); // 👈 Aquí termina el useEffect correctamente

  useEffect(() => {
    if (isFilterOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isFilterOpen]);

  // Pantalla de carga mientras traemos el banner y los productos
  if (loading || !dataHeader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: 'var(--font-primary)' }}>
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 animate-pulse">
          Sincronizando Colección...
        </span>
      </div>
    );
  }
    
  return (
    <div className="min-h-screen bg-white relative">

      <SEO
        title={`${dataHeader.titulo1}${dataHeader.titulo2}`}
        description={dataHeader.desc}
        url={id ? `/categoria/${id}` : '/categoria'}
      />
      
      {/* ── 1. HERO EDITORIAL (DINÁMICO) ── */}
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
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[10px] tracking-[0.2em] text-white/70 uppercase">
              <Link to="/" className="hover:text-white transition-colors">Inicio</Link> <span className="mx-2">/</span> Colecciones
            </span>
          </nav>
          
          <h1 style={{ fontFamily: 'var(--font-primary)' }} className="text-3xl md:text-5xl font-light text-white tracking-[0.2em] uppercase mb-4">
            {dataHeader.titulo1}<strong className="font-bold">{dataHeader.titulo2}</strong>
          </h1>
          <p style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] md:text-xs text-white/80 tracking-[0.15em] max-w-md mx-auto uppercase leading-relaxed">
            {dataHeader.desc}
          </p>
        </div>
      </section>

      {/* ── 2. BARRA DE FILTROS (STICKY) ── */}
      <div className="sticky top-[72px] md:top-[88px] z-30 w-full bg-white/80 backdrop-blur-md border-b border-stone-200 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 h-16 md:h-20 flex items-center justify-between">
          <div className="flex gap-6">
            
            {/* BOTÓN MÓVIL: Se oculta en pantallas grandes (lg:hidden) */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              style={{ fontFamily: 'var(--font-primary)' }} 
              className="lg:hidden text-xs md:text-[13px] font-medium text-stone-900 tracking-[0.15em] uppercase flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              Filtros
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
            </button>

            {/* TÍTULO ESCRITORIO: Reemplaza al botón de filtros */}
            <span className="hidden lg:block text-[11px] font-bold text-stone-900 tracking-[0.2em] uppercase">
              Catálogo
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 relative">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-xs md:text-[13px] text-stone-500 tracking-[0.15em] uppercase">Ordenar por:</span>
            <button onClick={() => setIsSortOpen(!isSortOpen)} style={{ fontFamily: 'var(--font-primary)' }} className="text-xs md:text-[13px] font-medium text-stone-900 tracking-[0.15em] uppercase bg-transparent border-none outline-none cursor-pointer flex items-center gap-2 hover:opacity-70 transition-opacity">
              {sortOption}
              <svg className={`w-4 h-4 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className={`absolute top-full right-0 mt-6 w-64 bg-white border border-stone-200 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 origin-top-right ${isSortOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
              <div className="py-2 flex flex-col">
                {sortOptions.map(option => (
                  <button key={option} onClick={() => { setSortOption(option); setIsSortOpen(false); }} style={{ fontFamily: 'var(--font-primary)' }} className={`text-left px-6 py-4 text-xs tracking-[0.15em] uppercase hover:bg-stone-50 transition-colors ${sortOption === option ? 'font-bold text-stone-900' : 'font-medium text-stone-500'}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <span style={{ fontFamily: 'var(--font-primary)' }} className="md:hidden text-[11px] text-stone-500 tracking-[0.15em] uppercase">
            {productosDB.length} Piezas
          </span>
        </div>
      </div>

      {/* ── 3. CONTENIDO PRINCIPAL (Filtros a la izq, Productos a la der) ── */}
      <section className="w-full py-12 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          
          {/* ── IMPORTAMOS EL COMPONENTE DE FILTROS ── */}
          <FilterDrawer isFilterOpen={isFilterOpen} setIsFilterOpen={setIsFilterOpen} />

          {/* ── CUADRÍCULA DE PRODUCTOS ── */}
          <div className="flex-1">
            {loading ? (
               <div className="w-full py-20 flex justify-center text-[10px] uppercase tracking-[0.2em] text-stone-500 animate-pulse" style={{ fontFamily: 'var(--font-primary)' }}>
                 Sincronizando catálogo...
               </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
                  {productosDB.map((p) => (
                    <ProductCard key={p.id} producto={p} />
                  ))}
                </div>
                
                {productosDB.length > 0 && (
                  <div className="mt-20 flex justify-center">
                    <button style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] font-bold text-stone-900 tracking-[0.2em] uppercase border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors">
                      Cargar más piezas
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}