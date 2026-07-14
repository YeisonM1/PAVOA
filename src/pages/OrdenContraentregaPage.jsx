import { useEffect, useContext, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../App';
import SEO from '../components/SEO';
import { thumbImage } from '../utils/imageUrl';

const formatCustomerName = (value, fallback = 'Cliente') => {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ');
  if (!normalized) return fallback;
  return normalized
    .split(' ')
    .map((part) => {
      const lower = part.toLocaleLowerCase('es-CO');
      return lower.charAt(0).toLocaleUpperCase('es-CO') + lower.slice(1);
    })
    .join(' ');
};

export default function OrdenContraentregaPage() {
  const { clearCart } = useContext(CartContext);
  const cartClearedRef = useRef(false);

  const [orderData] = useState(() => {
    try {
      const raw = sessionStorage.getItem('pavoa-pending-order-cod');
      if (raw) {
        sessionStorage.removeItem('pavoa-pending-order-cod');
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (!cartClearedRef.current) {
      cartClearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

  if (!orderData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <p className="text-[11px] tracking-[0.2em] uppercase text-stone-500">No hay información de pedido</p>
        <Link to="/" className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { items = [], subtotal, shippingCost, total, email, nombre, orderName } = orderData;
  const firstName = formatCustomerName(nombre?.split(' ')[0]);
  const hasSubtotal = Number.isFinite(Number(subtotal));
  const hasShippingCost = Number.isFinite(Number(shippingCost));

  return (
    <div className="min-h-screen bg-white pt-[88px] md:pt-[104px]">
      <SEO title="Pedido registrado" url="/orden-contraentrega" noIndex />

      <div className="max-w-[640px] mx-auto px-6 md:px-12 py-16 md:py-24">

        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 border border-stone-200 rounded-full flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-900">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-3">Pago contra entrega</p>
          <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
            Gracias, <strong className="font-bold">{firstName}</strong>
          </h1>
          <div className="w-8 h-[1px] bg-[var(--color-gold,#DFCDB4)] mx-auto mb-5" />
          <p className="text-[13px] text-stone-500 leading-relaxed tracking-[0.05em]">
            Tu pedido fue registrado. Nos encargamos de prepararlo y al momento de la entrega realizas el pago.
          </p>
        </div>

        <div className="bg-[#F2E4E1] px-6 py-5 mb-10 flex items-center justify-between flex-wrap gap-3">
          {orderName && (
            <div>
              <p className="text-[9px] tracking-[0.25em] text-stone-400 uppercase mb-1">Número de pedido</p>
              <p className="text-[13px] font-semibold text-stone-900 tracking-[0.08em]">{orderName}</p>
            </div>
          )}
          {email && (
            <div className="text-right">
              <p className="text-[9px] tracking-[0.25em] text-stone-400 uppercase mb-1">Confirmación enviada a</p>
              <p className="text-[12px] text-stone-700 tracking-[0.05em]">{email}</p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.3em] text-stone-900 uppercase mb-5">Detalle del pedido</p>
            <div className="flex flex-col gap-4">
              {items.map((item, i) => (
                <div key={i} className="flex gap-4 items-center border-b border-stone-100 pb-4">
                  {item.imagen && (
                    <img
                      src={thumbImage(item.imagen)}
                      alt={item.nombre}
                      className="w-14 object-cover flex-shrink-0"
                      style={{ height: '72px' }}
                    />
                  )}
                  <div className="flex-grow">
                    <p className="text-[11px] font-bold tracking-[0.12em] text-stone-900 uppercase">{item.nombre}</p>
                    <p className="text-[10px] text-stone-400 tracking-[0.08em] mt-0.5">
                      Talla: {item.talla}{item.color ? ` - ${item.color}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-stone-500 tracking-[0.05em]">x {item.cantidad}</p>
                    <p className="text-[12px] font-semibold text-stone-900 mt-0.5">{item.precio}</p>
                  </div>
                </div>
              ))}
            </div>

            {total != null && (
              <div className="flex flex-col gap-2 pt-5">
                {hasSubtotal && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Subtotal</span>
                    <span className="text-[12px] text-stone-700">
                      ${Number(subtotal).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
                {hasShippingCost && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Envío</span>
                    <span className="text-[12px] text-stone-700">
                      ${Number(shippingCost).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-stone-100 pt-3 mt-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Total a pagar</span>
                  <span className="text-[18px] font-bold text-stone-900">
                    ${Number(total).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border border-stone-100 p-6 mb-10">
          <p className="text-[9px] font-bold tracking-[0.3em] text-stone-400 uppercase mb-3">¿Qué sigue?</p>
          <ul className="flex flex-col gap-2">
            {[
              'Confirmamos el pedido y alistamos las prendas.',
              'Cuando se despache, te compartiremos la guía de rastreo.',
              'Al momento de la entrega, realizas el pago al mensajero.',
            ].map((paso, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[9px] font-bold text-stone-300 mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span className="text-[12px] text-stone-500 leading-relaxed tracking-[0.04em]">{paso}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <Link
            to="/categoria"
            className="flex-1 h-12 bg-stone-900 text-white text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors flex items-center justify-center"
          >
            Seguir comprando
          </Link>
          <Link
            to="/cuenta"
            className="flex-1 h-12 border border-stone-200 text-stone-700 text-[10px] font-bold tracking-[0.25em] uppercase hover:border-stone-900 hover:text-stone-900 transition-colors flex items-center justify-center"
          >
            Ver mis pedidos
          </Link>
        </div>

      </div>
    </div>
  );
}
