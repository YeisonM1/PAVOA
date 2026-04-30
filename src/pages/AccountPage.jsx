import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estaAutenticado, getCliente, getPedidos, cerrarSesion } from '../services/authService';
import { getProductos } from '../services/productService';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

const formatFecha = (iso) => new Date(iso).toLocaleDateString('es-CO', {
  year: 'numeric', month: 'long', day: 'numeric',
});

const formatPrecio = (amount) =>
  `$${Number(amount).toLocaleString('es-CO')}`;

const EstadoBadge = ({ status, type }) => {
  const map = {
    PAID:        { label: 'Pagado',     bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    PENDING:     { label: 'Pendiente',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
    DELIVERED:   { label: 'Entregado',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    FULFILLED:   { label: 'Enviado',    bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400'    },
    UNFULFILLED: { label: 'En proceso', bg: 'bg-stone-50',   text: 'text-stone-500',   dot: 'bg-stone-400'   },
    REFUNDED:    { label: 'Reembolsado',bg: 'bg-stone-50',   text: 'text-stone-400',   dot: 'bg-stone-300'   },
  };
  const s = map[status] || { label: status, bg: 'bg-stone-50', text: 'text-stone-500', dot: 'bg-stone-300' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span className="text-[9px] font-bold tracking-[0.15em] uppercase">{s.label}</span>
    </span>
  );
};

const ChevronIcon = ({ open }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function OrdenDetalle({ pedido, imagenMap }) {
  const tieneDescuento = pedido.descuentoAplicado && pedido.totalOriginal > 0;

  return (
    <div className="border-t border-stone-100 bg-[#FAFAF9]">
      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-stone-100">

        {/* ── Columna izquierda: productos ── */}
        <div className="p-6">
          <p style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-400 uppercase mb-4">
            Productos
          </p>
          <div className="flex flex-col gap-4">
            {pedido.items.map((item, i) => {
              const img = imagenMap[item.nombre];
              return (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-14 flex-shrink-0 bg-stone-100" style={{ aspectRatio: '3/4' }}>
                    {img
                      ? <img src={img} alt={item.nombre} className="w-full h-full object-cover object-top" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d6d3d1" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="0"/><circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-stone-900 tracking-[0.08em] uppercase leading-snug truncate">
                      {item.nombre}
                    </p>
                    <p className="text-[10px] text-stone-400 tracking-[0.08em] mt-0.5">
                      Cantidad: {item.cantidad}
                    </p>
                    {item.precio && (
                      <p className="text-[11px] text-stone-600 tracking-[0.05em] mt-0.5 font-medium">
                        {formatPrecio(item.precio)} c/u
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Columna derecha: detalles ── */}
        <div className="p-6 flex flex-col gap-5">

          {/* Estado */}
          <div>
            <p style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-400 uppercase mb-2">
              Estado
            </p>
            <div className="flex flex-wrap gap-2">
              <EstadoBadge status={pedido.financialStatus} />
              <EstadoBadge status={pedido.fulfillmentStatus} />
            </div>
          </div>

          {/* Dirección */}
          {(pedido.direccion || pedido.ciudad) && (
            <div>
              <p style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-400 uppercase mb-2">
                Dirección de entrega
              </p>
              <div className="flex flex-col gap-0.5">
                {pedido.nombreCliente && (
                  <p className="text-[12px] text-stone-900 tracking-[0.04em]">{pedido.nombreCliente}</p>
                )}
                {pedido.direccion && (
                  <p className="text-[11px] text-stone-500 tracking-[0.04em]">{pedido.direccion}</p>
                )}
                {pedido.ciudad && (
                  <p className="text-[11px] text-stone-500 tracking-[0.04em]">{pedido.ciudad}</p>
                )}
                {pedido.telefono && (
                  <p className="text-[11px] text-stone-400 tracking-[0.04em] mt-1">{pedido.telefono}</p>
                )}
              </div>
            </div>
          )}

          {/* Referencia de pago */}
          {pedido.paymentId && (
            <div>
              <p style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-400 uppercase mb-1">
                Referencia de pago
              </p>
              <p className="text-[11px] text-stone-500 tracking-[0.04em] font-mono">
                MP #{pedido.paymentId}
              </p>
            </div>
          )}

          {/* Guía de envío */}
          {pedido.trackingNumber && (
            <div className="border border-stone-100 p-4 bg-stone-50">
              <p style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-400 uppercase mb-3">
                Información de envío
              </p>
              {pedido.trackingCompany && (
                <p className="text-[10px] text-stone-400 tracking-[0.08em] uppercase mb-1">
                  {pedido.trackingCompany}
                </p>
              )}
              <p className="text-[15px] font-bold text-stone-900 tracking-[0.1em] font-mono mb-3">
                {pedido.trackingNumber}
              </p>
              {pedido.trackingUrl && (
                <a
                  href={pedido.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ letterSpacing: '0.15em' }}
                  className="inline-block text-[9px] font-bold text-stone-900 uppercase border-b border-stone-900 pb-0.5 hover:text-stone-500 transition-colors"
                >
                  Rastrear pedido →
                </a>
              )}
            </div>
          )}

          {/* Total */}
          <div className="border-t border-stone-100 pt-4 mt-auto">
            {tieneDescuento && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ letterSpacing: '0.15em' }} className="text-[9px] text-stone-400 uppercase">
                    Subtotal
                  </span>
                  <span className="text-[11px] text-stone-300 line-through">
                    {formatPrecio(pedido.totalOriginal)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ letterSpacing: '0.1em', color: '#DFCDB4' }} className="text-[9px] uppercase flex items-center gap-1">
                    <span>✦</span> Descuento bienvenida −10%
                  </span>
                  <span style={{ color: '#DFCDB4' }} className="text-[11px]">
                    −{formatPrecio(pedido.totalOriginal - pedido.totalPrice.amount)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span style={{ letterSpacing: '0.2em' }} className="text-[10px] font-bold text-stone-900 uppercase">
                Total pagado
              </span>
              <span className="text-[18px] font-bold text-stone-900">
                {formatPrecio(pedido.totalPrice.amount)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function OrdenCard({ pedido, imagenMap }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border transition-colors duration-200 ${open ? 'border-stone-300' : 'border-stone-100 hover:border-stone-200'}`}>
      {/* Header de la card */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ letterSpacing: '0.15em' }} className="text-[12px] font-bold text-stone-900 uppercase">
              {pedido.name}
            </span>
            <span className="text-[10px] text-stone-400 tracking-[0.08em]">
              {formatFecha(pedido.processedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <EstadoBadge status={pedido.financialStatus} />
            <EstadoBadge status={pedido.fulfillmentStatus} />
            {pedido.descuentoAplicado && (
              <span style={{ color: '#DFCDB4', letterSpacing: '0.12em' }} className="text-[8px] font-bold uppercase flex items-center gap-1">
                ✦ −10%
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p style={{ letterSpacing: '0.05em' }} className="text-[16px] font-bold text-stone-900">
              {formatPrecio(pedido.totalPrice.amount)}
            </p>
            <p className="text-[9px] text-stone-400 tracking-[0.1em] uppercase mt-0.5">
              {pedido.items.length} {pedido.items.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
          <div className="text-stone-400">
            <ChevronIcon open={open} />
          </div>
        </div>
      </button>

      {/* Precio visible en móvil */}
      <div className="sm:hidden px-6 pb-4 -mt-2 flex justify-between items-center">
        <p style={{ letterSpacing: '0.08em' }} className="text-[9px] text-stone-400 uppercase">
          {pedido.items.length} {pedido.items.length === 1 ? 'producto' : 'productos'}
        </p>
        <p className="text-[15px] font-bold text-stone-900">
          {formatPrecio(pedido.totalPrice.amount)}
        </p>
      </div>

      {/* Detalle expandible */}
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {open && <OrdenDetalle pedido={pedido} imagenMap={imagenMap} />}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { wishlist, clearWishlist } = useWishlist();
  const [cliente, setCliente]         = useState(null);
  const [pedidos, setPedidos]         = useState([]);
  const [allProductos, setAllProductos] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('pedidos');
  const [imagenMap, setImagenMap]     = useState({});

  useEffect(() => {
    if (!estaAutenticado()) { navigate('/login', { replace: true }); return; }
    const c = getCliente();
    setCliente(c);

    Promise.all([
      getPedidos(),
      getProductos(),
    ])
      .then(([pedidosData, productos]) => {
        setPedidos(pedidosData);
        setAllProductos(productos);
        const map = {};
        productos.forEach(p => { map[p.nombre] = p.imagen1; });
        setImagenMap(map);
      })
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

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 pt-[160px] pb-24">

        {/* Header */}
        <div className="flex items-end justify-between mb-12 border-b border-stone-200 pb-6">
          <div>
            <p style={{ letterSpacing: '0.3em' }} className="text-[9px] text-stone-400 uppercase font-medium mb-1">
              Mi Cuenta
            </p>
            <h1 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
              {cliente?.firstName} <strong className="font-bold">{cliente?.lastName}</strong>
            </h1>
            <p className="text-[11px] text-stone-400 mt-1 tracking-[0.1em]">{cliente?.email}</p>
          </div>
          <button
            onClick={() => { clearWishlist(); cerrarSesion(); navigate('/'); }}
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
            { label: 'Mis Deseos',  value: 'deseos'  },
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
          <div className="flex flex-col gap-3">
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
              pedidos.map(pedido => (
                <OrdenCard key={pedido.id} pedido={pedido} imagenMap={imagenMap} />
              ))
            )}
          </div>
        )}

        {/* ── DESEOS ── */}
        {activeTab === 'deseos' && (() => {
          const wishlistProductos = allProductos.filter(p => wishlist.includes(p.id));
          return wishlistProductos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-stone-300">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <p style={{ letterSpacing: '0.3em' }} className="text-[9px] font-bold uppercase text-stone-300">
                Sin piezas guardadas
              </p>
              <button
                onClick={() => navigate('/categoria')}
                style={{ letterSpacing: '0.2em' }}
                className="mt-2 text-[10px] font-bold text-stone-900 uppercase border-b border-stone-900 pb-0.5 hover:text-stone-500 transition-colors"
              >
                Explorar colección →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
              {wishlistProductos.map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          );
        })()}

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
