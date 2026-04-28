import { Plus, Minus } from 'lucide-react';

export default function ProductAccordion({ detallesArray, cuidadosTexto, openAccordion, onToggle }) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-stone-200">
        <button onClick={() => onToggle('detalles')} className="w-full py-6 flex items-center justify-between text-left">
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Detalles del diseño</span>
          {openAccordion === 'detalles' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'detalles' ? 'max-h-[600px] pb-6' : 'max-h-0'}`}>
          <ul className="list-disc pl-4 flex flex-col gap-2">
            {detallesArray.map((d, i) => (
              <li key={i} className="text-[11px] text-stone-600 tracking-[0.1em] uppercase">{d.trim()}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-b border-stone-200">
        <button onClick={() => onToggle('cuidados')} className="w-full py-6 flex items-center justify-between text-left">
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Cuidados de la Prenda</span>
          {openAccordion === 'cuidados' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'cuidados' ? 'max-h-[600px] pb-6' : 'max-h-0'}`}>
          {cuidadosTexto
            ? <p className="text-[11px] text-stone-600 tracking-[0.1em] leading-relaxed uppercase">{cuidadosTexto}</p>
            : <p className="text-[11px] text-stone-400 tracking-[0.1em] uppercase">Sin indicaciones especiales.</p>
          }
        </div>
      </div>
    </div>
  );
}
