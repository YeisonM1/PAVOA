import { useState, useEffect } from 'react';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80',
    tag: 'Nueva Colección',
    headline: ['Hecha para', 'Rendir.'],
    sub: 'Diseños que acompañan cada movimiento. Rendimiento sin sacrificar elegancia.',
    cta: 'Ver Colección',
    href: '#catalogo',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    tag: 'Temporada 2026',
    headline: ['Fuerza.', 'Elegancia.'],
    sub: 'Cada prenda diseñada para mujeres que no se detienen.',
    cta: 'Explorar',
    href: '#catalogo',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=900&q=80',
    tag: 'Best Sellers',
    headline: ['Tu mejor', 'versión.'],
    sub: 'Las piezas favoritas de nuestra comunidad. Limitadas.',
    cta: 'Comprar Ahora',
    href: '#catalogo',
  },
];

export default function HeroSplit() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('up');

  const goTo = (idx) => {
    if (animating || idx === current) return;
    setDirection(idx > current ? 'up' : 'down');
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 500);
  };

  const next = () => goTo((current + 1) % slides.length);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);

  // Auto-avance cada 5s
  useEffect(() => {
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  }, [current]);

  const s = slides[current];

  return (
    <section className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-white">

      {/* LADO IZQUIERDO — Imagen */}
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full overflow-hidden bg-stone-100">
        <img
          key={s.id + '-img'}
          src={s.image}
          alt={s.tag}
          className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${
            animating ? 'scale-105 opacity-0' : 'scale-100 opacity-100'
          }`}
        />
        {/* Overlay sutil */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Tag flotante */}
        <div className="absolute top-8 left-8">
          <span
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
            className="text-[10px] font-medium text-white bg-black/40 backdrop-blur-sm px-4 py-2"
          >
            {s.tag.toUpperCase()}
          </span>
        </div>

        {/* Contador */}
        <div
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="absolute bottom-8 left-8 text-white/70 text-[11px] tracking-widest"
        >
          {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>
      </div>

      {/* LADO DERECHO — Texto */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center px-10 md:px-16 lg:px-24 bg-white relative">

        {/* Línea decorativa */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-24 bg-stone-900 hidden md:block" />

        <div
          key={s.id + '-text'}
          className={`transition-all duration-500 ease-out ${
            animating ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Tag */}
          <p
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.25em' }}
            className="text-[10px] font-semibold text-stone-400 mb-6"
          >
            {s.tag.toUpperCase()}
          </p>

          {/* Headline */}
          <h1
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            className="text-5xl md:text-6xl lg:text-7xl font-light text-stone-900 leading-tight mb-6"
          >
            {s.headline.map((line, i) => (
              <span key={i} className="block">
                {i === s.headline.length - 1
                  ? <strong className="font-semibold">{line}</strong>
                  : line}
              </span>
            ))}
          </h1>

          {/* Subtexto */}
          <p
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            className="text-stone-500 text-sm font-light leading-relaxed max-w-sm mb-10"
          >
            {s.sub}
          </p>

          {/* CTA */}
          <a
            href={s.href}
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
            className="inline-block text-[11px] font-semibold text-white bg-stone-900 px-8 py-4 hover:bg-stone-700 transition-colors duration-300"
          >
            {s.cta.toUpperCase()}
          </a>
        </div>

        {/* Navegación */}
        <div className="absolute bottom-8 right-10 md:right-16 flex items-center gap-6">
          <button
            onClick={prev}
            className="text-stone-400 hover:text-stone-900 transition-colors text-xl font-light"
            aria-label="Anterior"
          >
            ←
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current ? 'w-6 h-1.5 bg-stone-900' : 'w-1.5 h-1.5 bg-stone-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="text-stone-400 hover:text-stone-900 transition-colors text-xl font-light"
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}