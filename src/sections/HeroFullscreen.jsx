import { heroImage } from '../utils/imageUrl';
import { useCarousel } from '../hooks/useCarousel';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=70&fm=webp&auto=format',
    tag: 'Nueva Colección',
    headline: ['El lujo de', 'sentirte', 'tú.'],
    sub: 'Descubre nuestra nueva colección diseñada para mujeres que buscan estilo, rendimiento y exclusividad.',
    cta: 'Explorar colección',
    href: '#catalogo',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=70&fm=webp&auto=format',
    tag: 'Temporada 2026',
    headline: ['Fuerza &', 'Elegancia', 'pura.'],
    sub: 'Cada prenda diseñada para mujeres que no se detienen en su día a día.',
    cta: 'Explorar',
    href: '#catalogo',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=70&fm=webp&auto=format',
    tag: 'Best Sellers',
    headline: ['Descubre', 'tu mejor', 'versión.'],
    sub: 'Las piezas favoritas de nuestra comunidad. Ediciones estrictamente limitadas.',
    cta: 'Descubrir colección',
    href: '#catalogo',
  },
];

export default function HeroFullscreen() {
  const { current, animating, next, prev } = useCarousel(slides.length, 6000, 800);
  const s = slides[current];

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      
      {/* ── IMÁGENES CON EFECTO KEN BURNS (Zoom Lento) ── */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={heroImage(slide.image)}
            alt={slide.tag}
            // El 'scale-105' en hover o animado da esa sensación de que la foto respira
            className={`w-full h-full object-cover origin-center transition-transform duration-[6000ms] ease-linear ${
              index === current ? 'scale-105' : 'scale-100'
            }`}
          />
        </div>
      ))}

      {/* ── TEXT PROTECTION (Gradiente) ── */}
      {/* Esto oscurece solo la parte de abajo para que el texto blanco resalte siempre */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      
      {/* Overlay adicional muy sutil para igualar tonos */}
      <div className="absolute inset-0 z-10 bg-black/10 pointer-events-none" />

      {/* ── CONTENIDO DEL TEXTO (Anclado abajo a la izquierda) ── */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 md:pb-20 lg:pb-24 px-8 sm:px-12 md:px-16 lg:px-24">
        <div
          key={s.id + '-text'}
          className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
            animating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Tag */}
          <p
            style={{ letterSpacing: '0.3em' }}
            className="text-[10px] font-semibold text-white/80 uppercase mb-4"
          >
            {s.tag}
          </p>

          {/* Titular */}
          <h1
                       className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light text-white leading-[1.05] uppercase tracking-wide mb-6 drop-shadow-lg"
          >
            {s.headline.map((line, i) => (
              <span key={i} className="block">
                {i === s.headline.length - 1
                  ? <strong className="font-semibold text-white">{line}</strong>
                  : line}
              </span>
            ))}
          </h1>

          {/* Subtexto */}
          <p
            style={{ letterSpacing: '0.15em' }}
            className="text-white/80 text-[10px] sm:text-[11px] font-medium uppercase leading-relaxed max-w-md mb-10 drop-shadow-md"
          >
            {s.sub}
          </p>

          {/* Botón */}
          <a
            href={s.href}
            style={{ letterSpacing: '0.25em' }}
            className="inline-flex items-center text-[11px] font-bold text-white uppercase border-b border-white pb-2 hover:text-stone-300 hover:border-stone-300 transition-all duration-300 group"
          >
            {s.cta}
            <span className="ml-4 transform transition-transform duration-300 group-hover:translate-x-3">→</span>
          </a>

          {/* Línea de confianza (DEBE IR AQUÍ, FUERA) */}
          <p
            style={{ letterSpacing: '0.2em' }}
            className="text-white/40 text-[8px] sm:text-[9px] mt-5 tracking-[0.25em]"
          >
            Envíos a todo el país  -  Piezas limitadas
          </p>
        </div>
      </div>

      {/* ── CONTROLES Y PAGINACIÓN ── */}
      <div className="absolute bottom-10 right-8 md:right-16 z-20 flex items-center gap-8">
        {/* Paginación */}
        <div
                   className="text-white/90 text-[11px] tracking-[0.3em] font-medium hidden sm:block"
        >
          {String(current + 1).padStart(2, '0')} — {String(slides.length).padStart(2, '0')}
        </div>

        {/* Flechas */}
        {/* Flechas Rediseñadas (Premium, Delicadas, Trazo Fino) */}
        <div className="flex gap-3">
          {/* Botón Anterior */}
          <button
            onClick={prev}
            className="w-12 h-12 flex items-center justify-center border border-white/20 rounded-full text-white/70 hover:bg-white hover:text-black hover:border-white transition-all duration-500 backdrop-blur-sm group"
            aria-label="Anterior"
          >
            {/* Icono SVG Delicado ← */}
            <svg 
              width="18" height="18" viewBox="0 0 24 24" fill="none" 
              className="transform transition-transform duration-300 group-hover:-translate-x-1"
            >
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {/* Botón Siguiente */}
          <button
            onClick={next}
            className="w-12 h-12 flex items-center justify-center border border-white/20 rounded-full text-white/70 hover:bg-white hover:text-black hover:border-white transition-all duration-500 backdrop-blur-sm group"
            aria-label="Siguiente"
          >
            {/* Icono SVG Delicado → */}
            <svg 
              width="18" height="18" viewBox="0 0 24 24" fill="none" 
              className="transform transition-transform duration-300 group-hover:translate-x-1"
            >
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

    </section>
  );
}