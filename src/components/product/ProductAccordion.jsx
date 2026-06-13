import { Plus, Minus } from 'lucide-react';

export default function ProductAccordion({ detallesArray, cuidadosArray, openAccordion, onToggle }) {
  const renderBulletList = (items) => (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={index} className="grid grid-cols-[12px_minmax(0,1fr)] items-start gap-2">
          <span className="flex justify-center pt-[7px]" aria-hidden="true">
            <span className="block h-[4px] w-[4px] rounded-full bg-stone-500" />
          </span>
          <span
            className="block text-[11px] text-stone-600 tracking-[0.1em] uppercase leading-[1.85]"
            style={{ textAlign: 'justify', textWrap: 'pretty' }}
          >
            {item.trim()}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-stone-200">
        <button onClick={() => onToggle('detalles')} className="w-full py-6 flex items-center justify-between text-left">
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Detalles del diseño</span>
          {openAccordion === 'detalles' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'detalles' ? 'max-h-[600px] pb-6' : 'max-h-0'}`}>
          {renderBulletList(detallesArray)}
        </div>
      </div>
      <div className="border-b border-stone-200">
        <button onClick={() => onToggle('cuidados')} className="w-full py-6 flex items-center justify-between text-left">
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Cuidados de la Prenda</span>
          {openAccordion === 'cuidados' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'cuidados' ? 'max-h-[600px] pb-6' : 'max-h-0'}`}>
          {cuidadosArray.length > 0 ? (
            renderBulletList(cuidadosArray)
          ) : (
            <p className="text-[11px] text-stone-400 tracking-[0.1em] uppercase">Sin indicaciones especiales.</p>
          )}
        </div>
      </div>
    </div>
  );
}
