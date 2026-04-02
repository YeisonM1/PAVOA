const productos = [
  {
    id: 1,
    nombre: 'Conjunto Éter',
    precio: '$280.000',
    imagen1: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80',
    tag: 'Nuevo',
  },
  {
    id: 2,
    nombre: 'Conjunto Nómada',
    precio: '$360.000',
    imagen1: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=600&q=80',
    tag: null,
  },
  {
    id: 3,
    nombre: 'Conjunto Ónix',
    precio: '$290.000',
    imagen1: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80',
    tag: 'Más vendido',
  },
  {
    id: 4,
    nombre: 'Conjunto Vértice',
    precio: '$280.000',
    imagen1: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
    imagen2: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
    tag: null,
  },
];

function ProductCard({ producto }) {
  return (
    <div className="group cursor-pointer">
      {/* Imagen con hover */}
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>
        {/* Tag */}
        {producto.tag && (
          <span
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.15em' }}
            className="absolute top-4 left-4 z-10 text-[9px] font-semibold text-white bg-stone-900 px-3 py-1.5"
          >
            {producto.tag.toUpperCase()}
          </span>
        )}

        {/* Imagen principal */}
        <img
          src={producto.imagen1}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out group-hover:opacity-0"
        />

        {/* Imagen hover */}
        <img
          src={producto.imagen2}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100"
        />

        {/* Botón agregar — sube en hover */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <button
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
            className="w-full text-[10px] font-semibold text-stone-900 bg-white py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out hover:bg-stone-100"
          >
            AGREGAR AL CARRITO
          </button>
        </div>
      </div>

      {/* Info del producto */}
      <div className="mt-4 flex items-start justify-between">
        <p
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-[12px] font-medium text-stone-800 tracking-wide"
        >
          {producto.nombre}
        </p>
        <p
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-[12px] font-light text-stone-500"
        >
          {producto.precio}
        </p>
      </div>
    </div>
  );
}

export default function Productos() {
  return (
    <section className="w-full bg-white pt-10 pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">

        {/* Título */}
        <div className="flex items-end justify-between mb-10">
          <h2
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            className="text-2xl md:text-3xl font-light text-stone-900 tracking-widest"
          >
            DESTACADOS
          </h2>
          <a
            href="#catalogo"
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.15em' }}
            className="text-[10px] font-medium text-stone-400 hover:text-stone-900 transition-colors border-b border-stone-300 pb-0.5"
          >
            VER TODO
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {productos.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>

      </div>
    </section>
  );
}