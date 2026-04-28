import { thumbImage } from '../../utils/imageUrl';

export default function StickyAddBar({ producto, tallaSeleccionada, stockActual, adding, onAddToCart }) {
  return (
    <div className="fixed top-[64px] md:top-[80px] left-0 right-0 z-40 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-5 py-3 flex items-center gap-4">
        <div className="w-10 h-[52px] bg-stone-100 overflow-hidden flex-shrink-0">
          <img src={thumbImage(producto.imagen1)} alt={producto.nombre} width={40} height={52} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.15em] text-stone-900 uppercase truncate">{producto.nombre}</p>
          <p className="text-[11px] text-stone-500">{producto.precio}</p>
        </div>
        {tallaSeleccionada && (
          <p className="text-[10px] tracking-[0.1em] text-stone-500 uppercase hidden sm:block">Talla: {tallaSeleccionada}</p>
        )}
        <button
          onClick={onAddToCart}
          disabled={stockActual === 0 || stockActual === null}
          className={`flex-shrink-0 h-10 px-6 text-[9px] font-bold tracking-[0.2em] uppercase transition-colors
            ${stockActual === 0 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' :
              stockActual === null ? 'bg-stone-300 text-stone-500 cursor-not-allowed' :
              adding ? 'bg-stone-800 text-white' :
              'bg-stone-900 text-white hover:bg-stone-800'}`}
        >
          {stockActual === 0 ? 'Agotado' : stockActual === null ? 'Selecciona opciones' : adding ? '✔' : 'Añadir'}
        </button>
      </div>
    </div>
  );
}
