import { useState, useEffect, useRef } from 'react';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1400&q=80',
    tag: 'Rendimiento',
    headline: 'Muévete sin límites.',
    sub: 'Tecnología de tejido premium que se adapta a ti.',
    cta: 'Descubrir',
    href: '#catalogo',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1400&q=80',
    tag: 'Estilo',
    headline: 'El lujo de sentirte tú.',
    sub: 'Cada detalle pensado para la mujer que lo exige todo.',
    cta: 'Ver Colección',
    href: '#catalogo',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=1400&q=80',
    tag: 'Exclusivo',
    headline: 'Diseñado para ganar.',
    sub: 'Colección limitada. Piezas que definen tu entrenamiento.',
    cta: 'Comprar Ahora',
    href: '#catalogo',
    align: 'right',
  },
];

export default function HeroFullscreen() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const progressRef = useRef(null);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setPrev(current);
    setCurrent(idx);
    setTimeout(() => {
      setPrev(null);
      setAnimating(false);
    }, 700);
  };

  const next = () => goTo((current + 1) % slides.length);

  // Auto-avance
  useEffect(() => {
    timerRef.current = setTimeout(next, 5500);
    return () => clearTimeout(timerRef.current);
  }, [current]);

  const s = slides[current];
  const alignClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[s.align];

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">

      {/* Slide anterior (sale hacia arriba con zoom out) */}
      {prev !== null && (
        <div
          className="absolute inset-0 z-10 transition-all duration-700 ease-in-out"
          style={{ transform: 'scale(1.05) translateY(-4%)', opacity: 0 }}
        >
          <img
            src={slides[prev].image}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Slide actual (entra desde abajo) */}
      <div
        key={s.id}
        className={`absolute inset-0 z-20 transition-all duration-700 ease-out ${
          animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <img
          src={s.image}
          alt={s.tag}
          className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${
            animating ? 'scale-100' : 'scale-105'
          }`}
        />
        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
      </div>

      {/* Contenido */}
      <div
        key={s.id + '-content'}
        className={`absolute inset-0 z-30 flex flex-col justify-end pb-20 px-10 md:px-20 ${alignClass} transition-all duration-500 delay-200 ${
          animating ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Tag */}
        <p
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.3em' }}
          className="text-[10px] font-semibold text-white/60 mb-4"
        >
          {s.tag.toUpperCase()}
        </p>

        {/* Headline */}
        <h2
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-5xl md:text-7xl lg:text-8xl font-light text-white leading-tight mb-5 max-w-3xl"
        >
          {s.headline}
        </h2>

        {/* Sub */}
        <p
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-white/70 text-sm font-light max-w-md mb-8 leading-relaxed"
        >
          {s.sub}
        </p>

        {/* CTA */}
        <a
          href={s.href}
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
          className="inline-block text-[11px] font-semibold text-stone-900 bg-white px-8 py-4 hover:bg-stone-100 transition-colors duration-300 w-fit"
        >
          {s.cta.toUpperCase()}
        </a>
      </div>

      {/* Barras de progreso */}
      <div className="absolute bottom-6 left-10 md:left-20 z-30 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative h-[2px] bg-white/20 overflow-hidden transition-all duration-300"
            style={{ width: i === current ? '48px' : '24px' }}
            aria-label={`Slide ${i + 1}`}
          >
            {i === current && (
              <span
                className="absolute inset-y-0 left-0 bg-white animate-[progress_5.5s_linear_forwards]"
                style={{
                  animation: 'fillbar 5.5s linear forwards',
                }}
              />
            )}
            {i < current && <span className="absolute inset-0 bg-white" />}
          </button>
        ))}
      </div>

      {/* Número slide */}
      <div
        style={{ fontFamily: 'Montserrat, sans-serif' }}
        className="absolute top-8 right-10 md:right-20 z-30 text-white/40 text-[11px] tracking-widest"
      >
        {String(current + 1).padStart(2, '0')} — {String(slides.length).padStart(2, '0')}
      </div>

      {/* Flecha siguiente */}
      <button
        onClick={next}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white transition-colors duration-300 text-2xl font-light hidden md:block"
        aria-label="Siguiente"
      >
        ↓
      </button>

      <style>{`
        @keyframes fillbar {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
} 

//