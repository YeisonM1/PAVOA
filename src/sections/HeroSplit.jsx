import { useCarousel } from '../hooks/useCarousel';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80',
    tag: 'Nueva Colección',
    headline: ['El lujo de', 'sentirte', 'tú.'],
    sub: 'Diseños que acompañan cada movimiento. Rendimiento sin sacrificar elegancia.',
    cta: 'Ver Colección',
    href: '#catalogo',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80',
    tag: 'Temporada 2026',
    headline: ['Fuerza &', 'Elegancia', 'pura.'],
    sub: 'Cada prenda diseñada para mujeres que no se detienen en su día a día.',
    cta: 'Explorar',
    href: '#catalogo',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1600&q=80',
    tag: 'Best Sellers',
    headline: ['Descubre', 'tu mejor', 'versión.'],
    sub: 'Las piezas favoritas de nuestra comunidad. Ediciones estrictamente limitadas.',
    cta: 'Comprar Ahora',
    href: '#catalogo',
  },
];

export default function HeroSplit() {
  const { current, animating, next, prev } = useCarousel(slides.length, 6000, 600);
  const s = slides[current];

  return (
    <section className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-white">

      {/* ── 70% IZQUIERDA: IMAGEN INMERSIVA ── */}
      {/* En móvil ocupa 60% del alto, en desktop 70% del ancho */}
      <div className="relative w-full h-[60vh] md:w-[70%] md:h-full overflow-hidden bg-stone-100">
        <img
          key={s.id + '-img'}
          src={s.image}
          alt={s.tag}
          className={`w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${
            animating ? 'scale-105 opacity-80' : 'scale-100 opacity-100'
          }`}
        />
        {/* Overlay sutil para dar dramatismo a la foto */}
        <div className="absolute inset-0 bg-black/10 transition-opacity duration-1000" />

        {/* Indicador de Pagina (Minimalista) */}
        <div
                   className="absolute bottom-8 left-8 text-white/90 text-[10px] tracking-[0.3em] font-medium"
        >
          {String(current + 1).padStart(2, '0')} — {String(slides.length).padStart(2, '0')}
        </div>
      </div>

      {/* ── 30% DERECHA: TEXTO EDITORIAL ── */}
      {/* En móvil toma el resto del espacio, en desktop 30% del ancho */}
      <div 
        style={{ background: 'var(--color-bg)' }}
        className="w-full flex-1 md:w-[30%] md:h-full flex flex-col justify-center px-8 sm:px-12 md:px-10 lg:px-14 relative z-10"
      >
        <div
          key={s.id + '-text'}
          className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col ${
            animating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Etiqueta Superior */}
          <p
            style={{ letterSpacing: '0.3em' }}
            className="text-[9px] font-semibold text-stone-500 uppercase mb-8"
          >
            {s.tag}
          </p>

          {/* Titular en MAYÚSCULAS */}
          <h1
                       className="text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl font-light text-stone-900 leading-[1.05] uppercase tracking-wide mb-8"
          >
            {s.headline.map((line, i) => (
              <span key={i} className="block">
                {i === s.headline.length - 1
                  ? <strong className="font-bold">{line}</strong>
                  : line}
              </span>
            ))}
          </h1>

          {/* Subtexto en MAYÚSCULAS (pero más pequeño) */}
          <p
            style={{ letterSpacing: '0.1em' }}
            className="text-stone-600 text-[9px] sm:text-[10px] font-medium uppercase leading-relaxed max-w-[280px] mb-12 opacity-80"
          >
            {s.sub}
          </p>

          {/* Botón Minimalista (Tipo Alta Costura) */}
          <div>
            <a
              href={s.href}
              style={{ letterSpacing: '0.25em' }}
              className="inline-flex items-center text-[10px] font-bold text-stone-900 uppercase border-b border-stone-900 pb-1.5 hover:text-stone-500 hover:border-stone-500 transition-all duration-300 group"
            >
              {s.cta}
              <span className="ml-3 transform transition-transform duration-300 group-hover:translate-x-2">→</span>
            </a>
          </div>
        </div>

        {/* ── CONTROLES DE NAVEGACIÓN ── */}
        <div className="absolute bottom-8 right-8 md:right-12 flex gap-4">
          <button
            onClick={prev}
            className="w-10 h-10 flex items-center justify-center border border-stone-300 rounded-full text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300"
            aria-label="Anterior"
          >
            <span className="text-sm font-light">←</span>
          </button>
          <button
            onClick={next}
            className="w-10 h-10 flex items-center justify-center border border-stone-300 rounded-full text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300"
            aria-label="Siguiente"
          >
            <span className="text-sm font-light">→</span>
          </button>
        </div>

      </div>
    </section>
  );
}