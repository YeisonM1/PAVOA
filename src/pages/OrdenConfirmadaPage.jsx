import { useLocation, useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { thumbImage } from '../utils/imageUrl';

export default function OrdenConfirmadaPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  // Si alguien entra directo sin datos, va al inicio
  if (!state?.paymentId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <p className="text-[11px] tracking-[0.2em] uppercase text-stone-500">No hay información de pedido</p>
        <Link to="/" className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { paymentId, items = [], total, email, nombre } = state;
  const firstName = nombre?.split(' ')[0] || 'Cliente';

  return (
    <div className="min-h-screen bg-white pt-[88px] md:pt-[104px]">
      <SEO title="Pedido confirmado — PAVOA" url="/orden-confirmada" />

      <div className="max-w-[640px] mx-auto px-6 md:px-12 py-16 md:py-24">

        {/* Icono check */}
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 border border-stone-200 rounded-full flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-900">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-3">Pago aprobado</p>
          <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
            Gracias, <strong className="font-bold">{firstName}</strong>
          </h1>
          <div className="w-8 h-[1px] bg-[var(--color-gold,#DFCDB4)] mx-auto mb-5" />
          <p className="text-[13px] text-stone-500 leading-relaxed tracking-[0.05em]">
            Tu pedido fue confirmado. Pronto nos pondremos en contacto para coordinar la entrega.
          </p>
        </div>

        {/* Referencia del pago */}
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

        {/* Productos */}
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
                      Talla: {item.talla}{item.color ? ` · ${item.color}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-stone-500 tracking-[0.05em]">× {item.cantidad}</p>
                    <p className="text-[12px] font-semibold text-stone-900 mt-0.5">{item.precio}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-5">
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Total pagado</span>
              <span className="text-[18px] font-bold text-stone-900">
                ${Number(total).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        )}

        {/* Mensaje siguiente paso */}
        <div className="border border-stone-100 p-6 mb-10">
          <p className="text-[9px] font-bold tracking-[0.3em] text-stone-400 uppercase mb-3">¿Qué sigue?</p>
          <ul className="flex flex-col gap-2">
            {[
              'Recibirás un correo de confirmación con los detalles.',
              'Nos pondremos en contacto por WhatsApp para coordinar la entrega.',
              'Tu pedido será preparado y enviado según el horario acordado.',
            ].map((paso, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[9px] font-bold text-stone-300 mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span className="text-[12px] text-stone-500 leading-relaxed tracking-[0.04em]">{paso}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/categoria')}
            className="flex-1 h-12 bg-stone-900 text-white text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors"
          >
            Seguir comprando
          </button>
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
