import { useEffect, useContext, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CartContext } from '../App';
import SEO from '../components/SEO';
import { thumbImage } from '../utils/imageUrl';
import { trackPurchase } from '../lib/analytics';
import { getCliente } from '../services/authService';

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

const toOptionalAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export default function OrdenConfirmadaPage() {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);

  const cartClearedRef = useRef(false);
  const paymentIdParam = searchParams.get('payment_id');
  const statusParam = (searchParams.get('status') || '').toLowerCase();

  const savedOrder = (() => {
    if (!paymentIdParam) return null;
    try {
      const raw = sessionStorage.getItem('pavoa-pending-order');
      if (raw) {
        sessionStorage.removeItem('pavoa-pending-order');
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  })();

  const paymentId = paymentIdParam || state?.paymentId;
  const [resolvedOrderData, setResolvedOrderData] = useState(savedOrder || state || null);
  const [verifiedPaymentStatus, setVerifiedPaymentStatus] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(Boolean(paymentIdParam));
  const orderData = resolvedOrderData || savedOrder || state;
  const checkoutToken = String(orderData?.checkoutToken || '');
  const { items = [], total, subtotal, shippingCost: orderShippingCost, descuentoAplicado, email, nombre, firstName: explicitFirstName } = orderData || {};
  const totalAmount = toOptionalAmount(total);
  const savedSubtotalAmount = toOptionalAmount(subtotal);
  const savedShippingAmount = toOptionalAmount(orderShippingCost);
  const shippingAmount = savedShippingAmount
    ?? (totalAmount !== null && savedSubtotalAmount !== null
      ? Math.max(0, totalAmount - savedSubtotalAmount)
      : null);
  const subtotalAmount = savedSubtotalAmount
    ?? (totalAmount !== null && shippingAmount !== null
      ? Math.max(0, totalAmount - shippingAmount)
      : null);
  const originalSubtotalAmount = descuentoAplicado && subtotalAmount !== null
    ? Math.round(subtotalAmount / 0.9)
    : subtotalAmount;
  const discountAmount = originalSubtotalAmount !== null && subtotalAmount !== null
    ? Math.max(0, originalSubtotalAmount - subtotalAmount)
    : 0;
  const effectiveStatus = verifiedPaymentStatus || statusParam;
  const isApproved = effectiveStatus === 'approved';
  const isPending = effectiveStatus === 'pending' || effectiveStatus === 'in_process';
  const isRejected = ['failure', 'rejected', 'cancelled', 'cancelled_process', 'null'].includes(effectiveStatus);
  const isUnconfirmed = Boolean(paymentId) && !verifyingPayment && !isApproved && !isPending && !isRejected;

  useEffect(() => {
    if (paymentIdParam && isApproved && !cartClearedRef.current) {
      cartClearedRef.current = true;
      clearCart();
    }
  }, [paymentIdParam, isApproved, clearCart]);

  useEffect(() => {
    if (!paymentIdParam || statusParam === 'failure' || statusParam === 'rejected') return;

    let cancelled = false;
    setVerifyingPayment(true);

    fetch('/api/procesar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mp-finalizar', paymentId: paymentIdParam, checkoutToken }),
    })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (cancelled) return;
        if (!data?.ok) {
          console.warn('[PAVOA] No se pudo verificar el pago desde la pagina de confirmacion.', data);
          return;
        }
        if (data.status) setVerifiedPaymentStatus(String(data.status).toLowerCase());
        console.info('[PAVOA] Pago verificado desde la pagina de confirmacion.', data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[PAVOA] Error verificando pago desde la pagina de confirmacion.', err);
        }
      })
      .finally(() => {
        if (!cancelled) setVerifyingPayment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentIdParam, statusParam, checkoutToken]);

  useEffect(() => {
    const hasUsefulOrderData =
      Boolean(orderData?.nombre) ||
      Boolean(orderData?.firstName) ||
      Boolean(orderData?.email) ||
      (Array.isArray(orderData?.items) && orderData.items.length > 0);
    const hasCompleteBreakdown =
      toOptionalAmount(orderData?.total) !== null &&
      (toOptionalAmount(orderData?.subtotal) !== null ||
        toOptionalAmount(orderData?.shippingCost) !== null);

    if (!paymentIdParam || (hasUsefulOrderData && hasCompleteBreakdown) || isUnconfirmed) return;

    fetch('/api/procesar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mp-summary', paymentId: paymentIdParam, checkoutToken }),
    })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (!data?.ok || !data?.summary) return;
        setResolvedOrderData((prev) => ({ ...(prev || {}), ...data.summary }));
      })
      .catch(() => {});
  }, [paymentIdParam, orderData, isUnconfirmed, checkoutToken]);

  useEffect(() => {
    if (isApproved && paymentId && items.length > 0) {
      trackPurchase({ paymentId, items, total });
    }
  }, [isApproved, paymentId, items, total]);

  useEffect(() => {
    if (isRejected) {
      navigate('/checkout', { replace: true });
    }
  }, [isRejected, navigate]);

  if (!paymentId || isRejected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <p className="text-[11px] tracking-[0.2em] uppercase text-stone-500">No hay información de pedido</p>
        <Link to="/" className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const cliente = getCliente();
  const firstName = formatCustomerName(explicitFirstName || nombre?.split(' ')[0] || cliente?.firstName);
  const eyebrow = isApproved
    ? 'Pago aprobado'
    : isPending || verifyingPayment
      ? 'Pago en proceso'
      : 'Pago no confirmado';
  const message = isApproved
    ? 'Tu pedido fue confirmado. En breve recibirás un correo con los detalles.'
    : isPending || verifyingPayment
      ? 'Estamos verificando tu pago. Recibirás confirmación por correo cuando sea aprobado.'
      : 'No recibimos confirmación de pago. Si saliste del banco antes de finalizar, puedes volver al checkout e intentar de nuevo.';
  const nextSteps = isApproved
    ? [
        'Recibirás un correo de confirmación con los detalles.',
        'Tu pedido será preparado y enviado según el horario acordado.',
      ]
    : isPending || verifyingPayment
      ? [
          'Tu pago será confirmado por Mercado Pago en las próximas horas.',
          'Recibirás un correo de confirmación cuando el pago sea aprobado.',
          'Una vez confirmado, coordinaremos la entrega contigo.',
        ]
      : [
          'Tu bolsa sigue disponible para reintentar el pago.',
          'El pedido solo se confirma cuando Mercado Pago aprueba la transacción.',
        ];

  return (
    <div className="min-h-screen bg-white pt-[88px] md:pt-[104px]">
      <SEO title={isApproved ? 'Pedido confirmado' : 'Pago no confirmado'} url="/orden-confirmada" noIndex />

      <div className="max-w-[640px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 border border-stone-200 rounded-full flex items-center justify-center">
            {isPending || verifyingPayment ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-900">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ) : isUnconfirmed ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-900">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-900">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>

        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-3">{eyebrow}</p>
          <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
            Gracias, <strong className="font-bold">{firstName}</strong>
          </h1>
          <div className="w-8 h-[1px] bg-[var(--color-gold,#DFCDB4)] mx-auto mb-5" />
          <p className="text-[13px] text-stone-500 leading-relaxed tracking-[0.05em]">{message}</p>
        </div>

        <div className="bg-[#F2E4E1] px-6 py-5 mb-10 flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[0.25em] text-stone-400 uppercase mb-1">Referencia de pago</p>
            <p className="text-[13px] font-semibold text-stone-900 tracking-[0.08em]">MP #{paymentId}</p>
          </div>
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
                      className="w-14 h-18 object-cover flex-shrink-0"
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

            {totalAmount !== null && (
              <div className="pt-4 flex flex-col gap-2">
                {subtotalAmount !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Subtotal</span>
                    <span className="text-[12px] text-stone-700">${originalSubtotalAmount.toLocaleString('es-CO')}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Descuento bienvenida</span>
                    <span className="text-[12px] text-stone-700">-${discountAmount.toLocaleString('es-CO')}</span>
                  </div>
                )}
                {shippingAmount !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] text-stone-500 uppercase">Envío</span>
                    <span className="text-[12px] text-stone-700">
                      {shippingAmount > 0 ? `$${shippingAmount.toLocaleString('es-CO')}` : 'Gratis'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-stone-100 pt-3 mt-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">
                    {isApproved ? 'Total pagado' : 'Total del intento'}
                  </span>
                  <span className="text-[18px] font-bold text-stone-900">
                    ${totalAmount.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border border-stone-100 p-6 mb-10">
          <p className="text-[9px] font-bold tracking-[0.3em] text-stone-400 uppercase mb-3">¿Qué sigue?</p>
          <ul className="flex flex-col gap-2">
            {nextSteps.map((paso, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[9px] font-bold text-stone-300 mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span className="text-[12px] text-stone-500 leading-relaxed tracking-[0.04em]">{paso}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <Link
            to={isApproved || isPending || verifyingPayment ? '/categoria' : '/checkout'}
            className="flex-1 h-12 bg-stone-900 text-white text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors flex items-center justify-center"
          >
            {isApproved || isPending || verifyingPayment ? 'Seguir comprando' : 'Volver al checkout'}
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
