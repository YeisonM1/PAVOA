import React, { useState, useEffect, useContext, useMemo } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartContext } from '../App';
import { useWishlist } from '../context/WishlistContext';
import { getProductoById } from '../services/productService';
import { heroImage } from '../utils/imageUrl';

const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#0B0B0B' : 'none'} stroke="#0B0B0B" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function QuickViewModal({ productoId, onClose }) {
  const { addToCart } = useContext(CartContext);
  const { isWished, toggle } = useWishlist();

  const [producto, setProducto]             = useState(null);
  const [loading, setLoading]               = useState(true);
  const [colorSeleccionado, setColor]       = useState(null);
  const [tallaSeleccionada, setTalla]       = useState(null);
  const [adding, setAdding]                 = useState(false);
  const [alertEmail, setAlertEmail]         = useState('');
  const [alertSent, setAlertSent]           = useState(false);
  const [alertLoading, setAlertLoading]     = useState(false);

  useEffect(() => {
    if (!productoId) return;
    let cancelled = false;
    setLoading(true);
    setColor(null);
    setTalla(null);
    setAlertSent(false);
    getProductoById(productoId)
      .then(data => { if (!cancelled) { setProducto(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productoId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const variantes = useMemo(() => {
    if (!producto?.variantes) return [];
    try {
      const parsed = typeof producto.variantes === 'string' ? JSON.parse(producto.variantes) : producto.variantes;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [producto?.variantes]);

  const coloresUnicos = useMemo(() => {
    const vistos = new Set();
    return variantes.filter(v => { if (vistos.has(v.color)) return false; vistos.add(v.color); return true; });
  }, [variantes]);

  const tallasDisponibles = useMemo(() => {
    if (!colorSeleccionado) return [];
    return variantes.filter(v => v.color === colorSeleccionado).map(v => ({ talla: v.talla, stock: v.stock ?? 0 }));
  }, [variantes, colorSeleccionado]);

  const esTallaUnica = tallasDisponibles.length === 1 && tallasDisponibles[0]?.talla === 'ÚNICA';

  useEffect(() => {
    if (esTallaUnica && colorSeleccionado) setTalla('ÚNICA');
  }, [esTallaUnica, colorSeleccionado]);

  const stockActual = useMemo(() => {
    if (!colorSeleccionado || !tallaSeleccionada) return null;
    const v = variantes.find(v => v.color === colorSeleccionado && v.talla === tallaSeleccionada);
    return v?.stock ?? 0;
  }, [variantes, colorSeleccionado, tallaSeleccionada]);

  const handleAddToCart = () => {
    if (!colorSeleccionado || (!esTallaUnica && !tallaSeleccionada)) return;
    setAdding(true);
    const tallaFinal = esTallaUnica ? 'ÚNICA' : tallaSeleccionada;
    const varianteElegida = variantes.find(v => v.color === colorSeleccionado && v.talla === tallaFinal);
    addToCart({ ...producto, colorSeleccionado, selectedVariantId: varianteElegida?.variantId || null }, tallaFinal, 1);
    setTimeout(() => { setAdding(false); onClose(); }, 900);
  };

  const handleStockAlert = async () => {
    if (!alertEmail) return;
    setAlertLoading(true);
    try {
      await fetch('/api/stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alertEmail, productId: producto.id, productNombre: producto.nombre, talla: tallaSeleccionada, color: colorSeleccionado }),
      });
      setAlertSent(true);
    } catch {} finally { setAlertLoading(false); }
  };

  const canAdd = colorSeleccionado && (esTallaUnica || tallaSeleccionada) && stockActual !== 0 && stockActual !== null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-3xl flex flex-col md:flex-row max-h-[92vh] overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-stone-400 hover:text-stone-900 transition-colors" aria-label="Cerrar">
          <X size={20} strokeWidth={1.5} />
        </button>

        {/* Imagen */}
        <div className="md:w-[45%] h-[45vw] md:h-auto min-h-[220px] bg-stone-100 flex-shrink-0 overflow-hidden">
          {loading
            ? <div className="w-full h-full animate-pulse bg-stone-200" />
            : producto && <img src={heroImage(producto.imagen1)} alt={producto.nombre} className="w-full h-full object-cover" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto flex flex-col gap-5">
          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-5 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-1/3" />
            </div>
          ) : !producto ? (
            <p className="text-[11px] text-stone-400 uppercase tracking-[0.15em]">Producto no encontrado</p>
          ) : (
            <>
              {/* Nombre + corazón */}
              <div className="flex items-start justify-between gap-4 pr-6">
                <div>
                  <h2 className="text-lg font-light text-stone-900 tracking-[0.15em] uppercase leading-tight">{producto.nombre}</h2>
                  <p className="text-sm font-semibold text-stone-600 tracking-[0.1em] mt-2">{producto.precio}</p>
                </div>
                <button onClick={() => toggle(producto.id)} className="flex-shrink-0 mt-1 text-stone-300 hover:text-stone-900 transition-colors" aria-label="Guardar en favoritos">
                  <HeartIcon filled={isWished(producto.id)} />
                </button>
              </div>

              {/* Colores */}
              {coloresUnicos.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-3">
                    Color{colorSeleccionado ? ` — ${colorSeleccionado}` : ''}
                  </span>
                  <div className="flex gap-3 flex-wrap">
                    {coloresUnicos.map(v => (
                      <button key={v.color} onClick={() => { setColor(v.color); setTalla(null); setAlertSent(false); }}
                        className="flex flex-col items-center gap-1" aria-label={v.color}>
                        <div className={`w-7 h-7 rounded-full border transition-all ${colorSeleccionado === v.color ? 'ring-2 ring-offset-2 ring-stone-900 border-stone-300 scale-110' : 'border-stone-200 shadow-sm hover:scale-105'}`}
                          style={{ backgroundColor: v.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tallas */}
              {colorSeleccionado && (
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase block mb-3">Talla</span>
                  {esTallaUnica ? (
                    <div className="h-11 border border-stone-200 bg-stone-50 flex items-center justify-center">
                      <span className="text-[11px] text-stone-400 tracking-[0.15em] uppercase">Talla Única</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {tallasDisponibles.map(({ talla, stock }) => {
                        const agotado = stock === 0;
                        const activo = tallaSeleccionada === talla;
                        return (
                          <button key={talla}
                            onClick={() => { if (!agotado) { setTalla(talla); setAlertSent(false); } }}
                            disabled={agotado}
                            className={`h-11 px-4 border text-[11px] font-medium tracking-[0.05em] uppercase transition-colors relative
                              ${agotado ? 'border-stone-100 text-stone-300 cursor-not-allowed' :
                                activo ? 'border-stone-900 bg-stone-900 text-white' :
                                'border-stone-200 text-stone-600 hover:border-stone-900'}`}
                          >
                            {talla}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Urgency */}
              {stockActual !== null && stockActual > 0 && stockActual <= 3 && (
                <p className="text-[9px] tracking-[0.15em] text-amber-700 uppercase">Solo {stockActual} {stockActual === 1 ? 'unidad disponible' : 'unidades disponibles'}</p>
              )}

              {/* Back-in-stock */}
              {stockActual === 0 && tallaSeleccionada && (
                alertSent ? (
                  <p className="text-[9px] tracking-[0.15em] text-stone-500 uppercase">✓ Te avisaremos cuando esté disponible.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-[9px] tracking-[0.15em] text-stone-400 uppercase">Esta talla está agotada. Avísame cuando vuelva:</p>
                    <div className="flex gap-2">
                      <input type="email" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="tu@correo.com"
                        className="flex-1 border-b border-stone-200 focus:border-stone-900 outline-none py-2 text-[12px] text-stone-900 placeholder-stone-300 bg-transparent transition-colors" />
                      <button onClick={handleStockAlert} disabled={alertLoading || !alertEmail}
                        className="text-[9px] font-bold tracking-[0.15em] uppercase text-white bg-stone-900 px-4 py-2 hover:bg-stone-700 transition-colors disabled:opacity-40">
                        {alertLoading ? '...' : 'Avísame'}
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Botón añadir */}
              {stockActual !== 0 && (
                <button onClick={handleAddToCart} disabled={!canAdd}
                  className={`w-full h-12 text-[10px] font-bold tracking-[0.25em] uppercase transition-all flex items-center justify-center
                    ${adding ? 'bg-stone-700 text-white' :
                      !canAdd ? 'bg-stone-200 text-stone-400 cursor-not-allowed' :
                      'bg-stone-900 text-white hover:bg-stone-800'}`}
                >
                  {adding ? 'Agregado ✔' : !colorSeleccionado ? 'Selecciona un color' : (!esTallaUnica && !tallaSeleccionada) ? 'Selecciona una talla' : 'Añadir a la bolsa'}
                </button>
              )}

              <Link to={`/producto/${producto.id}`} onClick={onClose}
                className="text-[9px] font-bold tracking-[0.2em] uppercase text-stone-400 hover:text-stone-900 transition-colors text-center underline underline-offset-2">
                Ver producto completo →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
