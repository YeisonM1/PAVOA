import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function CambiosDevolucionesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Cambios y devoluciones"
        description="Politica de cambios y devoluciones de PAVOA."
        url="/cambios-y-devoluciones"
      />

      <section className="w-full pt-[140px] md:pt-[160px] pb-8 md:pb-12 px-6 border-b border-stone-100" style={{ background: 'var(--color-ivory)' }}>
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Cambios y devoluciones</span>
            </span>
          </nav>
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">Ayuda</span>
          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase">Cambios y devoluciones</h1>
          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      <section className="w-full py-10 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1000px] mx-auto grid gap-8">
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Plazo para solicitar</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Puedes solicitar cambio o devolucion dentro de los primeros 5 dias habiles despues de recibir tu pedido.
            </p>
          </article>
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Condiciones</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              La prenda debe estar sin uso, limpia, con etiquetas y en su empaque original.
            </p>
          </article>
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Como gestionarlo</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Escribenos por
              {' '}<Link to="/contacto" className="text-stone-900 border-b border-stone-900">Contacto</Link>
              {' '}con numero de pedido, motivo y fotos del producto.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
