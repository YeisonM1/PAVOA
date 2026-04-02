import { useState, useRef, useEffect } from 'react';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=1400&q=80',
    position: 'center',
    tag: 'Temporada 2025',
    numero: '01',
    headline: ['Colección', 'Primavera.'],
    sub: 'Piezas diseñadas para mujeres que no se detienen.',
    cta: 'Explorar Colección',
    href: '#catalogo',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80',
    position: 'top',
    tag: 'Exclusivo',
    numero: '02',
    headline: ['Nueva', 'Temporada.'],
    sub: 'Lo más reciente de PAVOA. Edición limitada.',
    cta: 'Ver Ahora',
    href: '#catalogo',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=80',
    position: 'top',
    tag: 'Best Sellers',
    numero: '03',
    headline: ['Las más', 'Elegidas.'],
    sub: 'Las favoritas de nuestra comunidad. Pocas unidades.',
    cta: 'Comprar Ahora',
    href: '#catalogo',
  },
];

export default function BannerSecundario() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const sectionRef = useRef(null);

  const goTo = (idx) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 600);
  };

  const next = () => goTo((current + 1) % slides.length);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);

  useEffect(() => {
    const t = setTimeout(next, 6000);
    return () => clearTimeout(t);
  }, [current]);

  const handleMouseMove = (e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    setMouseX(x);
    setMouseY(y);
  };

  const s = slides[current];

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative w-full overflow-hidden"
      style={{ height: '70vh' }}
    >
      {/* CAPA 1 — Imagen de fondo */}
      <div
        className={`absolute inset-0 transition-opacity duration-600 ${animating ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transform: `scale(1.08) translate(${mouseX * 0.4}px, ${mouseY * 0.4}px)`,
          transition: animating ? 'opacity 0.6s' : 'transform 0.8s ease-out, opacity 0.6s',
        }}
      >
        <img
          key={s.id}
          src={s.image}
          alt={s.tag}
          className="w-full h-full object-cover"
          style={{ objectPosition: s.position }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/10" />
      </div>

      {/* CAPA 2 — Número decorativo */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-12 md:pr-24 pointer-events-none transition-opacity duration-600 ${animating ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transform: `translate(${mouseX * 1.8}px, ${mouseY * 1.8}px)`,
          transition: animating ? 'opacity 0.6s' : 'transform 0.5s ease-out, opacity 0.6s',
        }}
      >
        <span
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(8rem, 20vw, 18rem)',
            lineHeight: 1,
            color: 'rgba(255,255,255,0.04)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            userSelect: 'none',
          }}
        >
          {s.numero}
        </span>
      </div>

      {/* CAPA 3 — Texto */}
      <div
        className={`absolute inset-0 flex flex-col justify-center px-10 md:px-20 transition-all duration-500 ${
          animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
        style={{
          transform: `translate(${mouseX * 0.8}px, ${mouseY * 0.8}px)`,
          transition: animating
            ? 'opacity 0.5s, transform 0.5s'
            : 'transform 0.6s ease-out, opacity 0.5s',
        }}
      >
        <p
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.3em' }}
          className="text-[10px] font-medium text-white/60 mb-5"
        >
          {s.tag.toUpperCase()}
        </p>

        <h2
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6 max-w-xl"
        >
          {s.headline[0]}
          <br />
          <span className="font-semibold">{s.headline[1]}</span>
        </h2>

        <p
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-white/70 text-sm font-light max-w-xs mb-10 leading-relaxed"
        >
          {s.sub}
        </p>

        <a
          href={s.href}
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
          className="inline-block text-[11px] font-semibold text-white border border-white px-8 py-4 hover:bg-white hover:text-stone-900 transition-all duration-300 w-fit"
        >
          {s.cta.toUpperCase()}
        </a>
      </div>

      {/* Flechas */}
      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white transition-colors duration-300 text-2xl hidden md:block"
      >
        ←
      </button>
      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white transition-colors duration-300 text-2xl hidden md:block"
      >
        →
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-10 md:left-20 z-20 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 h-[1px] bg-white ${
              i === current ? 'w-10 opacity-100' : 'w-4 opacity-30'
            }`}
          />
        ))}
      </div>

    </section>
  );
}