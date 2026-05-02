import React, { useState, useEffect, useRef } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProductos } from '../services/productService';

export default function SearchOverlay({ isSearchOpen, setIsSearchOpen }) {
  const [query, setQuery]           = useState('');
  const [resultados, setResultados] = useState([]);
  const [productos, setProductos]   = useState([]);
  const inputRef                    = useRef(null);
  const panelRef                    = useRef(null);

  // Focus trap
  useEffect(() => {
    if (!isSearchOpen || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e) => {
      if (e.key === 'Escape') { setIsSearchOpen(false); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [isSearchOpen, setIsSearchOpen, resultados]);

  // Cargar productos al abrir
  useEffect(() => {
    if (isSearchOpen && productos.length === 0) {
      getProductos().then(data => setProductos(data));
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      const filtrados = productos.filter(p =>
        p.nombre?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q) ||
        p.categoria?.toLowerCase().includes(q)
      );
      setResultados(filtrados);
    } else {
      setResultados([]);
    }
  }, [query]);

  // Focus automático al abrir
  useEffect(() => {
    if (isSearchOpen) setTimeout(() => inputRef.current?.focus(), 300);
    else setQuery('');
  }, [isSearchOpen]);

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = isSearchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSearchOpen]);

  const cerrar = () => setIsSearchOpen(false);

  return (
    <>
      {/* ── Overlay oscuro de fondo ── */}
      <div
        onClick={cerrar}
        className={`fixed inset-0 z-[79] bg-black/30 backdrop-blur-sm transition-opacity duration-500
          ${isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── Panel lateral derecho ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Buscador"
        className={`fixed top-0 right-0 h-full w-full max-w-[480px] z-[80] bg-white flex flex-col
        transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${isSearchOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
          <span className="text-[10px] font-bold tracking-[0.3em] text-stone-900 uppercase">Búsqueda</span>
          <button onClick={cerrar} aria-label="Cerrar buscador"
            className="text-stone-400 hover:text-stone-900 transition-colors">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Input */}
        <div className="px-8 py-6 border-b border-stone-100">
          <div className="relative flex items-center gap-3">
            <SearchIcon size={16} strokeWidth={1.5} className="text-stone-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="¿Qué estás buscando?"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-transparent text-[13px] text-stone-900 placeholder-stone-300 outline-none tracking-[0.05em]"
            />
            {query.length > 0 && (
              <button onClick={() => setQuery('')} className="text-stone-300 hover:text-stone-600 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* Sin búsqueda — sugerencias */}
          {query.length === 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] text-stone-700 uppercase mb-4">
                Tendencias
              </p>
              <div className="flex flex-wrap gap-2">
                {['Enterizos', 'Sets', 'Faldas'].map(s => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="min-h-11 text-[10px] tracking-[0.1em] uppercase border border-stone-200 px-4 py-2 text-stone-700 hover:border-stone-900 hover:text-stone-900 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sin resultados */}
          {query.length > 0 && resultados.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-[11px] tracking-[0.1em] text-stone-400 uppercase text-center">
                No encontramos piezas con
              </p>
              <p className="text-[13px] font-medium text-stone-700">"{query}"</p>
            </div>
          )}

          {/* Con resultados */}
          {resultados.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] text-stone-700 uppercase mb-6">
                {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
              </p>
              <div className="flex flex-col gap-1">
                {resultados.map(producto => (
                  <Link
                    to={`/producto/${producto.id}`}
                    key={producto.id}
                    onClick={cerrar}
                    className="flex items-center gap-5 py-4 border-b border-stone-50 group hover:bg-stone-50 -mx-3 px-3 transition-colors duration-200"
                  >
                    {/* Imagen */}
                    <div className="w-16 h-20 bg-stone-100 overflow-hidden flex-shrink-0">
                      <img
                        src={producto.imagen1}
                        alt={producto.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold tracking-[0.15em] text-stone-900 uppercase mb-1.5 group-hover:text-stone-500 transition-colors truncate">
                        {producto.nombre}
                      </h4>
                      <p className="text-[12px] text-stone-500">{producto.precio}</p>
                    </div>

                    {/* Flecha */}
                    <span className="text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1 transition-all duration-200 text-[12px]">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
