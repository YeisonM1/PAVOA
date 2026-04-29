import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { productImage } from '../utils/imageUrl';
import { useWishlist } from '../context/WishlistContext';

const HeartIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#0B0B0B' : 'none'} stroke={filled ? '#0B0B0B' : 'currentColor'} strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

function ProductCard({ producto, onQuickView }) {
  const [showMobileSizes, setShowMobileSizes] = useState(false);
  const { isWished, toggle } = useWishlist();

  // ── Leer variantes ──────────────────────────────────────
  const variantes = (() => {
    if (!producto?.variantes) return [];
    try {
      const parsed = typeof producto.variantes === 'string'
        ? JSON.parse(producto.variantes)
        : producto.variantes;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  // Tallas únicas extraídas de variantes
  const tallas = [...new Set(variantes.map(v => v.talla))];
  const esTallaUnica = tallas.length === 1 && tallas[0] === 'ÚNICA';
  const tieneTallas  = tallas.length > 0;
  const totalStock   = variantes.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  const pocasUnidades = totalStock > 0 && totalStock <= 3;

  // Colores únicos por hex (solo si hay 2+)
  const coloresUnicos = [...new Map(variantes.map(v => [v.hex, v.hex])).values()];
  const mostrarColores = coloresUnicos.length >= 2;
  // ────────────────────────────────────────────────────────

  return (
    <Link
      to={`/producto/${producto.id}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group cursor-pointer flex flex-col gap-4 w-full flex-shrink-0 snap-center relative block overflow-hidden isolate"
    >
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>

        {producto.tag && (
          <span className="absolute top-4 left-4 z-30 text-[8px] font-bold text-white bg-stone-900 px-3 py-1.5 uppercase tracking-[0.15em]">
            {producto.tag}
          </span>
        )}
        {totalStock === 0 ? (
          <span className="absolute top-4 right-4 z-30 text-[8px] font-bold text-white bg-stone-500 px-3 py-1.5 uppercase tracking-[0.15em]">
            Agotado
          </span>
        ) : pocasUnidades ? (
          <span className="absolute top-4 right-4 z-30 text-[8px] font-bold text-white bg-amber-700 px-3 py-1.5 uppercase tracking-[0.15em]">
            Últimas {totalStock}
          </span>
        ) : null}

        {onQuickView && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(producto.id); }}
            className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm text-stone-900 text-[9px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 hover:bg-white whitespace-nowrap"
            aria-label="Vista rápida"
          >
            Vista rápida
          </button>
        )}

        <img
          src={productImage(producto.imagen1)}
          alt={producto.nombre}
          width={600} height={800}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105"
        />
        {producto.imagen2 && (
          <img
            src={productImage(producto.imagen2)}
            alt={producto.nombre}
            width={600} height={800}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-0 md:group-hover:opacity-100 md:group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none" />

        {/* Botón "+" móvil */}
        {tieneTallas && !esTallaUnica && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMobileSizes(true); }}
            className="lg:hidden absolute bottom-3 right-3 w-11 h-11 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-30 text-stone-900"
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
          className={`lg:hidden absolute inset-0 bg-black/20 z-30 transition-opacity duration-300 ${
            showMobileSizes ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Panel de tallas */}
        {tieneTallas && (
          <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
            lg:translate-y-full lg:group-hover:translate-y-0  
            ${showMobileSizes ? 'translate-y-0' : 'translate-y-full'}
          `}>
            <div className="bg-white/80 backdrop-blur-md pt-5 pb-6 px-4 border-t border-white/40 flex flex-col items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              {esTallaUnica ? (
                <>
                  <span className="text-[9px] font-bold tracking-[0.25em] text-stone-400 uppercase">Talla disponible</span>
                  <div className="px-6 h-10 flex items-center justify-center text-[11px] font-medium text-stone-400 border border-stone-200 bg-stone-50 cursor-default select-none tracking-[0.1em]">
                    TALLA ÚNICA
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[9px] font-bold tracking-[0.25em] text-stone-800 uppercase">Seleccionar Talla</span>
                  <div className="flex gap-2 w-full justify-center">
                    {tallas.map(talla => (
                      <span
                        key={talla}
                        className="w-10 h-10 flex items-center justify-center text-[11px] font-medium text-stone-700 border border-stone-300/60 bg-white/60 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300 cursor-pointer"
                      >
                        {talla}
                      </span>
                    ))}
                  </div>
                  <span className="text-[8px] tracking-[0.2em] text-stone-400 uppercase">Ver producto →</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col items-center text-center relative">
        <h3 className="text-[11px] font-bold text-stone-900 tracking-[0.15em] uppercase pr-5">
          {producto.nombre}
        </h3>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(producto.id); }}
          className="absolute top-0 right-0 text-stone-300 hover:text-stone-900 transition-colors"
          aria-label={isWished(producto.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <HeartIcon filled={isWished(producto.id)} />
        </button>
        {mostrarColores && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {coloresUnicos.slice(0, 7).map((hex) => (
              <span
                key={hex}
                className="w-3 h-3 rounded-full border border-stone-200 flex-shrink-0"
                style={{ backgroundColor: hex }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        <div className="h-[24px] overflow-hidden mt-1.5">
          <p className="text-[13px] font-semibold text-stone-500 transform translate-y-0 opacity-100 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">
            {producto.precio}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default React.memo(ProductCard);