import React, { useContext } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { CartContext } from '../App';

export default function CartDrawer({ cartOpen, setCartOpen }) {
  const { cartCount } = useContext(CartContext);

  return (
    <>
      {/* ── OVERLAY OSCURO ── */}
      <div 
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
      />

      {/* ── PANEL DEL CARRITO ── */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-primary)' }}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-200/50">
          <span className="text-[11px] font-bold tracking-[0.2em] text-stone-900 uppercase">
            Tu Bolsa ({cartCount})
          </span>
          <button onClick={() => setCartOpen(false)} className="text-stone-500 hover:text-stone-900 transition-colors">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-8 py-8 flex flex-col">
          {cartCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-50">
              <ShoppingBag size={32} strokeWidth={1} className="text-stone-400" />
              <p className="text-[11px] tracking-[0.15em] uppercase text-stone-500">Tu bolsa está vacía</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Producto Simulado Visualmente */}
              <div className="flex gap-5 group">
                <div className="w-24 h-[126px] bg-stone-100 overflow-hidden relative flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80" alt="Producto" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center flex-grow py-1">
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="text-[11px] font-bold tracking-[0.15em] text-stone-900 uppercase">Conjunto Éter</h4>
                    <button className="text-stone-400 hover:text-stone-900 transition-colors">
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 tracking-[0.1em] mb-4 uppercase">Talla: M</p>
                  
                  <div className="flex justify-between items-end mt-auto">
                    <div className="flex items-center border border-stone-200/80">
                      <button className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors">-</button>
                      <span className="text-[10px] w-6 text-center font-medium">1</span>
                      <button className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors">+</button>
                    </div>
                    <p className="text-[12px] font-semibold text-stone-900">$280.000</p>
                  </div>
                </div>
              </div>
              
              {cartCount > 1 && (
                 <p className="text-[10px] text-stone-500 tracking-[0.1em] text-center mt-2 pb-4 border-b border-stone-200/50 uppercase">
                   + {cartCount - 1} pieza(s) adicional(es)
                 </p>
              )}
            </div>
          )}
        </div>

        {cartCount > 0 && (
          <div className="border-t border-stone-200/50 px-8 py-8 bg-white/40 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">Subtotal Estimado</span>
              <span className="text-[14px] font-bold text-stone-900">${(280000 * cartCount).toLocaleString('es-CO')}</span>
            </div>
            <button className="w-full bg-stone-900 text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors">
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}