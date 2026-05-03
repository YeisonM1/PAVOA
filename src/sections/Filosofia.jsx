import { useEffect, useState } from 'react';
import logoChampan from '../assets/Pavoa Logo Hueso Sin Fondo.svg';
import { FILOSOFIA_SECTION_DEFAULTS, getFilosofiaSection } from '../services/productService';

export default function Filosofia() {
  const [content, setContent] = useState(FILOSOFIA_SECTION_DEFAULTS);

  useEffect(() => {
    let active = true;

    getFilosofiaSection()
      .then((data) => {
        if (!active || !data) return;
        setContent((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="w-full flex flex-col md:flex-row min-h-[80vh]">

      {/* IZQUIERDA — Texto */}
      <div className="w-full md:w-1/2 bg-stone-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-20 relative">

        {/* Logo Champan — arriba derecha del panel */}
        <div className="absolute top-6 right-5 md:top-8 md:right-7 pointer-events-none">
          <img src={logoChampan} alt="PAVOA" width={120} height={194} className="h-24 md:h-36 w-auto object-contain" />
        </div>

        {/* Tag */}
        <p
          style={{ letterSpacing: '0.28em' }}
          className="font-secondary text-[12px] md:text-[13px] font-medium text-stone-300 mb-8"
        >
          {content.tag}
        </p>

        {/* Frase principal */}
        <h2
          className="font-secondary text-4xl md:text-5xl lg:text-6xl font-[100] text-white leading-tight mb-6"
        >
          {content.headlineLine1}
          <br />
          <span className="font-[100]">{content.headlineLine2}</span>
        </h2>

        {/* Línea decorativa */}
        <div className="w-12 h-[1px] bg-stone-600 mb-8" />

        {/* Subtexto */}
        <p
          className="font-secondary text-stone-300 text-sm font-light leading-relaxed max-w-sm mb-12"
        >
          {content.body}
        </p>

        {/* CTA */}
        <a
          href={content.ctaLink}
          style={{ letterSpacing: '0.2em' }}
          className="font-secondary inline-block text-[11px] font-semibold text-stone-900 bg-white px-8 py-4 hover:bg-stone-100 transition-colors duration-300 w-fit"
        >
          {content.ctaText}
        </a>
      </div>

      {/* DERECHA — Imagen */}
      <div className="w-full md:w-1/2 relative overflow-hidden min-h-[50vh] md:min-h-full">
        <img
          src={content.image}
          alt="PAVOA Filosofia"
          width={600}
          height={900}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover absolute inset-0 hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Overlay sutil */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

    </section>
  );
}
