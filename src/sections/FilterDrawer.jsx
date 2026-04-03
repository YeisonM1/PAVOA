import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

export default function FilterDrawer({ isFilterOpen, setIsFilterOpen }) {
  // Estado para controlar qué filtros están abiertos/cerrados (Acordeón)
  const [openSections, setOpenSections] = useState({ talla: true, color: true });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ── DISEÑO DEL CONTENIDO DEL FILTRO (Reutilizable en Móvil y Escritorio) ──
// ── DISEÑO DEL CONTENIDO DEL FILTRO (Reutilizable en Móvil y Escritorio) ──
  const FilterContent = () => (
    <div className="flex flex-col gap-8 w-full">
      
      {/* SECCIÓN: TALLA */}
      <div className="border-b border-stone-200/60 pb-6">
        <button 
          onClick={() => toggleSection('talla')} 
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Talla</span>
          {openSections.talla ? <Minus size={14} className="text-stone-400 group-hover:text-stone-900" /> : <Plus size={14} className="text-stone-400 group-hover:text-stone-900" />}
        </button>
        
        <div className={`grid grid-cols-3 gap-2 mt-5 transition-all duration-300 ${openSections.talla ? 'block' : 'hidden'}`}>
          {['XS', 'S', 'M', 'L', 'XL'].map(talla => (
            <label key={talla} className="cursor-pointer">
              {/* Checkbox oculto para manejar el estado visual con peer */}
              <input type="checkbox" className="sr-only peer" name="talla" value={talla} />
              <div className="h-9 flex items-center justify-center border border-stone-200 bg-transparent text-[10px] font-medium text-stone-600 peer-checked:bg-stone-900 peer-checked:text-white peer-checked:border-stone-900 hover:border-stone-900 hover:text-stone-900 transition-colors">
                {talla}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* SECCIÓN: COLOR (AHORA EN CUADRÍCULA PREMIUM) */}
      <div className="border-b border-stone-200/60 pb-6">
        <button 
          onClick={() => toggleSection('color')} 
          className="flex items-center justify-between w-full text-left group cursor-pointer"
        >
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Color</span>
          {openSections.color ? <Minus size={14} className="text-stone-400 group-hover:text-stone-900" /> : <Plus size={14} className="text-stone-400 group-hover:text-stone-900" />}
        </button>
        
        {/* Opciones de Color (Grid Minimalista de Círculos) */}
        <div className={`flex flex-wrap gap-3 mt-5 transition-all duration-300 ${openSections.color ? 'flex' : 'hidden'}`}>
          {[
            { name: 'Ónix', color: '#1c1c1c' },
            { name: 'Crema', color: '#f5f5dc' },
            { name: 'Oliva', color: '#556b2f' },
            { name: 'Océano', color: '#4f42b5' }
          ].map(c => (
            <label 
              key={c.name} 
              className="relative cursor-pointer group"
              title={c.name} // Muestra el nombre al hacer hover
            >
              <input type="checkbox" className="sr-only peer" name="color" value={c.name} />
              
              {/* Círculo de color */}
              <div 
                className="w-6 h-6 rounded-full border border-stone-200/80 shadow-sm peer-checked:ring-1 peer-checked:ring-offset-2 peer-checked:ring-stone-900 transition-all duration-200 group-hover:scale-110" 
                style={{ backgroundColor: c.color }} 
              />
            </label>
          ))}
        </div>
      </div>
      
    </div>
  );

  return (
    <>
      {/* ── VERSIÓN MÓVIL: CAJÓN DESLIZABLE (Oculto en Escritorio) ── */}
      <div className="lg:hidden">
        {/* Overlay oscuro */}
        <div 
          onClick={() => setIsFilterOpen(false)}
          className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        />

        {/* Drawer */}
        <div 
          className={`fixed top-0 left-0 h-full w-full sm:w-[350px] z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}
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
            <button onClick={() => setIsFilterOpen(false)} className="w-full bg-stone-900 text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors">
              Aplicar (12)
            </button>
          </div>
        </div>
      </div>

      {/* ── VERSIÓN ESCRITORIO: BARRA LATERAL FIJA (Oculta en Móvil) ── */}
      {/* Usamos sticky top-[120px] para que se quede fija mientras haces scroll */}
      <aside 
        className="hidden lg:block w-[220px] flex-shrink-0 pr-8 sticky top-[120px] self-start" 
        style={{ fontFamily: 'var(--font-primary)' }}
      >
         <FilterContent />
      </aside>
    </>
  );
}