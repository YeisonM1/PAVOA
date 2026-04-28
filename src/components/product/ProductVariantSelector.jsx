import { Plus, Minus } from 'lucide-react';

export default function ProductVariantSelector({
  variantes, coloresUnicos, tallasDisponibles, esTallaUnica, tieneVariantes,
  colorSeleccionado, tallaSeleccionada, cantidad, stockActual,
  puedeSeleccionarCantidad, showCantidadHint, adding,
  onColorSelect, onTallaSelect, onIncrementar, onDecrementar, onCantidadBloqueada,
  onAddToCart, onShowGuiaTallas, addBtnRef,
  alertEmail, alertSent, alertLoading, onAlertEmailChange, onStockAlert,
}) {
  return (
    <>
      {/* ── CANTIDAD ── */}
      <div className="mb-5 md:mb-8">
        <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-4">Cantidad</span>
        <div className="relative inline-block">
          <div
            className={`inline-flex items-center border transition-colors duration-300 ${
              !puedeSeleccionarCantidad ? 'border-stone-100' : 'border-stone-200'
            }`}
            onClick={!puedeSeleccionarCantidad ? onCantidadBloqueada : undefined}
          >
            <button
              onClick={puedeSeleccionarCantidad ? onDecrementar : undefined}
              disabled={!puedeSeleccionarCantidad || cantidad <= 1}
              aria-label="Disminuir cantidad"
              className={`w-11 h-11 flex items-center justify-center transition-colors
                ${!puedeSeleccionarCantidad
                  ? 'text-stone-200 cursor-not-allowed'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
            >
              <Minus size={13} strokeWidth={2} />
            </button>
            <span
              className={`w-12 h-11 flex items-center justify-center text-[13px] font-medium border-x select-none transition-colors ${
                !puedeSeleccionarCantidad ? 'text-stone-200 border-stone-100' : 'text-stone-900 border-stone-200'
              }`}
              aria-live="polite"
            >
              {cantidad}
            </span>
            <button
              onClick={puedeSeleccionarCantidad ? onIncrementar : onCantidadBloqueada}
              aria-label="Aumentar cantidad"
              className={`w-11 h-11 flex items-center justify-center transition-colors
                ${!puedeSeleccionarCantidad
                  ? 'text-stone-200 cursor-not-allowed'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
            >
              <Plus size={13} strokeWidth={2} />
            </button>
          </div>

          {/* Tooltip premium */}
          <div className={`absolute left-0 -bottom-8 transition-all duration-300 ease-out pointer-events-none ${
            showCantidadHint ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
          }`}>
            <p style={{ letterSpacing: '0.15em' }} className="text-[9px] text-stone-400 uppercase whitespace-nowrap">
              ✦ Selecciona primero color y talla
            </p>
          </div>
        </div>
      </div>

      {/* ── COLORES ── */}
      {tieneVariantes && (
        <div id="color-selector" className="mb-5 md:mb-8">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Color</span>
            {colorSeleccionado && (
              <span className="text-[9px] tracking-[0.15em] text-stone-500 uppercase">{colorSeleccionado}</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {coloresUnicos.map(v => {
              const activo = colorSeleccionado === v.color;
              return (
                <button key={v.color} onClick={() => onColorSelect(v.color)} title={v.color}
                  className="flex flex-col items-center gap-1.5 group"
                  aria-label={`Color ${v.color}${activo ? ', seleccionado' : ''}`}>
                  <div className={`w-7 h-7 rounded-full border transition-all duration-200 group-hover:scale-110
                    ${activo ? 'ring-2 ring-offset-2 ring-stone-900 border-stone-300 scale-110' : 'border-stone-200 shadow-sm'}`}
                    style={{ backgroundColor: v.hex }} />
                  <span className={`text-[8px] tracking-[0.1em] uppercase transition-colors ${activo ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
                    {v.color}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TALLAS ── */}
      {colorSeleccionado && (
        <div id="talla-selector" className="mb-10">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Talla</span>
            {!esTallaUnica && (
              <button
                onClick={onShowGuiaTallas}
                className="text-[9px] font-bold tracking-[0.15em] text-stone-400 hover:text-stone-900 uppercase underline transition-colors"
              >
                Guía de tallas
              </button>
            )}
          </div>
          {esTallaUnica ? (
            <div className="flex flex-col gap-3">
              <div className="h-12 border border-stone-200 bg-stone-50 flex items-center justify-center cursor-default select-none">
                <span className="text-[11px] font-medium text-stone-400 tracking-[0.15em] uppercase">Talla Única</span>
              </div>
              <p className="text-[9px] tracking-[0.15em] text-stone-400 uppercase text-center">
                Tecnología de adaptación multidireccional · Se adapta a tu cuerpo desde la talla xs hasta la L
              </p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(tallasDisponibles.length, 4)}, minmax(0, 1fr))` }}>
              {tallasDisponibles.map(({ talla, stock }) => {
                const agotado = stock === 0;
                const activo = tallaSeleccionada === talla;
                return (
                  <button
                    key={talla}
                    onClick={() => onTallaSelect(talla)}
                    className={`h-12 border flex items-center justify-center text-[11px] font-medium tracking-[0.05em] transition-colors uppercase relative
                      ${agotado && activo ? 'border-stone-900 bg-stone-900 text-white' :
                        agotado ? 'border-stone-100 text-stone-300' :
                        activo ? 'border-stone-900 bg-stone-900 text-white' :
                        'border-stone-200 text-stone-600 hover:border-stone-900'}`}
                  >
                    {talla}
                  </button>
                );
              })}
            </div>
          )}
          {stockActual !== null && stockActual <= 3 && stockActual > 0 && (
            <p className="text-[9px] tracking-[0.15em] text-amber-700 uppercase mt-3">
              Solo {stockActual} {stockActual === 1 ? 'unidad disponible' : 'unidades disponibles'}
            </p>
          )}
        </div>
      )}

      {/* ── BOTÓN AGREGAR ── */}
      <button
        ref={addBtnRef}
        onClick={onAddToCart}
        disabled={stockActual === 0 || stockActual === null}
        className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
          ${stockActual === 0 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' :
            stockActual === null ? 'bg-stone-300 text-stone-500 cursor-not-allowed' :
            adding ? 'bg-stone-800 text-white scale-[0.98]' :
            'bg-stone-900 text-white hover:bg-stone-800'}`}
      >
        {stockActual === 0 ? 'Agotado' : stockActual === null ? 'Selecciona color y talla' : adding ? 'Agregado ✔' : 'Añadir a la bolsa'}
      </button>

      {/* ── AVISO STOCK AGOTADO ── */}
      {stockActual === 0 && tallaSeleccionada && (
        alertSent ? (
          <p className="text-[9px] tracking-[0.15em] text-stone-500 uppercase mt-4">✓ Te avisaremos cuando esté disponible.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-[9px] tracking-[0.15em] text-stone-400 uppercase">Esta talla está agotada. Avísame cuando vuelva:</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={alertEmail}
                onChange={e => onAlertEmailChange(e.target.value)}
                placeholder="tu@correo.com"
                className="flex-1 border-b border-stone-200 focus:border-stone-900 outline-none py-2.5 text-[12px] text-stone-900 placeholder-stone-300 bg-transparent transition-colors"
              />
              <button
                onClick={onStockAlert}
                disabled={alertLoading || !alertEmail}
                className="text-[9px] font-bold tracking-[0.15em] uppercase text-white bg-stone-900 px-4 py-2 hover:bg-stone-700 transition-colors disabled:opacity-40"
              >
                {alertLoading ? '...' : 'Avísame'}
              </button>
            </div>
          </div>
        )
      )}
    </>
  );
}
