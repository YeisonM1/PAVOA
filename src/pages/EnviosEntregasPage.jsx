import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function EnviosEntregasPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Envios y entregas"
        description="Informacion sobre tiempos, cobertura y condiciones de envio en PAVOA."
        url="/envios-y-entregas"
      />

      <section className="w-full pt-[140px] md:pt-[160px] pb-8 md:pb-12 px-6 border-b border-stone-100" style={{ background: 'var(--color-ivory)' }}>
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Envios y entregas</span>
            </span>
          </nav>
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">Ayuda</span>
          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase">Envios y entregas</h1>
          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      <section className="w-full py-10 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1000px] mx-auto grid gap-8">
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Cobertura</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Realizamos envios a las principales ciudades y municipios de Colombia.
            </p>
          </article>
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Tiempos estimados</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Ciudades principales: 2 a 5 dias habiles. Otras zonas: 3 a 8 dias habiles.
            </p>
          </article>
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Seguimiento y soporte</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Cuando tu pedido sea despachado, te compartimos la guia de seguimiento. Para apoyo, visita
              {' '}<Link to="/contacto" className="text-stone-900 border-b border-stone-900">Contacto</Link>.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
