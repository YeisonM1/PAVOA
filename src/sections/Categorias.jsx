import React from 'react';

// Estrategia de Contenido: 4 categorías estructuradas para el mosaico asimétrico
const categorias = {
  protagonista: {
    id: 1,
    nombre: 'Sets Completos',
    desc: 'La colección definitiva',
    href: '#sets',
    // Imagen de cuerpo entero
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=80', 
  },
  superior: {
    id: 2,
    nombre: 'Tops & Superior',
    desc: 'Soporte y diseño',
    href: '#superior',
    // Imagen en formato horizontal o plano medio
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000&q=80',
  },
  nicho1: {
    id: 3,
    nombre: 'Bottoms',
    desc: 'Movimiento libre',
    href: '#bottoms',
    // Imagen enfocada en licras/shorts
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80',
  },
  nicho2: {
    id: 4,
    nombre: 'Accesorios',
    desc: 'El toque final',
    href: '#accesorios',
    // Detalle de producto
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80',
  }
};

// Componente reutilizable para las tarjetas limpias (Minimalismo Puro)
const CategoriaCard = ({ cat, className }) => (
  <a
    href={cat.href}
    className={`group relative overflow-hidden block ${className}`}
  >
    {/* Imagen con zoom lento (Ken Burns) */}
    <img
      src={cat.image}
      alt={cat.nombre}
      className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
    />

    {/* Text Protection: Gradiente súper suave solo en la base para no tapar la foto */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
    
    {/* Overlay general muy sutil que se oscurece un micro-punto en hover para dar dramatismo */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

    {/* Contenido tipográfico suspendido en la esquina inferior izquierda */}
    <div className="absolute bottom-0 left-0 p-6 md:p-8 flex flex-col justify-end w-full">
      <p
        style={{ fontFamily: 'var(--font-primary)' }}
        className="text-[9px] font-medium text-white/70 uppercase tracking-[0.2em] mb-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"
      >
        {cat.desc}
      </p>
      <div className="flex items-end justify-between">
        <h3
          style={{ fontFamily: 'var(--font-primary)' }}
          className="text-lg md:text-xl font-medium text-white uppercase tracking-[0.15em]"
        >
          {cat.nombre}
        </h3>
        
        {/* Flecha elegante que se anima a la derecha */}
        <span className="text-white transform transition-transform duration-500 group-hover:translate-x-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </div>
  </a>
);

export default function Categorias() {
  return (
    <section className="w-full bg-stone-50 py-24 px-6 md:px-12 lg:px-16">
      
      {/* Título y Enlace (Estilo Editorial) */}
      <div className="max-w-[1400px] mx-auto mb-12 flex items-end justify-between border-b border-stone-200 pb-6">
        <h2
          style={{ fontFamily: 'var(--font-primary)' }}
          className="text-sm md:text-[15px] font-semibold text-stone-900 tracking-[0.25em] uppercase"
        >
          DISEÑADO PARA TI
        </h2>
        <a
          href="#catalogo"
          style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }}
          className="text-[10px] font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase flex items-center gap-2 group"
        >
          Ver todo
          <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
        </a>
      </div>

      {/* ── BENTO GRID / MOSAICO EDITORIAL ── */}
      {/* Mantenemos el max-w para el "enmarque" que le gustó a la clienta */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        
        {/* IZQUIERDA: Protagonista (Ocupa todo el alto) */}
        <div className="h-[60vh] md:h-[75vh]">
          <CategoriaCard cat={categorias.protagonista} className="w-full h-full" />
        </div>

        {/* DERECHA: Dividida en Superior (Horizontal) e Inferior (2 Cuadrados) */}
        <div className="flex flex-col gap-4 lg:gap-6 h-[60vh] md:h-[75vh]">
          
          {/* Arriba: Foco Horizontal */}
          <div className="h-1/2 w-full">
            <CategoriaCard cat={categorias.superior} className="w-full h-full" />
          </div>

          {/* Abajo: Dos nichos cuadrados */}
          <div className="h-1/2 w-full grid grid-cols-2 gap-4 lg:gap-6">
            <CategoriaCard cat={categorias.nicho1} className="w-full h-full" />
            <CategoriaCard cat={categorias.nicho2} className="w-full h-full" />
          </div>

        </div>
        
      </div>
    </section>
  );
}