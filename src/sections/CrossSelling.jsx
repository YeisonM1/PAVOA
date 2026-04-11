import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProductos } from '../services/productService';
import { productImage } from '../utils/imageUrl';

export default function CrossSelling({ currentProductId }) {
  const [productosSugeridos, setProductosSugeridos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarSugerencias = async () => {
      const todosLosProductos = await getProductos();
      
      // ── LA SOLUCIÓN ESTÁ AQUÍ ──
      // Envolvemos ambos en String() para que compare "1" con "1" y lo elimine correctamente
      const sugerencias = todosLosProductos
        .filter(p => String(p.id) !== String(currentProductId))
        .slice(0, 4);
        
      setProductosSugeridos(sugerencias);
      setLoading(false);
    };

    cargarSugerencias();
  }, [currentProductId]);

  if (loading) return null; 
  if (productosSugeridos.length === 0) return null; 

  return (
    <section className="w-full bg-stone-50 py-24 px-6 md:px-12 lg:px-16 border-t border-stone-200">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center mb-16 text-center">
          <span className="text-[10px] text-stone-500 tracking-[0.2em] uppercase font-bold mb-3">Recomendaciones</span>
          <h2 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
            Completa el look
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {productosSugeridos.map((producto) => (
            <Link key={producto.id} to={`/producto/${producto.id}`} className="group cursor-pointer flex flex-col gap-4 relative block">
              <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '3/4' }}>
                <img src={productImage(producto.imagen1)} alt={producto.nombre} width={600} height={800} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {producto.imagen2 && (
                  <img src={productImage(producto.imagen2)} alt={producto.nombre} width={600} height={800} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}
              </div>
              <div className="text-center mt-4">
                <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-900">{producto.nombre}</h3>
                <p className="text-[12px] font-medium text-stone-500 mt-1">{producto.precio}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}