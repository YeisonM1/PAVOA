import React, { useState, useEffect } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productosDB } from '../data/db'; // Leemos nuestra base de datos

export default function SearchOverlay({ isSearchOpen, setIsSearchOpen }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);

  // Efecto para buscar en tiempo real mientras el usuario escribe
  useEffect(() => {
    if (query.trim().length > 0) {
      const filtrados = productosDB.filter(p => 
        p.nombre.toLowerCase().includes(query.toLowerCase()) || 
        p.descripcion.toLowerCase().includes(query.toLowerCase())
      );
      setResultados(filtrados);
    } else {
      setResultados([]);
    }
  }, [query]);

  // Bloquear scroll de la página de fondo
  useEffect(() => {
    document.body.style.overflow = isSearchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSearchOpen]);

  const cerrarBuscador = () => {
    setIsSearchOpen(false);
    setQuery(''); // Limpiamos la búsqueda al cerrar
  };

  return (
    <div 
      className={`fixed inset-0 z-[80] bg-white/95 backdrop-blur-md transition-all duration-500 flex flex-col
        ${isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
    >
      {/* Cabecera del buscador */}
      <div className="flex items-center justify-between px-6 md:px-16 py-8">
        <div className="w-8" /> {/* Espaciador para centrar */}
        <span className="text-[10px] font-bold tracking-[0.3em] text-stone-900 uppercase">Búsqueda</span>
        <button onClick={cerrarBuscador} className="text-stone-900 hover:scale-110 transition-transform">
          <X size={28} strokeWidth={1} />
        </button>
      </div>

      {/* Input Gigante */}
      <div className="max-w-[800px] w-full mx-auto px-6 mt-10 md:mt-20">
        <div className="relative border-b-2 border-stone-200 focus-within:border-stone-900 transition-colors">
          <input 
            type="text" 
            placeholder="¿Qué estás buscando?" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-2xl md:text-4xl font-light text-stone-900 placeholder-stone-300 outline-none pb-4 tracking-[0.05em]"
            autoFocus={isSearchOpen}
          />
          <SearchIcon className="absolute right-0 bottom-4 text-stone-300" size={32} strokeWidth={1} />
        </div>

        {/* Resultados en tiempo real */}
        <div className="mt-12 h-[50vh] overflow-y-auto pr-2">
          {query.length > 0 && resultados.length === 0 && (
            <p className="text-stone-400 tracking-[0.1em] uppercase text-[11px]">No se encontraron piezas con "{query}"</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resultados.map(producto => (
              <Link 
                to={`/producto/${producto.id}`} 
                key={producto.id}
                onClick={cerrarBuscador}
                className="flex items-center gap-6 group"
              >
                <div className="w-20 h-24 bg-stone-100 overflow-hidden flex-shrink-0">
                  <img src={producto.imagen1} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold tracking-[0.15em] text-stone-900 uppercase mb-2 group-hover:text-stone-500 transition-colors">{producto.nombre}</h4>
                  <p className="text-[12px] text-stone-600">{producto.precio}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}