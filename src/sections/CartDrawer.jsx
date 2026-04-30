import React, { useEffect, useRef, useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { verificarStock } from '../services/productService';
import { useNavigate, Link } from 'react-router-dom';
import { thumbImage } from '../utils/imageUrl';
import { getRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function CartDrawer({ cartOpen, setCartOpen }) {
  const navigate = useNavigate();
  const { cartItems, cartCount, cartTotal, removeFromCart, updateQuantity } = useCart();
  const [modalOpen, setModalOpen]           = React.useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [stockLoading, setStockLoading]     = useState(false);
  const [stockErrores, setStockErrores]     = useState([]);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (cartOpen) {
      setRecentlyViewed(getRecentlyViewed());
      setStockErrores([]);
    }
  }, [cartOpen]);

  const handleFinalizarCompra = async () => {
    setStockLoading(true);
    setStockErrores([]);
    const errores = await verificarStock(cartItems);
    setStockLoading(false);
    if (errores.length > 0) {
      setStockErrores(errores);
      return;
    }
    setModalOpen(true);
  };

  useEffect(() => {
    if (!cartOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [cartOpen]);

  return (
    <>
      <div 
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
          cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-200/50">
          <span className="text-[11px] font-bold tracking-[0.2em] text-stone-900 uppercase">
            Tu Bolsa ({cartCount})
          </span>
          <button
            onClick={() => setCartOpen(false)}
            className="text-stone-500 hover:text-stone-900 transition-colors"
            aria-label="Cerrar carrito"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-8 py-8 flex flex-col">
          {cartItems.length === 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4 opacity-50">
                <ShoppingBag size={32} strokeWidth={1} className="text-stone-400" aria-hidden="true" />
                <p className="text-[11px] tracking-[0.15em] uppercase text-stone-500">Tu bolsa está vacía</p>
              </div>

              {recentlyViewed.length > 0 && (
                <div className="mt-auto">
                  <p className="text-[9px] font-bold tracking-[0.25em] text-stone-400 uppercase mb-4">Visto recientemente</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {recentlyViewed.map(p => (
                      <Link key={p.id} to={`/producto/${p.id}`} onClick={() => setCartOpen(false)}
                        className="flex-shrink-0 flex flex-col gap-2 w-[88px] group">
                        <div className="w-[88px] h-[116px] bg-stone-100 overflow-hidden">
                          <img src={thumbImage(p.imagen1)} alt={p.nombre} width={88} height={116}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <p className="text-[9px] font-bold text-stone-900 tracking-[0.08em] uppercase leading-tight line-clamp-2">{p.nombre}</p>
                        <p className="text-[10px] text-stone-500">{p.precio}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {cartItems.map((item) => (
                <div key={`${item.producto.id}-${item.talla}`} className="flex gap-5 group">
                  <div className="w-24 h-[126px] bg-stone-100 overflow-hidden relative flex-shrink-0">
                    <img
                      src={thumbImage(item.producto.imagen1)}
                      alt={item.producto.nombre}
                      width={96} height={126}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col justify-center flex-grow py-1">
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-[11px] font-bold tracking-[0.15em] text-stone-900 uppercase">
                        {item.producto.nombre}
                      </h4>
                      <button 
                        onClick={() => removeFromCart(item.producto.id, item.talla)}
                        className="text-stone-400 hover:text-stone-900 transition-colors"
                        aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                      >
                        <X size={14} strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>

                    {/* ✅ Muestra talla y color si existe */}
                    <div className="flex flex-col gap-0.5 mb-4">
                      <p className="text-[10px] text-stone-500 tracking-[0.1em] uppercase">
                        Talla: {item.talla}
                      </p>
                      {item.producto.colorSeleccionado && (
                        <p className="text-[10px] text-stone-500 tracking-[0.1em] uppercase">
                          Color: {item.producto.colorSeleccionado}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-center border border-stone-200/80">
                        <button
                          onClick={() => updateQuantity(item.producto.id, item.talla, -1)}
                          className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                          aria-label={`Reducir cantidad de ${item.producto.nombre}`}
                        >-</button>
                        <span
                          className="text-[10px] w-6 text-center font-medium"
                          aria-live="polite"
                        >
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.producto.id, item.talla, 1)}
                          className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                          aria-label={`Aumentar cantidad de ${item.producto.nombre}`}
                        >+</button>
                      </div>
                      <p className="text-[12px] font-semibold text-stone-900">{item.producto.precio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-stone-200/50 px-8 py-8 bg-white/40 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">
                Subtotal Estimado
              </span>
              <span className="text-[14px] font-bold text-stone-900">
                ${cartTotal.toLocaleString('es-CO')}
              </span>
            </div>
            {stockErrores.length > 0 && (
              <div className="mb-4 flex flex-col gap-1">
                {stockErrores.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-600 tracking-[0.08em]">{err}</p>
                ))}
              </div>
            )}
            <button
              onClick={handleFinalizarCompra}
              disabled={stockLoading}
              className="w-full bg-stone-900 text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              aria-label="Finalizar compra"
            >
              {stockLoading ? 'Verificando stock...' : 'Finalizar Compra'}
              {!stockLoading && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      {/* ── MODAL DE CONFIRMACIÓN ── */}
      <div className={`fixed inset-0 z-[80] flex items-center justify-center px-4 transition-all duration-300 ${
        modalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        />

        {/* Panel */}
        <div
          className={`relative w-full max-w-md bg-white z-10 transition-all duration-300 ${
            modalOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
          }`}
                 >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
            <span className="text-[11px] font-bold tracking-[0.2em] text-stone-900 uppercase">
              Confirmar pedido
            </span>
            <button
              onClick={() => setModalOpen(false)}
              className="text-stone-400 hover:text-stone-900 transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          {/* Resumen de productos */}
          <div className="px-8 py-6 flex flex-col gap-5 max-h-[50vh] overflow-y-auto">
            {cartItems.map((item) => (
              <div key={`modal-${item.producto.id}-${item.talla}`} className="flex gap-4">
                <div className="w-16 h-20 bg-stone-100 overflow-hidden flex-shrink-0">
                  <img
                    src={thumbImage(item.producto.imagen1)}
                    alt={item.producto.nombre}
                    width={64} height={80}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col justify-center gap-1 flex-grow">
                  <p className="text-[11px] font-bold tracking-[0.12em] text-stone-900 uppercase">
                    {item.producto.nombre}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-stone-500 tracking-[0.08em] uppercase">
                      Talla: {item.talla}
                      {item.producto.colorSeleccionado && ` · Color: ${item.producto.colorSeleccionado}`}
                    </p>
                    <p className="text-[10px] text-stone-500 tracking-[0.08em] uppercase">
                      Cantidad: {item.cantidad}
                    </p>
                  </div>
                  <p className="text-[12px] font-semibold text-stone-900 mt-1">
                    {item.producto.precio}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-8 py-4 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">
              Total estimado
            </span>
            <span className="text-[15px] font-bold text-stone-900">
              ${cartTotal.toLocaleString('es-CO')}
            </span>
          </div>

          {/* Botones */}
          <div className="px-8 py-6 border-t border-stone-100 grid grid-cols-2 gap-3">
            <button
              onClick={() => setModalOpen(false)}
                           className="h-12 border border-stone-200 text-[10px] font-bold tracking-[0.2em] uppercase text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setModalOpen(false);
                setCartOpen(false);
                navigate('/checkout');
              }}
                           className="h-12 bg-stone-900 text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
            >
              Confirmar
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}