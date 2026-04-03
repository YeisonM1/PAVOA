import React, { useState, useEffect, useRef } from 'react';

const categorias = {
  protagonista: {
    id: 1,
    nombre: 'Sets Completos',
    desc: 'La colección definitiva',
    href: '#sets',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=80', 
  },
  superior: {
    id: 2,
    nombre: 'Tops & Superior',
    desc: 'Soporte y diseño',
    href: '#superior',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000&q=80',
  },
  nicho1: {
    id: 3,
    nombre: 'ESSENTIALS',
    desc: 'Movimiento libre',
    href: '#bottoms',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80',
  },
  nicho2: {
    id: 4,
    nombre: 'Accesorios',
    desc: 'El toque final',
    href: '#accesorios',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80',
  }
};

const CategoriaCard = ({ cat, className, delay = 0 }) => {
  // Estados para controlar la aparición táctil
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Cuando el elemento entra un 15% en la pantalla, disparamos la animación
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.disconnect(); // Solo se anima la primera vez que se ve
        }
      },
      { threshold: 0.15 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <a
      ref={cardRef}
      href={cat.href}
      /* * LÓGICA DE ANIMACIÓN: 
       * Móvil: Arranca oculto, abajo y pequeño. Al ser visible, vuelve a la normalidad.
       * Desktop (md:): Se fuerza a estado normal (!opacity-100) para no afectar la versión PC.
       */
      className={`group relative overflow-hidden block ${className} 
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}
        md:!opacity-100 md:!translate-y-0 md:!scale-100
        transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)]
      `}
    >
      <img
        src={cat.image}
        alt={cat.nombre}
        className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out md:group-hover:scale-105 scale-110"
        style={{ transformOrigin: 'center center' }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 md:opacity-80" />
      <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-500" />

      {/* ── TEXTOS (Revelación Sincronizada y Atrasada) ── */}
      <div className="absolute bottom-0 left-0 p-6 md:p-8 flex flex-col justify-end w-full z-20">
        <p
          style={{ fontFamily: 'var(--font-primary)' }}
          className={`text-[9px] font-medium text-white/80 uppercase tracking-[0.25em] mb-1 
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            md:transform md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 
            transition-all duration-700 delay-300 md:delay-0
          `}
        >
          {cat.desc}
        </p>
        
        <div className="flex items-end justify-between">
          <h3
            style={{ fontFamily: 'var(--font-primary)' }}
            className={`text-lg md:text-xl font-medium text-white uppercase tracking-[0.15em]
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              md:!opacity-100 md:!translate-y-0
              transition-all duration-700 delay-[400ms] md:delay-0
            `}
          >
            {cat.nombre}
          </h3>
          
          <span className={`text-white transform md:group-hover:translate-x-2
            ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
            md:!opacity-100 md:!translate-x-0
            transition-all duration-700 delay-[500ms] md:delay-0
          `}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
};

export default function Categorias() {
  return (
    <section className="w-full bg-stone-50 py-20 md:py-24 px-6 md:px-12 lg:px-16 overflow-hidden">
      
      <div className="max-w-[1400px] mx-auto mb-10 md:mb-12 flex items-end justify-between border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] text-stone-500 tracking-[0.3em] uppercase font-medium">
            Descubre tu estilo
          </span>
          <h2
            style={{ fontFamily: 'var(--font-primary)' }}
            className="text-lg md:text-xl font-light text-stone-900 tracking-[0.2em] uppercase"
          >
            DISEÑADO <strong className="font-bold">PARA TI</strong>
          </h2>
        </div>
        
        <a
          href="#catalogo"
          style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }}
          className="text-[10px] font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase flex items-center gap-2 group"
        >
          Explorar
          <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
        </a>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        
        <div className="h-[55vh] md:h-[75vh]">
          {/* Aparece de inmediato al hacer scroll */}
          <CategoriaCard cat={categorias.protagonista} className="w-full h-full" delay={0} />
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="h-[35vh] md:h-[calc(37.5vh-0.75rem)] w-full">
            {/* Aparece de inmediato al llegar a su altura */}
            <CategoriaCard cat={categorias.superior} className="w-full h-full" delay={0} />
          </div>

          {/* Inferior (Dos nichos cuadrados en móvil y desktop) */}
          {/* CAMBIO: gap-4 -> gap-6 para dar más 'respiración' en móvil */}
          <div className="h-[35vh] md:h-[calc(37.5vh-0.75rem)] w-full grid grid-cols-2 gap-6 lg:gap-6">
            {/* Efecto Escalonado: Nicho1 aparece primero, Nicho2 un instante después */}
            <CategoriaCard cat={categorias.nicho1} className="w-full h-full" delay={0} />
            <CategoriaCard cat={categorias.nicho2} className="w-full h-full" delay={150} />
          </div>
        </div>
      </div>
    </section>
  );
}