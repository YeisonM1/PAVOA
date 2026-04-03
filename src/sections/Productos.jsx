import React, { useState } from 'react';

const productos = [
  {
    id: 1,
    nombre: 'Conjunto Éter',
    precio: '$280.000',
    imagen1: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80',
    tag: 'Nuevo',
  },
  {
    id: 2,
    nombre: 'Conjunto Nómada',
    precio: '$360.000',
    imagen1: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=600&q=80',
    tag: null,
  },
  {
    id: 3,
    nombre: 'Conjunto Ónix',
    precio: '$290.000',
    imagen1: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80',
    tag: 'Más vendido',
  },
  {
    id: 4,
    nombre: 'Conjunto Vértice',
    precio: '$280.000',
    imagen1: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
    tag: null,
  },
];

function ProductCard({ producto }) {
  // Estado exclusivo para controlar el panel de tallas en móvil (Táctil)
  const [showMobileSizes, setShowMobileSizes] = useState(false);

  return (
    <div className="group cursor-pointer flex flex-col gap-4 w-[75vw] sm:w-[45vw] md:w-full flex-shrink-0 snap-center relative">
      
      {/* ── CONTENEDOR DE IMAGEN Y QUICK SHOP ── */}
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>
        
        {/* Tag (Minimalista) */}
        {producto.tag && (
          <span
            style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }}
            className="absolute top-4 left-4 z-30 text-[8px] font-bold text-white bg-stone-900 px-3 py-1.5 uppercase"
          >
            {producto.tag}
          </span>
        )}

        {/* Imagen principal (Con zoom sutil en desktop hover) */}
        <img
          src={producto.imagen1}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105"
        />

        {/* Imagen hover (Fade In + Zoom - Solo Desktop) */}
        <img
          src={producto.imagen2}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-0 md:group-hover:opacity-100 md:group-hover:scale-105"
        />

        {/* Overlay sutil para que el panel inferior resalte en Desktop */}
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none" />

        {/* ── BOTÓN '+' MÓVIL (Táctil) ── */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMobileSizes(true); }}
          className="md:hidden absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-30 text-stone-900"
          aria-label="Seleccionar talla"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>

        {/* ── OVERLAY MÓVIL OSCURO (Cierra el panel de tallas al tocar fuera) ── */}
        <div 
          onClick={(e) => { e.stopPropagation(); setShowMobileSizes(false); }}
          className={`md:hidden absolute inset-0 bg-black/20 z-30 transition-opacity duration-300 ${showMobileSizes ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        />

        {/* ── PANEL QUICK SHOP (Glassmorphism Slide Up) ── */}
        <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] 
          md:translate-y-full md:group-hover:translate-y-0
          ${showMobileSizes ? 'translate-y-0' : 'translate-y-full'}
        `}>
          <div className="bg-white/80 backdrop-blur-md pt-5 pb-6 px-4 border-t border-white/40 flex flex-col items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <span 
              style={{ fontFamily: 'var(--font-primary)' }} 
              className="text-[9px] font-bold tracking-[0.25em] text-stone-800 uppercase"
            >
              Seleccionar Talla
            </span>
            
            {/* Botones de Tallas */}
            <div className="flex gap-2 w-full justify-center">
              {['S', 'M', 'L'].map(talla => (
                <button 
                  key={talla} 
                  style={{ fontFamily: 'var(--font-primary)' }}
                  className="w-10 h-10 flex items-center justify-center text-[11px] font-medium text-stone-700 border border-stone-300/60 bg-white/60 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300"
                >
                  {talla}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO DEL PRODUCTO (Ultra limpia) ── */}
      <div className="flex flex-col items-center text-center">
        <h3
          style={{ fontFamily: 'var(--font-primary)' }}
          className="text-[11px] font-bold text-stone-900 tracking-[0.15em] uppercase"
        >
          {producto.nombre}
        </h3>
        
        {/* Precio: Visible siempre en móvil, animado en hover para Desktop */}
        <div className="h-[24px] overflow-hidden mt-1.5">
          <p
            style={{ fontFamily: 'var(--font-primary)' }}
            className="text-[13px] font-semibold text-stone-500 transform translate-y-0 opacity-100 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-out"
          >
            {producto.precio}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Productos() {
  return (
    <section className="w-full bg-white py-24 px-6 md:px-12 lg:px-16 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">

        {/* ── TÍTULO ESTILO EDITORIAL ── */}
        <div className="flex items-end justify-between mb-12 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] text-stone-500 tracking-[0.3em] uppercase font-medium">
              Lo más buscado
            </span>
            <h2
              style={{ fontFamily: 'var(--font-primary)' }}
              className="text-lg md:text-xl font-light text-stone-900 tracking-[0.2em] uppercase"
            >
              TU SEGUNDA <strong className="font-bold">PIEL</strong>
            </h2>
          </div>
          
          <a
            href="#catalogo"
            style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }}
            className="text-[10px] font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase flex items-center gap-2 group"
          >
            Asegurar mi talla
            <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* ── CARRUSEL MÓVIL / CUADRÍCULA DESKTOP ── */}
        <div 
          className="flex overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" 
          style={{ scrollbarWidth: 'none' }}
        >
          {productos.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
          
          {/* Tarjeta fantasma en móvil para dar un margen final agradable al deslizar */}
          <div className="w-[10vw] md:hidden flex-shrink-0" aria-hidden="true" />
        </div>

      </div>
    </section>
  );
}