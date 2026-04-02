const categorias = [
  {
    id: 1,
    nombre: 'Nueva Colección',
    desc: 'Lo más reciente',
    href: '#nueva-coleccion',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  },
  {
    id: 2,
    nombre: 'Vestidos',
    desc: 'Elegancia en movimiento',
    href: '#vestidos',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  },
  {
    id: 3,
    nombre: 'Accesorios',
    desc: 'Los detalles que marcan',
    href: '#accesorios',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
  },
];

export default function Categorias() {
  return (
    <section className="w-full bg-white py-20 px-6 md:px-12">

      {/* Título sección */}
      <div className="max-w-7xl mx-auto mb-10 flex items-end justify-between">
        <h2
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-2xl md:text-3xl font-light text-stone-900 tracking-widest"
        >
          COLECCIONES
        </h2>
        <a
          href="#catalogo"
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.15em' }}
          className="text-[10px] font-medium text-stone-400 hover:text-stone-900 transition-colors border-b border-stone-300 pb-0.5"
        >
          VER TODO
        </a>
      </div>

      {/* Grid de categorías */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {categorias.map((cat) => (
          <a
            key={cat.id}
            href={cat.href}
            className="group relative overflow-hidden block"
            style={{ aspectRatio: '3/4' }}
          >
            {/* Imagen con zoom en hover */}
            <img
              src={cat.image}
              alt={cat.nombre}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-500" />

            {/* Contenido inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-7 flex flex-col">
              {/* Nombre siempre visible */}
              <p
                style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
                className="text-[12px] font-semibold text-white mb-1"
              >
                {cat.nombre.toUpperCase()}
              </p>
              <p
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                className="text-[11px] font-light text-white/70"
              >
                {cat.desc}
              </p>

              {/* Botón que sube desde abajo en hover */}
              <div className="overflow-hidden mt-4">
                <span
                  style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
                  className="inline-block text-[10px] font-medium text-stone-900 bg-white px-6 py-3 translate-y-12 group-hover:translate-y-0 transition-transform duration-400 ease-out"
                >
                  VER MÁS
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}