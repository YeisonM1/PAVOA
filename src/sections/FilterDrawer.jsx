import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

// ── PROPS QUE RECIBE DESDE CategoriaPage:
// tallasDisponibles  → ["XS","S","M","L","XL"]
// coloresDisponibles → [{nombre:"Ónix", hex:"#1c1c1c"}, ...]
// tallasFiltro       → ["M","L"] (las seleccionadas)
// coloresFiltro      → ["Ónix"] (los seleccionados)
// onTallaChange      → función para toggle de talla
// onColorChange      → función para toggle de color
// onLimpiar          → función para limpiar todos los filtros
// totalFiltrados     → número de productos que coinciden

export default function FilterDrawer({
  isFilterOpen,
  setIsFilterOpen,
  tallasDisponibles  = [],
  coloresDisponibles = [],
  tallasFiltro       = [],
  coloresFiltro      = [],
  onTallaChange,
  onColorChange,
  onLimpiar,
  totalFiltrados     = 0,
}) {
  const [openSections, setOpenSections] = useState({ talla: true, color: true });
  const toggleSection = (s) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  const hayFiltrosActivos = tallasFiltro.length > 0 || coloresFiltro.length > 0;

  const FilterContent = () => (
    <div className="flex flex-col gap-8 w-full">

      {/* ── TALLAS ── */}
      {tallasDisponibles.length > 0 && (
        <div className="border-b border-stone-200/60 pb-6">
          <button
            onClick={() => toggleSection('talla')}
            className="flex items-center justify-between w-full text-left group cursor-pointer"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Talla</span>
            {openSections.talla
              ? <Minus size={14} className="text-stone-400 group-hover:text-stone-900" />
              : <Plus  size={14} className="text-stone-400 group-hover:text-stone-900" />}
          </button>

          <div className={`grid grid-cols-3 gap-2 mt-5 ${openSections.talla ? 'block' : 'hidden'}`}>
            {tallasDisponibles.map(talla => {
              const activa = tallasFiltro.includes(talla);
              return (
                <button
                  key={talla}
                  onClick={() => onTallaChange(talla)}
                  style={{ fontFamily: 'var(--font-primary)' }}
                  className={`h-9 flex items-center justify-center border text-[10px] font-medium transition-colors
                    ${activa
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900'
                    }`}
                >
                  {talla}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── COLORES ── */}
      {coloresDisponibles.length > 0 && (
        <div className="border-b border-stone-200/60 pb-6">
          <button
            onClick={() => toggleSection('color')}
            className="flex items-center justify-between w-full text-left group cursor-pointer"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Color</span>
            {openSections.color
              ? <Minus size={14} className="text-stone-400 group-hover:text-stone-900" />
              : <Plus  size={14} className="text-stone-400 group-hover:text-stone-900" />}
          </button>

          <div className={`flex flex-wrap gap-3 mt-5 ${openSections.color ? 'flex' : 'hidden'}`}>
            {coloresDisponibles.map(c => {
              const activo = coloresFiltro.includes(c.nombre);
              return (
                <button
                  key={c.nombre}
                  onClick={() => onColorChange(c.nombre)}
                  title={c.nombre}
                  className="relative cursor-pointer group"
                >
                  <div
                    className={`w-6 h-6 rounded-full border shadow-sm transition-all duration-200 group-hover:scale-110
                      ${activo
                        ? 'ring-2 ring-offset-2 ring-stone-900 border-stone-300'
                        : 'border-stone-200/80'
                      }`}
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              );
            })}
          </div>

          {/* Nombres de colores seleccionados */}
          {coloresFiltro.length > 0 && (
            <p style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] text-stone-400 tracking-[0.15em] mt-3 uppercase">
              {coloresFiltro.join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* ── LIMPIAR FILTROS ── */}
      {hayFiltrosActivos && (
        <button
          onClick={onLimpiar}
          style={{ fontFamily: 'var(--font-primary)' }}
          className="text-[9px] font-bold tracking-[0.2em] text-stone-400 hover:text-stone-900 uppercase underline underline-offset-4 transition-colors text-left"
        >
          Limpiar filtros
        </button>
      )}

    </div>
  );

  return (
    <>
      {/* ── MÓVIL ── */}
      <div className="lg:hidden">
        <div
          onClick={() => setIsFilterOpen(false)}
          className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
            isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />
        <div
          className={`fixed top-0 left-0 h-full w-full sm:w-[350px] z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
            isFilterOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-primary)' }}
        >
          <div className="flex items-center justify-between px-8 py-6 border-b border-stone-200/50">
            <span className="text-[11px] font-bold tracking-[0.2em] text-stone-900 uppercase">Filtros</span>
            <button onClick={() => setIsFilterOpen(false)} className="text-stone-500 hover:text-stone-900 transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto px-8 py-8">
            <FilterContent />
          </div>
          <div className="border-t border-stone-200/50 px-8 py-6 bg-white/40 backdrop-blur-md">
            <button
              onClick={() => setIsFilterOpen(false)}
              style={{ fontFamily: 'var(--font-primary)' }}
              className="w-full bg-stone-900 text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors"
            >
              {hayFiltrosActivos
                ? `Ver ${totalFiltrados} ${totalFiltrados === 1 ? 'pieza' : 'piezas'}`
                : 'Ver todo'}
            </button>
          </div>
        </div>
      </div>

      {/* ── ESCRITORIO ── */}
      <aside
        className="hidden lg:block w-[220px] flex-shrink-0 pr-8 sticky top-[120px] self-start"
        style={{ fontFamily: 'var(--font-primary)' }}
      >
        <FilterContent />
      </aside>
    </>
  );
}