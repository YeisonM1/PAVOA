import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const FAQS = [
  {
    q: 'Como se cuanto tarda mi pedido?',
    a: 'Al despachar tu compra te enviamos la guia para rastreo. El tiempo depende de la ciudad destino.',
  },
  {
    q: 'Puedo cambiar la talla?',
    a: 'Si, siempre que la prenda cumpla condiciones de cambio y lo solicites dentro del plazo.',
  },
  {
    q: 'Que pasa si mi producto llega con novedad?',
    a: 'Te ayudamos a gestionarlo de inmediato. Escribenos con fotos y numero de pedido.',
  },
  {
    q: 'Tienen atencion personalizada?',
    a: 'Si. Te orientamos por contacto para talla, uso y disponibilidad.',
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Preguntas frecuentes"
        description="Resuelve dudas comunes sobre compras, envios, tallas y cambios en PAVOA."
        url="/preguntas-frecuentes"
      />

      <section className="w-full pt-[140px] md:pt-[160px] pb-8 md:pb-12 px-6 border-b border-stone-100" style={{ background: 'var(--color-ivory)' }}>
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Preguntas frecuentes</span>
            </span>
          </nav>
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">Ayuda</span>
          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase">Preguntas frecuentes</h1>
          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      <section className="w-full py-10 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1000px] mx-auto grid gap-4">
          {FAQS.map((item) => (
            <article key={item.q} className="border border-stone-100 p-7 md:p-9">
              <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">{item.q}</h2>
              <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">{item.a}</p>
            </article>
          ))}
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">No encuentras tu respuesta?</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Escribenos desde
              {' '}<Link to="/contacto" className="text-stone-900 border-b border-stone-900">Contacto</Link>
              {' '}y te respondemos en menos de 24 horas habiles.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
