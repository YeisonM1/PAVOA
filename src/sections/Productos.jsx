import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom'; // ── NUEVO: Para navegar a la página individual
import { CartContext } from '../App';
import { productosDB } from '../data/db'; // ── NUEVO: Importamos nuestra base de datos

// ── COMPONENTE DE LA TARJETA ──
function ProductCard({ producto }) {
  const [showMobileSizes, setShowMobileSizes] = useState(false);
  const { addToCart } = useContext(CartContext);
  const [addingSize, setAddingSize] = useState(null);

  const handleSizeClick = (e, talla) => {
    e.preventDefault(); // Evita que el Link nos lleve a otra página al dar clic a la talla
    e.stopPropagation(); 
    setAddingSize(talla);
    addToCart();
    setTimeout(() => {
      setAddingSize(null);
      setShowMobileSizes(false);
    }, 1000);
  };

  return (
    // ── NUEVO: Envolvemos todo en un Link dinámico hacia /producto/:id ──
    <Link 
      to={`/producto/${producto.id}`} 
      className="group cursor-pointer flex flex-col gap-4 w-[75vw] sm:w-[45vw] md:w-full flex-shrink-0 snap-center relative block"
    >
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>
        
        {producto.tag && (
          <span style={{ fontFamily: 'var(--font-primary)' }} className="absolute top-4 left-4 z-30 text-[8px] font-bold text-white bg-stone-900 px-3 py-1.5 uppercase tracking-[0.15em]">
            {producto.tag}
          </span>
        )}

        <img src={producto.imagen1} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105" />
        <img src={producto.imagen2} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-0 md:group-hover:opacity-100 md:group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none" />

        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMobileSizes(true); }} 
          className="md:hidden absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-30 text-stone-900"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>

        <div 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMobileSizes(false); }} 
          className={`md:hidden absolute inset-0 bg-black/20 z-30 transition-opacity duration-300 ${showMobileSizes ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        />

        <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:translate-y-full md:group-hover:translate-y-0 ${showMobileSizes ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="bg-white/80 backdrop-blur-md pt-5 pb-6 px-4 border-t border-white/40 flex flex-col items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] font-bold tracking-[0.25em] text-stone-800 uppercase">Seleccionar Talla</span>
            <div className="flex gap-2 w-full justify-center">
              {['S', 'M', 'L'].map(talla => {
                const isAdding = addingSize === talla;
                return (
                  <button 
                    key={talla} 
                    onClick={(e) => handleSizeClick(e, talla)}
                    style={{ fontFamily: 'var(--font-primary)' }} 
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
    </Link>
  );
}

// ── COMPONENTE PRINCIPAL (SECCIÓN DEL HOME) ──
export default function Productos() {
  return (
    <section className="w-full bg-white py-24 px-6 md:px-12 lg:px-16 overflow-hidden relative" id="catalogo">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-12 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] text-stone-500 tracking-[0.3em] uppercase font-medium">Lo más buscado</span>
            <h2 style={{ fontFamily: 'var(--font-primary)' }} className="text-lg md:text-xl font-light text-stone-900 tracking-[0.2em] uppercase">
              TU SEGUNDA <strong className="font-bold">PIEL</strong>
            </h2>
          </div>
          <Link to="/categoria" style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }} className="text-[10px] font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase flex items-center gap-2 group">
            Ver todo
            <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="flex overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          
          {/* ── NUEVO: Hacemos el map usando los datos de nuestra base de datos central ── */}
          {productosDB.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
          
          <div className="w-[10vw] md:hidden flex-shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}