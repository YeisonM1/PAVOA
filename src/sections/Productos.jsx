import React, { useState, useRef, useContext } from 'react'; // ── NUEVO: Importamos useRef
import { CartContext } from '../App';

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

// ── NUEVO: Recibimos la prop onAddToCart ──
function ProductCard({ producto }) {
  const [showMobileSizes, setShowMobileSizes] = useState(false);
  
  // ── NUEVO: Estados y Contexto ──
  const { addToCart } = useContext(CartContext);
  const [addingSize, setAddingSize] = useState(null); // Para saber qué talla se está agregando

  const handleSizeClick = (e, talla) => {
    e.stopPropagation(); // Evita que se abra el link del producto
    
    // 1. Mostrar check
    setAddingSize(talla);
    
    // 2. Sumar al carrito global
    addToCart();

    // 3. Quitar el check y cerrar panel (si está en móvil) después de 1 segundo
    setTimeout(() => {
      setAddingSize(null);
      setShowMobileSizes(false);
    }, 1000);
  };

  return (
    <div className="group cursor-pointer flex flex-col gap-4 w-[75vw] sm:w-[45vw] md:w-full flex-shrink-0 snap-center relative">
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>
        
        {producto.tag && (
          <span style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }} className="absolute top-4 left-4 z-30 text-[8px] font-bold text-white bg-stone-900 px-3 py-1.5 uppercase">
            {producto.tag}
          </span>
        )}

        <img src={producto.imagen1} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105" />
        <img src={producto.imagen2} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-0 md:group-hover:opacity-100 md:group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none" />

        <button onClick={(e) => { e.stopPropagation(); setShowMobileSizes(true); }} className="md:hidden absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-30 text-stone-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>

        <div onClick={(e) => { e.stopPropagation(); setShowMobileSizes(false); }} className={`md:hidden absolute inset-0 bg-black/20 z-30 transition-opacity duration-300 ${showMobileSizes ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />

        <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:translate-y-full md:group-hover:translate-y-0 ${showMobileSizes ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="bg-white/80 backdrop-blur-md pt-5 pb-6 px-4 border-t border-white/40 flex flex-col items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] font-bold tracking-[0.25em] text-stone-800 uppercase">
              Seleccionar Talla
            </span>
            
            <div className="flex gap-2 w-full justify-center">
              {['S', 'M', 'L'].map(talla => {
                // Comprobamos si este es el botón que se está agregando
                const isAdding = addingSize === talla;
                
                return (
                  <button 
                    key={talla} 
                    onClick={(e) => handleSizeClick(e, talla)}
                    style={{ fontFamily: 'var(--font-primary)' }}
                    // ── NUEVO: Cambiamos las clases dinámicamente si se le da clic ──
                    className={`w-10 h-10 flex items-center justify-center text-[11px] font-medium transition-all duration-300
                      ${isAdding 
                        ? 'bg-stone-900 text-white border-stone-900 scale-105' 
                        : 'text-stone-700 border border-stone-300/60 bg-white/60 hover:bg-stone-900 hover:text-white hover:border-stone-900'
                      }
                    `}
                  >
                    {isAdding ? '✔' : talla}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <h3 style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] font-bold text-stone-900 tracking-[0.15em] uppercase">{producto.nombre}</h3>
        <div className="h-[24px] overflow-hidden mt-1.5">
          <p style={{ fontFamily: 'var(--font-primary)' }} className="text-[13px] font-semibold text-stone-500 transform translate-y-0 opacity-100 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">{producto.precio}</p>
        </div>
      </div>
    </div>
  );
}

export default function Productos() {
  // ── NUEVO: Estados y Referencias para la notificación (Toast) ──
  const [toast, setToast] = useState({ visible: false, mensaje: '' });
  const timerRef = useRef(null);

  const handleAddToCart = (producto, talla) => {
    // Si el usuario da varios clics rápido, limpiamos el temporizador anterior
    if (timerRef.current) clearTimeout(timerRef.current);

    // Mostramos la notificación con el nombre y talla
    setToast({
      visible: true,
      mensaje: `${producto.nombre} - T. ${talla} añadido a la bolsa`
    });

    // Lo ocultamos automáticamente a los 3 segundos
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <section className="w-full bg-white py-24 px-6 md:px-12 lg:px-16 overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto">

        <div className="flex items-end justify-between mb-12 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] text-stone-500 tracking-[0.3em] uppercase font-medium">
              Lo más buscado
            </span>
            <h2
              style={{ fontFamily: 'var(--font-primary)' }}
              className="text-lg md:text-xl font-light text-stone-900 tracking-[0.2em] uppercase"
            >
              TU SEGUNDA <strong className="font-bold">PIEL</strong>
            </h2>
          </div>
          
          <a
            href="#catalogo"
            style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }}
            className="text-[10px] font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase flex items-center gap-2 group"
          >
            Asegurar mi talla
            <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>

        <div 
          className="flex overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" 
          style={{ scrollbarWidth: 'none' }}
        >
          {productos.map((p) => (
            // ── NUEVO: Pasamos la función al componente hijo ──
            <ProductCard key={p.id} producto={p} onAddToCart={handleAddToCart} />
          ))}
          
          <div className="w-[10vw] md:hidden flex-shrink-0" aria-hidden="true" />
        </div>

      </div>

      {/* ── NUEVO: UI de la Notificación Flotante (Toast) Premium ── */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}
        `}
      >
        <div className="bg-stone-900/95 backdrop-blur-md text-white px-6 py-4 flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-stone-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[10px] font-medium tracking-[0.15em] uppercase">
            {toast.mensaje}
          </span>
        </div>
      </div>
    </section>
  );
}