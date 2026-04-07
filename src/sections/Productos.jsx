import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProductos } from '../services/productService';
import ProductCard from '../components/ProductCard'

// ─────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────
const TABS = [
  { label: 'NUEVO',       value: 'nuevo'      },
  { label: 'MÁS VENDIDO', value: 'bestseller' },
  { label: 'TENDENCIA',   value: 'tendencia'  },
];

// ─────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 w-[75vw] sm:w-[45vw] md:w-full flex-shrink-0 snap-center animate-pulse">
      <div className="bg-stone-200 w-full relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200" />
      </div>
      <div className="flex flex-col items-center gap-2 mt-1.5">
        <div className="h-2.5 w-24 bg-stone-200 rounded" />
        <div className="h-3 w-16 bg-stone-100 rounded" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SECCIÓN PRINCIPAL — Tu Segunda Piel
// ─────────────────────────────────────────
export default function Productos() {
  const [productos, setProductos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('nuevo');

  useEffect(() => {
    const cargarProductos = async () => {
      const datos = await getProductos();
      setProductos(datos);
      setLoading(false);
    };
    cargarProductos();
  }, []);

  // Filtrar por tab activo
  const productosFiltrados = productos.filter(
    (p) => p.tag?.toLowerCase() === activeTab
  );

  // Skeleton
  if (loading) {
    return (
      <section className="w-full bg-white py-24 px-6 md:px-12 lg:px-16 overflow-hidden relative" id="catalogo">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-12 border-b border-stone-200 pb-6">
            <div className="flex flex-col gap-2">
              <div className="h-2 w-24 bg-stone-200 animate-pulse" />
              <div className="h-5 w-48 bg-stone-200 animate-pulse" />
            </div>
          </div>
          <div className="flex overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-24 px-6 md:px-12 lg:px-16 overflow-hidden relative" id="catalogo">
      <div className="max-w-[1400px] mx-auto">

        {/* Header de sección */}
        <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] text-stone-500 tracking-[0.3em] uppercase font-medium">
              Nueva Temporada
            </span>
            <h2 style={{ fontFamily: 'var(--font-primary)' }} className="text-lg md:text-xl font-light text-stone-900 tracking-[0.2em] uppercase">
              TU SEGUNDA <strong className="font-bold">PIEL</strong>
            </h2>
          </div>
          <Link
            to="/categoria"
            style={{ fontFamily: 'var(--font-primary)', letterSpacing: '0.15em' }}
            className="text-[10px] font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase flex items-center gap-2 group"
          >
            Ver todo
            <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Tabs de filtro */}
        <div className="flex gap-0 mb-10 border-b border-stone-100">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{ fontFamily: 'var(--font-primary)' }}
              className={`relative pb-3 px-5 text-[10px] font-bold tracking-[0.25em] uppercase transition-colors duration-200
                ${activeTab === tab.value ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}
              `}
            >
              {tab.label}
              {/* Línea indicadora activa */}
              <span
                className="absolute bottom-0 left-0 w-full h-[1.5px] transition-all duration-300 ease-out"
                style={{
                  background:  activeTab === tab.value ? 'var(--color-gold)' : 'transparent',
                  transform:   activeTab === tab.value ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                }}
              />
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        {productosFiltrados.length > 0 ? (
          <div
            className="flex overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {productosFiltrados.map(p => (
              <ProductCard key={p.id} producto={p} />
            ))}
            <div className="w-[10vw] md:hidden flex-shrink-0" aria-hidden="true" />
          </div>
        ) : (
          // Estado vacío — cuando no hay productos con ese tag
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span style={{ fontFamily: 'var(--font-primary)' }} className="text-[9px] font-bold tracking-[0.3em] uppercase text-stone-300">
              Próximamente
            </span>
            <p style={{ fontFamily: 'var(--font-primary)' }} className="text-[11px] tracking-[0.15em] text-stone-400 uppercase">
              Nuevas piezas en camino
            </p>
          </div>
        )}
      </div>
    </section>
  );
}