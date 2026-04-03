import React, { useState } from 'react';

// Simulamos los productos de esta categoría específica (ej. "Movimiento")
const productosCategoria = [
  { id: 1, nombre: 'Legging Ónix', precio: '$180.000', imagen1: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80', imagen2: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80', tag: 'Bestseller' },
  { id: 2, nombre: 'Biker Éter', precio: '$140.000', imagen1: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80', imagen2: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80', tag: null },
  { id: 3, nombre: 'Legging Nómada', precio: '$190.000', imagen1: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80', imagen2: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80', tag: 'Nuevo' },
  { id: 4, nombre: 'Short Vértice', precio: '$120.000', imagen1: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=600&q=80', imagen2: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80', tag: null },
];

// Reutilizamos tu tarjeta premium táctil
function ProductCard({ producto }) {
  const [showMobileSizes, setShowMobileSizes] = useState(false);
  return (
    <div className="group cursor-pointer flex flex-col gap-4 relative">
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>
        {producto.tag && (
          <span style={{ fontFamily: 'var(--font-primary)' }} className="absolute top-4 left-4 z-30 text-[8px] font-bold text-white bg-stone-900 px-3 py-1.5 uppercase tracking-[0.15em]">
            {producto.tag}
          </span>
        )}
        <img src={producto.imagen1} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105" />
        <img src={producto.imagen2} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-0 md:group-hover:opacity-100 md:group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none" />

        <button onClick={(e) => { e.stopPropagation(); setShowMobileSizes(true); }} className="md:hidden absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-30 text-stone-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div onClick={(e) => { e.stopPropagation(); setShowMobileSizes(false); }} className={`md:hidden absolute inset-0 bg-black/20 z-30 transition-opacity duration-300 ${showMobileSizes ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />

        <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:translate-y-full md:group-hover:translate-y-0 ${showMobileSizes ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="bg-white/80 backdrop-blur-md pt-5 pb-6 px-4 border-t border-white/40 flex flex-col items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] font-bold tracking-[0.25em] text-stone-800 uppercase">Seleccionar Talla</span>
            <div className="flex gap-2 w-full justify-center">
              {['S', 'M', 'L'].map(talla => (
                <button key={talla} style={{ fontFamily: 'var(--font-primary)' }} className="w-10 h-10 flex items-center justify-center text-[11px] font-medium text-stone-700 border border-stone-300/60 bg-white/60 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300">{talla}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center text-center">
        <h3 style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] font-bold text-stone-900 tracking-[0.15em] uppercase">{producto.nombre}</h3>
        <div className="h-[24px] overflow-hidden mt-1.5">
          <p style={{ fontFamily: 'var(--font-primary)' }} className="text-[13px] font-semibold text-stone-500 transform translate-y-0 opacity-100 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">{producto.precio}</p>
        </div>
      </div>
    </div>
  );
}

export default function CategoriaPage() {
    // --- NUEVOS ESTADOS PARA EL DROPDOWN ---
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [sortOption, setSortOption] = useState('Lo más nuevo');
    
    const sortOptions = ['Lo más nuevo', 'Precio: Menor a Mayor', 'Precio: Mayor a Menor'];
    // ---------------------------------------
  return (
    <div className="min-h-screen bg-white">
      
      {/* ── 1. HERO EDITORIAL ── */}
      {/* Ocupa el 60% de la altura de la pantalla (60vh) */}
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-end justify-center pb-16 md:pb-24">
        {/* Imagen de fondo inmersiva */}
        <img 
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&q=80" 
          alt="Categoría Movimiento" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradiente oscuro para que el texto resalte */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Contenido del Hero */}
        <div className="relative z-10 text-center px-6">
          {/* Breadcrumbs (Migas de pan) */}
          <nav className="mb-4">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[10px] tracking-[0.2em] text-white/70 uppercase">
              <a href="/" className="hover:text-white transition-colors">Inicio</a> <span className="mx-2">/</span> Colecciones
            </span>
          </nav>
          
          <h1 style={{ fontFamily: 'var(--font-primary)' }} className="text-3xl md:text-5xl font-light text-white tracking-[0.2em] uppercase mb-4">
            Movi<strong className="font-bold">miento</strong>
          </h1>
          <p style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] md:text-xs text-white/80 tracking-[0.15em] max-w-md mx-auto uppercase leading-relaxed">
            Siluetas diseñadas para fluir contigo. Soporte absoluto, cero restricciones.
          </p>
        </div>
      </section>

      {/* ── 2. BARRA DE FILTROS (STICKY) ── */}
      <div className="sticky top-[72px] md:top-[88px] z-30 w-full bg-white/80 backdrop-blur-md border-b border-stone-200 transition-all duration-300">
        {/* Aumentamos la altura de h-14 a h-16 md:h-20 para que respire más */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 h-16 md:h-20 flex items-center justify-between">
          
          <div className="flex gap-6">
            {/* Aumentamos tamaño de letra a text-xs md:text-[13px] y el icono */}
            <button style={{ fontFamily: 'var(--font-primary)' }} className="text-xs md:text-[13px] font-medium text-stone-900 tracking-[0.15em] uppercase flex items-center gap-2 hover:opacity-70 transition-opacity">
              Filtros
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
            </button>
          </div>

          {/* ── CUSTOM DROPDOWN (ORDENAR POR) ── */}
          <div className="hidden md:flex items-center gap-4 relative">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-xs md:text-[13px] text-stone-500 tracking-[0.15em] uppercase">
              Ordenar por:
            </span>
            
            {/* Botón que abre/cierra el menú */}
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              style={{ fontFamily: 'var(--font-primary)' }} 
              className="text-xs md:text-[13px] font-medium text-stone-900 tracking-[0.15em] uppercase bg-transparent border-none outline-none cursor-pointer flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              {sortOption}
              <svg className={`w-4 h-4 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {/* El Menú Desplegable Flotante */}
            <div className={`absolute top-full right-0 mt-6 w-64 bg-white border border-stone-200 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 origin-top-right ${isSortOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
              <div className="py-2 flex flex-col">
                {sortOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => { 
                      setSortOption(option); 
                      setIsSortOpen(false); 
                    }}
                    style={{ fontFamily: 'var(--font-primary)' }}
                    className={`text-left px-6 py-4 text-xs tracking-[0.15em] uppercase hover:bg-stone-50 transition-colors ${sortOption === option ? 'font-bold text-stone-900' : 'font-medium text-stone-500'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Contador de productos móvil (También un poco más grande) */}
          <span style={{ fontFamily: 'var(--font-primary)' }} className="md:hidden text-[11px] text-stone-500 tracking-[0.15em] uppercase">
            {productosCategoria.length} Piezas
          </span>
        </div>
      </div>

      {/* ── 3. CUADRÍCULA DE PRODUCTOS ── */}
      <section className="w-full py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
          {productosCategoria.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
        
        {/* Botón de "Cargar Más" elegante */}
        <div className="mt-20 flex justify-center">
          <button style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] font-bold text-stone-900 tracking-[0.2em] uppercase border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors">
            Cargar más piezas
          </button>
        </div>
      </section>

    </div>
  );
}