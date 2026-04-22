import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { getProductos } from '../services/productService';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

export default function WishlistPage() {
  const { wishlist, getShareableUrl } = useWishlist();
  const [searchParams] = useSearchParams();

  const sharedIdsRaw = searchParams.get('ids');
  const isSharedView = !!sharedIdsRaw;
  const idsStr = useMemo(() => {
    if (isSharedView) return sharedIdsRaw || '';
    return wishlist.join(',');
  }, [isSharedView, sharedIdsRaw, wishlist.join(',')]);

  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [copiado, setCopiado]     = useState(false);

  useEffect(() => {
    const ids = idsStr ? idsStr.split(',').filter(Boolean) : [];
    if (ids.length === 0) { setProductos([]); setLoading(false); return; }
    setLoading(true);
    getProductos()
      .then(todos => { setProductos(todos.filter(p => ids.includes(p.id))); setLoading(false); })
      .catch(() => setLoading(false));
  }, [idsStr]);

  const handleCompartir = () => {
    const url = getShareableUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-white pt-[88px] md:pt-[104px]">
      <SEO
        title={isSharedView ? 'Lista de deseos — PAVOA' : 'Mis favoritos — PAVOA'}
        url="/wishlist"
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-2">
              {isSharedView ? 'Lista compartida' : 'Mis favoritos'}
            </p>
            <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase">
              {isSharedView ? 'Piezas elegidas' : <>Mis <strong className="font-bold">Piezas</strong></>}
            </h1>
          </div>

          {!isSharedView && wishlist.length > 0 && (
            <button
              onClick={handleCompartir}
              className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-900 border-b border-stone-900 pb-1 hover:opacity-60 transition-opacity"
            >
              {copiado ? '✓ Link copiado' : 'Compartir lista →'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-stone-100 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-stone-300">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400">
              {isSharedView ? 'Esta lista no tiene productos.' : 'Aún no tienes piezas guardadas.'}
            </p>
            {!isSharedView && (
              <Link to="/categoria" className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1">
                Explorar catálogo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
            {productos.map(p => <ProductCard key={p.id} producto={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
