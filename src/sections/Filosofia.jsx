import logoChampan from '../assets/Logo Champan.png';

export default function Filosofia() {
  return (
    <section className="w-full flex flex-col md:flex-row min-h-[80vh]">

      {/* IZQUIERDA — Texto */}
      <div className="w-full md:w-1/2 bg-stone-900 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-20 relative">

        {/* Logo Champan — arriba derecha del panel */}
        <div className="absolute top-8 right-8 md:top-10 md:right-10 pointer-events-none">
          <img src={logoChampan} alt="PAVOA" className="h-12 md:h-14 w-auto object-contain" />
        </div>

        {/* Tag */}
        <p
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.3em' }}
          className="text-[10px] font-medium text-stone-500 mb-8"
        >
          NUESTRA FILOSOFÍA
        </p>

        {/* Frase principal */}
        <h2
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-6"
        >
          No es ropa.
          <br />
          <span className="font-semibold">Es armadura.</span>
        </h2>

        {/* Línea decorativa */}
        <div className="w-12 h-[1px] bg-stone-600 mb-8" />

        {/* Subtexto */}
        <p
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-stone-400 text-sm font-light leading-relaxed max-w-sm mb-12"
        >
          Cada pieza de PAVOA nace de la convicción de que la mujer que se mueve con intención merece ropa que esté a su altura. Elegancia natural. Presencia silenciosa.
        </p>

        {/* CTA */}
        <a
          href="#nosotros"
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
          className="inline-block text-[11px] font-semibold text-stone-900 bg-white px-8 py-4 hover:bg-stone-100 transition-colors duration-300 w-fit"
        >
          SOBRE NOSOTROS
        </a>
      </div>

      {/* DERECHA — Imagen */}
      <div className="w-full md:w-1/2 relative overflow-hidden min-h-[50vh] md:min-h-full">
        <img
          src="https://cdn.shopify.com/s/files/1/0752/0436/2380/files/Filosofia.jpg?width=600&format=webp"
          alt="PAVOA Filosofía"
          className="w-full h-full object-cover absolute inset-0 hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Overlay sutil */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

    </section>
  );
}