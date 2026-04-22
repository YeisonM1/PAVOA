import { useState, useEffect } from 'react';
import { heroImage } from '../utils/imageUrl';
import { useCarousel } from '../hooks/useCarousel';
import { getHeroSlides } from '../services/productService';
import logoNegro from '../assets/LOGO-PAVOA.svg';

const CACHE_KEY = 'pavoa_hero_slides';

const SLIDES_FALLBACK = [
  {
    id: 1,
    image: null,
    tag: 'Nueva Colección',
    headline: ['El lujo de', 'sentirte', 'tú.'],
    sub: 'Descubre nuestra nueva colección diseñada para mujeres que buscan estilo, rendimiento y exclusividad.',
    cta: 'Explorar colección',
    href: '/categoria',
  },
  {
    id: 2,
    image: null,
    tag: 'Temporada 2026',
    headline: ['Fuerza &', 'Elegancia', 'pura.'],
    sub: 'Cada prenda diseñada para mujeres que no se detienen en su día a día.',
    cta: 'Explorar',
    href: '/categoria',
  },
  {
    id: 3,
    image: null,
    tag: 'Best Sellers',
    headline: ['Descubre', 'tu mejor', 'versión.'],
    sub: 'Las piezas favoritas de nuestra comunidad. Ediciones estrictamente limitadas.',
    cta: 'Descubrir colección',
    href: '/categoria',
  },
];

export default function HeroFullscreen() {
  // ── Intentar cargar desde localStorage primero ────────
  const cached = (() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [slides, setSlides] = useState(cached || SLIDES_FALLBACK);

  useEffect(() => {
    getHeroSlides().then(data => {
      if (data.length > 0) {
        setSlides(data);
        // Guardar en localStorage para la próxima visita
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      }
    });
  }, []);

  const { current, animating, next, prev } = useCarousel(slides.length, 6000, 800);
  const s = slides[current];

  return (
    <section className="relative w-full h-[100dvh] overflow-hidden bg-black" role="region" aria-roledescription="carrusel" aria-label="Banner principal">

      {/* Hero — ancho completo */}
      <div className="w-full h-full relative overflow-hidden">

      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {slide.image && (
            <picture>
              {slide.imageMobile && (
                <source media="(max-width: 767px)" srcSet={heroImage(slide.imageMobile)} />
              )}
              <img
                src={heroImage(slide.image)}
                alt={slide.tag}
                fetchpriority={index === current ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                className={`w-full h-full object-cover origin-center transition-transform duration-[6000ms] ease-linear ${
                  index === current ? 'scale-105' : 'scale-100'
                }`}
              />
            </picture>
          )}
        </div>
      ))}

      <span className="sr-only" aria-live="polite">
        Slide {current + 1} de {slides.length}
      </span>

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-black/20 pointer-events-none" />

      {/* Logo mobile */}
      <div className="md:hidden absolute top-[120px] left-4 z-20 pointer-events-none">
        <img src={logoNegro} alt="PAVOA" className="h-14 w-auto object-contain" />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 md:pb-20 lg:pb-24 px-8 sm:px-12 md:pl-[14%] md:pr-16 lg:pl-[16%] lg:pr-24">
        <div
          key={s.id + '-text'}
          className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
            animating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
          }`}
        >
          <p style={{ letterSpacing: '0.3em' }} className="text-[10px] font-semibold text-white/80 uppercase mb-4">
            {s.tag}
          </p>

          <h1
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light text-white leading-[1.05] uppercase tracking-wide mb-6"
          >
            {s.headline.map((line, i) => (
              <span key={i} className="block">
                {i === s.headline.length - 1
                  ? <strong className="font-semibold text-white">{line}</strong>
                  : line}
              </span>
            ))}
          </h1>

          <p style={{ letterSpacing: '0.15em' }} className="text-white/95 text-[10px] sm:text-[11px] font-medium uppercase leading-relaxed max-w-md mb-10 drop-shadow-md">
            {s.sub}
          </p>

          <a
            href={s.href}
            style={{ letterSpacing: '0.25em' }}
            className="inline-flex items-center text-[11px] font-bold text-white uppercase border-b border-white pb-2 hover:text-stone-300 hover:border-stone-300 transition-all duration-300 group"
          >
            {s.cta}
            <span className="ml-4 transform transition-transform duration-300 group-hover:translate-x-3">→</span>
          </a>

          <p style={{ letterSpacing: '0.2em' }} className="text-white/40 text-[8px] sm:text-[9px] mt-5 tracking-[0.25em]">
            Envíos a todo el país  -  Piezas limitadas
          </p>
        </div>
      </div>

      <div className="absolute bottom-10 right-8 md:right-16 z-20 flex items-center gap-8">
        <div className="text-white/90 text-[11px] tracking-[0.3em] font-medium hidden sm:block">
          {String(current + 1).padStart(2, '0')} — {String(slides.length).padStart(2, '0')}
        </div>
        <div className="flex gap-3">
          <button onClick={prev} className="w-12 h-12 flex items-center justify-center border border-white/20 rounded-full text-white/70 hover:bg-white hover:text-black hover:border-white transition-all duration-500 backdrop-blur-sm group" aria-label="Anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transform transition-transform duration-300 group-hover:-translate-x-1">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={next} className="w-12 h-12 flex items-center justify-center border border-white/20 rounded-full text-white/70 hover:bg-white hover:text-black hover:border-white transition-all duration-500 backdrop-blur-sm group" aria-label="Siguiente">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transform transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Logo overlay con degradado integrado — desktop only, sin borde físico */}
      <div
        className="hidden md:flex absolute left-0 top-0 h-full z-30 items-center pointer-events-none pl-5"
        style={{ width: '45%', background: 'linear-gradient(to right, #F2E4E1 0%, #F2E4E1CC 30%, #F2E4E180 55%, #F2E4E120 80%, transparent 100%)' }}
      >
        <img src={logoNegro} alt="PAVOA" className="max-w-[88px] w-[6.5vw] object-contain" />
      </div>

      </div>{/* fin hero */}
    </section>
  );
}