import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const BLOQUES = [
  {
    id: 'creemos',
    etiqueta: '01',
    titulo: 'Que creemos',
    texto: 'Placeholder: manifiesto corto de marca.',
  },
  {
    id: 'materializamos',
    etiqueta: '02',
    titulo: 'Como lo materializamos',
    texto: 'Placeholder: explicar proceso, criterio y estandar.',
  },
  {
    id: 'vestimos',
    etiqueta: '03',
    titulo: 'A quien vestimos',
    texto: 'Placeholder: describir perfil de mujer PAVOA.',
  },
  {
    id: 'vision',
    etiqueta: '04',
    titulo: 'Hacia donde vamos',
    texto: 'Placeholder: vision de marca en el tiempo.',
  },
];

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Nuestra Filosofia"
        description="Conoce la filosofia de PAVOA, su manifiesto, sus pilares y su vision."
        url="/nosotros"
      />

      <section
        className="w-full pt-[140px] md:pt-[160px] pb-10 md:pb-14 px-6 border-b border-stone-100"
        style={{ background: 'var(--color-ivory)' }}
      >
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Nosotros</span>
            </span>
          </nav>

          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">
            Filosofia PAVOA
          </span>

          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase max-w-4xl">
            Una marca con intencion, diseno y vision
          </h1>

          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      <section className="w-full py-12 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {BLOQUES.map((bloque) => (
            <article key={bloque.id} className="border border-stone-100 p-8 md:p-10">
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-4">
                {bloque.etiqueta}
              </p>
              <h2 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.08em] uppercase mb-4">
                {bloque.titulo}
              </h2>
              <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
                {bloque.texto}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full pb-16 md:pb-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto border border-stone-100 p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-3">
              Siguiente paso
            </p>
            <h3 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.08em] uppercase">
              Completar manifiesto y narrativa final
            </h3>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/categoria"
              className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1 hover:opacity-60 transition-opacity"
            >
              Explorar coleccion
            </Link>
            <Link
              to="/contacto"
              className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1 hover:opacity-60 transition-opacity"
            >
              Contacto
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
