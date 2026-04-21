import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estaAutenticado, getCliente, getPedidos, cerrarSesion } from '../services/authService';
import SEO from '../components/SEO';

const formatFecha = (iso) => new Date(iso).toLocaleDateString('es-CO', {
  year: 'numeric', month: 'long', day: 'numeric'
});

const formatPrecio = (amount, currency) =>
  `$${Number(amount).toLocaleString('es-CO')} ${currency}`;

const estadoLabel = (status) => ({
  PAID:        { label: 'Pagado',      color: 'text-emerald-600' },
  PENDING:     { label: 'Pendiente',   color: 'text-amber-600'   },
  REFUNDED:    { label: 'Reembolsado', color: 'text-stone-500'   },
  FULFILLED:   { label: 'Enviado',     color: 'text-emerald-600' },
  UNFULFILLED: { label: 'En proceso',  color: 'text-amber-600'   },
}[status] || { label: status, color: 'text-stone-500' });

export default function AccountPage() {
  const navigate = useNavigate();
  const [cliente, setCliente]     = useState(null);
  const [pedidos, setPedidos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('pedidos');

  useEffect(() => {
  if (!estaAutenticado()) {
    navigate('/login', { replace: true });
    return;
  }

  const c = getCliente();
  setCliente(c);

  getPedidos()
    .then(p => setPedidos(p))
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 animate-pulse">
          Cargando tu cuenta...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO title="Mi Cuenta" description="Gestiona tu cuenta PAVOA" url="/cuenta" />

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-[160px] pb-24">

        {/* Header */}
        <div className="flex items-end justify-between mb-12 border-b border-stone-200 pb-6">
          <div>
            <p style={{ letterSpacing: '0.3em' }} className="text-[9px] text-stone-400 uppercase font-medium mb-1">
              Bienvenida de vuelta
            </p>
            <h1 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
              {cliente?.firstName} <strong className="font-bold">{cliente?.lastName}</strong>
            </h1>
            <p className="text-[11px] text-stone-400 mt-1 tracking-[0.1em]">
              {cliente?.email} {/* ← corregido */}
            </p>
          </div>
          <button
            onClick={async () => { await cerrarSesion(); navigate('/'); }}
            style={{ letterSpacing: '0.15em' }}
            className="text-[10px] font-bold text-stone-400 hover:text-stone-900 uppercase transition-colors border-b border-stone-200 pb-0.5"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-10 border-b border-stone-100">
          {[
            { label: 'Mis Pedidos', value: 'pedidos' },
            { label: 'Mi Perfil',   value: 'perfil'  },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative pb-3 px-5 text-[10px] font-bold tracking-[0.25em] uppercase transition-colors duration-200
                ${activeTab === tab.value ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {tab.label}
              <span
                className="absolute bottom-0 left-0 w-full h-[1.5px] transition-all duration-300"
                style={{
                  background:      activeTab === tab.value ? 'var(--color-gold)' : 'transparent',
                  transform:       activeTab === tab.value ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                }}
              />
            </button>
          ))}
        </div>

        {/* ── PEDIDOS ── */}
        {activeTab === 'pedidos' && (
          <div className="flex flex-col gap-4">
            {pedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <p style={{ letterSpacing: '0.3em' }} className="text-[9px] font-bold uppercase text-stone-300">
                  Sin pedidos
                </p>
                <p className="text-[11px] tracking-[0.15em] text-stone-400 uppercase">
                  Aún no has realizado ninguna compra
                </p>
                <button
                  onClick={() => navigate('/categoria')}
                  style={{ letterSpacing: '0.2em' }}
                  className="mt-4 text-[10px] font-bold text-stone-900 uppercase border-b border-stone-900 pb-0.5 hover:text-stone-500 transition-colors"
                >
                  Explorar colección →
                </button>
              </div>
            ) : (
              pedidos.map(pedido => {
                const fin = estadoLabel(pedido.financialStatus);
                const ful = estadoLabel(pedido.fulfillmentStatus);
                return (
                  <div key={pedido.id} className="border border-stone-100 p-6 hover:border-stone-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p style={{ letterSpacing: '0.2em' }} className="text-[11px] font-bold text-stone-900 uppercase">
                          Pedido {pedido.name}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5 tracking-[0.1em]">
                          {formatFecha(pedido.processedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-bold tracking-[0.15em] uppercase ${fin.color}`}>
                          {fin.label}
                        </span>
                        <span className={`text-[9px] font-bold tracking-[0.15em] uppercase ${ful.color}`}>
                          {ful.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
                      {pedido.lineItems.edges.map(({ node: item }, i) => (
                        <div key={i} className="flex-shrink-0 flex items-center gap-3">
                          {item.variant?.image && (
                            <img
                              src={item.variant.image.url}
                              alt={item.title}
                              className="w-12 h-16 object-cover object-top flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="text-[10px] font-medium text-stone-700 tracking-[0.1em] uppercase max-w-[120px] truncate">
                              {item.title}
                            </p>
                            <p className="text-[9px] text-stone-400 tracking-[0.1em]">
                              x{item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                      <div className="flex flex-col gap-1">
                        {pedido.descuentoAplicado && (
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#DFCDB4' }} className="text-[9px]">✦</span>
                            <span style={{ letterSpacing: '0.15em', color: '#DFCDB4' }} className="text-[9px] uppercase">
                              Descuento bienvenida −10%
                            </span>
                            {pedido.totalOriginal > 0 && (
                              <span className="text-[9px] text-stone-300 line-through">
                                ${Number(pedido.totalOriginal).toLocaleString('es-CO')}
                              </span>
                            )}
                          </div>
                        )}
                        <p style={{ letterSpacing: '0.15em' }} className="text-[10px] font-bold text-stone-900 uppercase">
                          Total pagado: {formatPrecio(pedido.totalPrice.amount, pedido.totalPrice.currencyCode)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── PERFIL ── */}
        {activeTab === 'perfil' && (
          <div className="max-w-md flex flex-col gap-6">
            {[
              { label: 'Nombre',   value: `${cliente?.firstName} ${cliente?.lastName}` },
              { label: 'Correo',   value: cliente?.email },
              { label: 'Teléfono', value: cliente?.phone || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="border-b border-stone-100 pb-4">
                <p style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-400 uppercase mb-1">
                  {label}
                </p>
                <p className="text-[13px] text-stone-900 tracking-[0.05em]">{value}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}