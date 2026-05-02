import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const MEDIDAS = [
  { zona: 'Busto', detalle: 'Mide alrededor de la parte mas llena del busto.' },
  { zona: 'Cintura', detalle: 'Mide la parte mas estrecha del torso.' },
  { zona: 'Cadera', detalle: 'Mide alrededor de la parte mas ancha de la cadera.' },
];

export default function GuiaTallasPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Guia de tallas"
        description="Encuentra tu talla ideal en PAVOA."
        url="/guia-de-tallas"
      />

      <section className="w-full pt-[140px] md:pt-[160px] pb-8 md:pb-12 px-6 border-b border-stone-100" style={{ background: 'var(--color-ivory)' }}>
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Guia de tallas</span>
            </span>
          </nav>
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">Ayuda</span>
          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase">Guia de tallas</h1>
          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      <section className="w-full py-10 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1000px] mx-auto grid gap-8">
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Como medirte</h2>
            <div className="grid gap-4">
              {MEDIDAS.map((item) => (
                <div key={item.zona} className="border border-stone-100 p-4">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-900 mb-2">{item.zona}</p>
                  <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">{item.detalle}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Recomendacion</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Si estas entre dos tallas, elige segun tu ajuste preferido: mas firme para entrenamiento o mas relajado para uso diario.
            </p>
          </article>
          <article className="border border-stone-100 p-7 md:p-9">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">Te asesoramos</h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
              Si tienes duda con una referencia puntual, escribenos por
              {' '}<Link to="/contacto" className="text-stone-900 border-b border-stone-900">Contacto</Link>.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
