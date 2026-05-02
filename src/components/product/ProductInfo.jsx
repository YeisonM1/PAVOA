import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductInfo({ producto }) {
  const { isWished, toggle } = useWishlist();

  return (
    <>
      <nav aria-label="Ruta de navegación" className="mb-5 md:mb-8">
        <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex flex-wrap items-center">
          <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
          <span className="mx-2">/</span>
          <Link to="/categoria" className="hover:text-stone-900 transition-colors">Catálogo</Link>
          <span className="mx-2">/</span>
          {producto.categoria && (
            <>
              <Link to={`/categoria/${producto.categoria.toLowerCase()}`} className="hover:text-stone-900 transition-colors">
                {producto.categoria}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-stone-900 font-bold">{producto.nombre}</span>
        </span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-3 md:mb-4">
        {producto.nombre}
      </h1>
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <p className="text-sm md:text-base font-medium text-stone-600 tracking-[0.1em]">
          {producto.precio}
        </p>
        <button
          onClick={() => toggle(producto.id)}
          className="text-stone-300 hover:text-stone-900 transition-colors"
          aria-label={isWished(producto.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isWished(producto.id) ? '#0B0B0B' : 'none'} stroke={isWished(producto.id) ? '#0B0B0B' : 'currentColor'} strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="text-[12px] md:text-[13px] text-stone-600 tracking-[0.1em] leading-loose mb-6 md:mb-12 uppercase flex flex-col gap-3">
        {producto.descripcion?.split('.').filter(s => s.trim()).map((oracion, i) => (
          <p key={i}>{oracion.trim()}.</p>
        ))}
      </div>
    </>
  );
}
