import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { CartContext } from '../App';
import { productosDB } from '../data/db'; // Conectamos nuestra base de datos
import CrossSelling from '../sections/CrossSelling';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  
  // Buscamos el producto en nuestra DB. Si no existe, volvemos a la tienda.
  const producto = productosDB.find(p => p.id === id) || productosDB[0];

  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [adding, setAdding] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('detalles'); // Para los menús desplegables

  const handleAddToCart = () => {
    if (!tallaSeleccionada) {
      alert("Por favor, selecciona una talla primero.");
      return;
    }
    setAdding(true);
    addToCart(producto, tallaSeleccionada); // <--- CAMBIA ESTA LÍNEA
    setTimeout(() => {
      setAdding(false);
      setTallaSeleccionada(null); 
    }, 1000);
  };

  const toggleAccordion = (seccion) => {
    setOpenAccordion(openAccordion === seccion ? null : seccion);
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-primary)' }}>
      
      {/* ── LAYOUT EDITORIAL (Izquierda fotos, Derecha Info) ── */}
      <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto pt-[72px] md:pt-[88px]">
        
        {/* ── COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES ── */}
        <div className="w-full lg:w-3/5 flex flex-col gap-1 lg:gap-4 lg:p-4">
          <img src={producto.imagen1} alt={producto.nombre} className="w-full object-cover animate-fade-in" />
          <img src={producto.imagen2} alt={producto.nombre} className="w-full object-cover" />
        </div>

        {/* ── COLUMNA DERECHA: INFORMACIÓN STICKY ── */}
        <div className="w-full lg:w-2/5 px-6 py-12 lg:px-16 lg:py-24 relative">
          
          <div className="lg:sticky lg:top-[120px]">
            {/* Navegación (Breadcrumb) */}
            <nav className="mb-8">
              <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link> 
                <span className="mx-2">/</span> 
                <Link to="/categoria" className="hover:text-stone-900 transition-colors">Catálogo</Link>
                <span className="mx-2">/</span> 
                <span className="text-stone-900 font-bold">{producto.nombre}</span>
              </span>
            </nav>

            {/* Título y Precio */}
            <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
              {producto.nombre}
            </h1>
            <p className="text-sm md:text-base font-medium text-stone-600 tracking-[0.1em] mb-10">
              {producto.precio}
            </p>

            {/* Descripción */}
            <p className="text-[12px] md:text-[13px] text-stone-600 tracking-[0.1em] leading-relaxed mb-12 uppercase">
              {producto.descripcion}
            </p>

            {/* Selector de Tallas */}
            <div className="mb-10">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Talla</span>
                <button className="text-[9px] font-bold tracking-[0.15em] text-stone-400 hover:text-stone-900 uppercase underline transition-colors">
                  Guía de tallas
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {['S', 'M', 'L', 'XL'].map(talla => (
                  <button 
                    key={talla} 
                    onClick={() => setTallaSeleccionada(talla)}
                    className={`h-12 border flex items-center justify-center text-[11px] font-medium transition-colors uppercase
                      ${tallaSeleccionada === talla 
                        ? 'border-stone-900 bg-stone-900 text-white' 
                        : 'border-stone-200 text-stone-600 hover:border-stone-900'
                      }
                    `}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Añadir a la Bolsa */}
            <button 
              onClick={handleAddToCart}
              className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
                ${adding 
                  ? 'bg-stone-800 text-white border border-stone-800 scale-[0.98]' 
                  : 'bg-stone-900 text-white hover:bg-stone-800'
                }
              `}
            >
              {adding ? 'Agregado ✔' : 'Añadir a la bolsa'}
            </button>

            {/* Separador */}
            <div className="w-full h-[1px] bg-stone-200 my-12" />

            {/* Acordeones de Detalles y Cuidados */}
            <div className="flex flex-col">
              
              {/* Acordeón 1: Detalles */}
              <div className="border-b border-stone-200">
                <button 
                  onClick={() => toggleAccordion('detalles')}
                  className="w-full py-6 flex items-center justify-between text-left group"
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Detalles del diseño</span>
                  {openAccordion === 'detalles' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'detalles' ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <ul className="list-disc pl-4 flex flex-col gap-2">
                    {producto.detalles.map((detalle, idx) => (
                      <li key={idx} className="text-[11px] text-stone-600 tracking-[0.1em] uppercase">{detalle}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Acordeón 2: Cuidados */}
              <div className="border-b border-stone-200">
                <button 
                  onClick={() => toggleAccordion('cuidados')}
                  className="w-full py-6 flex items-center justify-between text-left group"
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Composición y Cuidados</span>
                  {openAccordion === 'cuidados' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'cuidados' ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <p className="text-[11px] text-stone-600 tracking-[0.1em] leading-relaxed uppercase">
                    {producto.cuidados}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
      <CrossSelling currentProductId={producto.id} />
    </div>
  );
}