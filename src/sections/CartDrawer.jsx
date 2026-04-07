import React, { useContext } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { CartContext } from '../App';

const NUMERO_WHATSAPP = "573007056457"; // ✅ Número real de PAVOA

export default function CartDrawer({ cartOpen, setCartOpen }) {
  const { cartItems, cartCount, cartTotal, removeFromCart, updateQuantity } = useContext(CartContext);

  const handleWhatsAppCheckout = () => {
    let mensaje = "Hola PAVOA, me gustaria concretar mi pedido:\n\n";
    mensaje += "DETALLE DEL PEDIDO\n";
    mensaje += "-------------------\n";

    cartItems.forEach((item, i) => {
      const color = item.producto.colorSeleccionado
        ? `, Color: ${item.producto.colorSeleccionado}`
        : '';
      mensaje += `${i + 1}. ${item.producto.nombre}\n`;
      mensaje += `   Talla: ${item.talla}${color}\n`;
      mensaje += `   Cantidad: ${item.cantidad}\n`;
      mensaje += `   Precio: ${item.producto.precio}\n\n`;
    });

    mensaje += "-------------------\n";
    mensaje += `Total estimado: ${cartTotal.toLocaleString('es-CO')}\n\n`;
    mensaje += "Quedo atenta a los pasos para confirmar el pago.";

    window.open(
      `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`,
      '_blank'
    );
  };

  return (
    <>
      <div 
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
          cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
      />

      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-primary)' }}
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
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-50">
              <ShoppingBag size={32} strokeWidth={1} className="text-stone-400" aria-hidden="true" />
              <p className="text-[11px] tracking-[0.15em] uppercase text-stone-500">Tu bolsa está vacía</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {cartItems.map((item, index) => (
                <div key={index} className="flex gap-5 group">
                  <div className="w-24 h-[126px] bg-stone-100 overflow-hidden relative flex-shrink-0">
                    <img
                      src={item.producto.imagen1}
                      alt={item.producto.nombre}
                      className="w-full h-full object-cover"
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
                          className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
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
                          className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
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
            <button 
              onClick={handleWhatsAppCheckout}
              className="w-full bg-stone-900 text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
              aria-label="Finalizar compra por WhatsApp"
            >
              Finalizar Compra
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}