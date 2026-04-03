import React from 'react';
import { Link } from 'react-router-dom';
import { productosDB } from '../data/db';

export default function CrossSelling({ currentProductId }) {
  // Filtramos la DB para excluir el producto actual y tomamos solo los primeros 3
  const recomendados = productosDB
    .filter(p => p.id !== currentProductId)
    .slice(0, 3);

  if (recomendados.length === 0) return null;

  return (
    <section className="w-full py-20 px-6 md:px-16 border-t border-stone-200 mt-12" style={{ fontFamily: 'var(--font-primary)' }}>
      <div className="max-w-[1400px] mx-auto">
        <h3 className="text-[10px] md:text-[11px] font-bold tracking-[0.3em] text-stone-900 uppercase text-center mb-12">
          Completa el look
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {recomendados.map(producto => (
            <Link 
              key={producto.id} 
              to={`/producto/${producto.id}`} 
              className="group cursor-pointer flex flex-col gap-4"
              onClick={() => window.scrollTo(0, 0)} // Para que al entrar suba la página
            >
              <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>
                <img src={producto.imagen1} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] group-hover:scale-105" />
                <img src={producto.imagen2} alt={producto.nombre} className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] opacity-0 group-hover:opacity-100 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <h4 className="text-[10px] md:text-[11px] font-bold text-stone-900 tracking-[0.15em] uppercase mb-1">
                  {producto.nombre}
                </h4>
                <p className="text-[11px] md:text-[12px] font-medium text-stone-500">
                  {producto.precio}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}