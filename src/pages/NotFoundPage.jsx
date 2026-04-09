import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <SEO
        title="Página no encontrada"
        description="Esta página no existe."
        url="/404"
      />

      <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-stone-400 mb-6">
        404
      </p>

      <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4 text-center">
        Página no encontrada
      </h1>

      <p className="text-[12px] text-stone-400 tracking-[0.15em] uppercase text-center mb-12 max-w-xs">
        Esta pieza no existe — pero hay otras que te esperan.
      </p>

      <Link
        to="/categoria"
        className="h-12 px-10 bg-stone-900 text-white text-[10px] font-bold tracking-[0.25em] uppercase flex items-center justify-center hover:bg-stone-800 transition-colors duration-300"
      >
        Ver catálogo
      </Link>
    </div>
  );
}