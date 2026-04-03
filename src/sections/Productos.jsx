import React from 'react';

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
  return (
    <div className="group cursor-pointer flex flex-col gap-4">
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

        {/* Imagen principal (Con zoom sutil) */}
        <img
          src={producto.imagen1}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
        />

        {/* Imagen hover (Fade In + Zoom) */}
        <img
          src={producto.imagen2}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-0 group-hover:opacity-100 group-hover:scale-105"
        />

        {/* Overlay sutil para que el panel inferior resalte */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none" />

        {/* ── PANEL QUICK SHOP (Glassmorphism) ── */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-20">
          <div className="bg-white/70 backdrop-blur-md pt-5 pb-6 px-4 border-t border-white/40 flex flex-col items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <span 
              style={{ fontFamily: 'var(--font-primary)' }} 
              className="text-[9px] font-bold tracking-[0.25em] text-stone-800 uppercase"
            >
              Agregar Rápido
            </span>
            
            {/* Botones de Tallas */}
            <div className="flex gap-2 w-full justify-center">
              {['S', 'M', 'L'].map(talla => (
                <button 
                  key={talla} 
                  style={{ fontFamily: 'var(--font-primary)' }}
                  className="w-10 h-10 flex items-center justify-center text-[11px] font-medium text-stone-700 border border-stone-300/60 bg-white/50 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300"
                >
                  {talla}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO DEL PRODUCTO (Ultra limpia) ── */}
      {/* ── INFO DEL PRODUCTO (Ultra limpia) ── */}
      <div className="flex flex-col items-center text-center">
        <h3
          style={{ fontFamily: 'var(--font-primary)' }}
          className="text-[11px] font-bold text-stone-900 tracking-[0.15em] uppercase"
        >
          {producto.nombre}
        </h3>
        
        {/* El precio está oculto por defecto y aparece flotando hacia arriba en hover */}
        {/* CAMBIO: Aumentamos h-[20px] a h-[24px] para que quepa el texto más grande */}
        <div className="h-[24px] overflow-hidden mt-1.5">
          <p
            style={{ fontFamily: 'var(--font-primary)' }}
            className="text-[13px] font-semibold text-stone-500 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out"
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
    <section className="w-full bg-white py-24 px-6 md:px-12 lg:px-16">
      {/* Contenedor principal alineado con el ancho de las demás secciones */}
      <div className="max-w-[1400px] mx-auto">

        {/* ── TÍTULO ESTILO EDITORIAL ── */}
        <div className="flex items-end justify-between mb-12 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-1">
            {/* Micro-título de contexto */}
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] text-stone-500 tracking-[0.3em] uppercase font-medium">
              Lo más buscado
            </span>
            {/* Título Principal */}
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

        {/* ── CUADRÍCULA DE PRODUCTOS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
          {productos.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>

      </div>
    </section>
  );
}