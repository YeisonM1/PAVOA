import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ producto }) {
  const [showMobileSizes, setShowMobileSizes] = useState(false);

  const tallas = (() => {
    if (!producto?.tallas) return [];
    try { return JSON.parse(producto.tallas); }
    catch { return []; }
  })();

  const esTallaUnica = tallas.length === 1 && tallas[0] === 'ÚNICA';
  const tieneTallas  = tallas.length > 0;

  return (
    <Link
      to={`/producto/${producto.id}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group cursor-pointer flex flex-col gap-4 w-full flex-shrink-0 snap-center relative block"
    >
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>

        {producto.tag && (
          <span
            style={{ fontFamily: 'var(--font-primary)' }}
            className="absolute top-4 left-4 z-30 text-[8px] font-bold text-white bg-stone-900 px-3 py-1.5 uppercase tracking-[0.15em]"
          >
            {producto.tag}
          </span>
        )}

        <img
          src={producto.imagen1}
          alt={producto.nombre}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105"
        />
        {producto.imagen2 && (
          <img
            src={producto.imagen2}
            alt={producto.nombre}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-0 md:group-hover:opacity-100 md:group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none" />

        {/* Botón "+" móvil */}
        {tieneTallas && !esTallaUnica && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMobileSizes(true); }}
            className="md:hidden absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-30 text-stone-900"
            aria-label="Ver tallas disponibles"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}

        {/* Overlay oscuro móvil */}
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMobileSizes(false); }}
          className={`md:hidden absolute inset-0 bg-black/20 z-30 transition-opacity duration-300 ${
            showMobileSizes ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Panel de tallas — solo informativo */}
        {tieneTallas && (
          <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
            md:translate-y-full md:group-hover:translate-y-0
            ${showMobileSizes ? 'translate-y-0' : 'translate-y-full'}
          `}>
            <div className="bg-white/80 backdrop-blur-md pt-5 pb-6 px-4 border-t border-white/40 flex flex-col items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              {esTallaUnica ? (
                <>
                  <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] font-bold tracking-[0.25em] text-stone-400 uppercase">
                    Talla disponible
                  </span>
                  <div className="px-6 h-10 flex items-center justify-center text-[11px] font-medium text-stone-400 border border-stone-200 bg-stone-50 cursor-default select-none tracking-[0.1em]">
                    TALLA ÚNICA
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] font-bold tracking-[0.25em] text-stone-800 uppercase">
                    Seleccionar Talla
                  </span>
                  <div className="flex gap-2 w-full justify-center">
                    {tallas.map(talla => (
                      <span
                        key={talla}
                        style={{ fontFamily: 'var(--font-primary)' }}
                        className="w-10 h-10 flex items-center justify-center text-[11px] font-medium text-stone-700 border border-stone-300/60 bg-white/60 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300 cursor-pointer"
                      >
                        {talla}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[8px] tracking-[0.2em] text-stone-400 uppercase">
                    Ver producto →
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col items-center text-center">
        <h3 style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] font-bold text-stone-900 tracking-[0.15em] uppercase">
          {producto.nombre}
        </h3>
        <div className="h-[24px] overflow-hidden mt-1.5">
          <p style={{ fontFamily: 'var(--font-primary)' }} className="text-[13px] font-semibold text-stone-500 transform translate-y-0 opacity-100 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">
            {producto.precio}
          </p>
        </div>
      </div>
    </Link>
  );
}