import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { CartContext } from '../App';
import CrossSelling from '../sections/CrossSelling';
import { getProductoById } from '../services/productService'; // Conexión a DB
import SEO from '../components/SEO';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  
  // Estados para la carga de datos
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagenActiva, setImagenActiva] = useState(null); // 👈 NUEVO ESTADO

  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [adding, setAdding] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('detalles');

  // Cargamos el producto desde Supabase al entrar a la página
  useEffect(() => {
    const cargarProducto = async () => {
      setLoading(true);
      const data = await getProductoById(id);
      setProducto(data);
      if (data) setImagenActiva(data.imagen1); // 👈 Asignamos la imagen principal al cargar
      setLoading(false);
    };
    cargarProducto();
    window.scrollTo(0, 0); // Sube la pantalla al inicio
  }, [id]);

  const handleAddToCart = () => {
    if (!tallaSeleccionada) {
      alert("Por favor, selecciona una talla primero.");
      return;
    }
    setAdding(true);
    addToCart(producto, tallaSeleccionada);
    setTimeout(() => {
      setAdding(false);
      setTallaSeleccionada(null); 
    }, 1000);
  };

  const toggleAccordion = (seccion) => {
    setOpenAccordion(openAccordion === seccion ? null : seccion);
  };

  // ── PANTALLAS DE CARGA Y ERROR ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: 'var(--font-primary)' }}>
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 animate-pulse">Cargando pieza...</span>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6" style={{ fontFamily: 'var(--font-primary)' }}>
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-900">Pieza no encontrada</span>
        <Link to="/" className="text-[10px] tracking-[0.2em] uppercase border-b border-stone-900 pb-1">Volver al inicio</Link>
      </div>
    );
  }

  // ── PROTECCIÓN DE DATOS (Si están vacíos en Supabase, ponemos valores por defecto) ──
  const detallesArray = producto.detalles ? producto.detalles.split(',') : ['Diseño exclusivo PAVOA', 'Material de alta compresión'];
  const cuidadosTexto = producto.cuidados || 'Lavar a máquina en frío con colores similares. No usar secadora.';

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-primary)' }}>

    <SEO
      title={producto.nombre}
      description={producto.descripcion || `Compra ${producto.nombre} en PAVOA. Alta calidad deportiva con envío a toda Colombia.`}
      url={`/producto/${id}`}
    />

      <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto pt-[72px] md:pt-[88px]">
        
        {/* ── COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES ── */}
        <div className="w-full lg:w-3/5 flex flex-col gap-4 lg:p-4">
          
          {/* Imagen Principal (Mediana) */}
          <div className="w-full bg-stone-100 overflow-hidden relative">
            <img 
              key={imagenActiva}
              src={imagenActiva} 
              alt={producto.nombre}
              width={900} height={1200}
              className="w-full h-auto object-cover animate-fade-in" 
              style={{ maxHeight: '75vh' }}
            />
          </div>

          {/* Fila de Miniaturas (Thumbnails) */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[producto.imagen1, producto.imagen2].filter(Boolean).map((img, index) => (
              <button
                key={index}
                onClick={() => setImagenActiva(img)}
                className={`w-20 h-24 flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                  imagenActiva === img ? 'border-stone-900 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`${producto.nombre} vista ${index + 1}`}
                  width={80} height={96}
                  className="w-full h-full object-cover" 
                  loading="lazy" />
              </button>
            ))}
          </div>

        </div>

        {/* ── COLUMNA DERECHA: INFORMACIÓN STICKY ── */}
        <div className="w-full lg:w-2/5 px-6 py-12 lg:px-16 lg:py-24 relative">
          <div className="lg:sticky lg:top-[120px]">
            
            {/* Navegación (Breadcrumb) - Ajustado a lo que pidió tu clienta */}
            <nav className="mb-8">
              <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex flex-wrap items-center">
                <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link> 
                <span className="mx-2">/</span> 
                <Link to="/categoria" className="hover:text-stone-900 transition-colors">Catálogo</Link>
                <span className="mx-2">/</span> 
                
                {producto.categoria && (
                  <>
                    <Link to={`/categoria/${producto.categoria.toLowerCase()}`} className="hover:text-stone-900 transition-colors">
                      {producto.categoria}
                    </Link>
                    <span className="mx-2">/</span> 
                  </>
                )}
                <span className="text-stone-900 font-bold">{producto.nombre}</span>
              </span>
            </nav>

            <h1 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
              {producto.nombre}
            </h1>
            <p className="text-sm md:text-base font-medium text-stone-600 tracking-[0.1em] mb-10">
              {producto.precio}
            </p>

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

            {/* Botón Añadir */}
            <button 
              onClick={handleAddToCart}
              className={`w-full h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
                ${adding ? 'bg-stone-800 text-white border border-stone-800 scale-[0.98]' : 'bg-stone-900 text-white hover:bg-stone-800'}
              `}
            >
              {adding ? 'Agregado ✔' : 'Añadir a la bolsa'}
            </button>

            <div className="w-full h-[1px] bg-stone-200 my-12" />

            <div className="flex flex-col">
              {/* Acordeón: Detalles */}
              <div className="border-b border-stone-200">
                <button onClick={() => toggleAccordion('detalles')} className="w-full py-6 flex items-center justify-between text-left group">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Detalles del diseño</span>
                  {openAccordion === 'detalles' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'detalles' ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <ul className="list-disc pl-4 flex flex-col gap-2">
                    {detallesArray.map((detalle, idx) => (
                      <li key={idx} className="text-[11px] text-stone-600 tracking-[0.1em] uppercase">{detalle.trim()}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Acordeón: Cuidados */}
              <div className="border-b border-stone-200">
                <button onClick={() => toggleAccordion('cuidados')} className="w-full py-6 flex items-center justify-between text-left group">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-stone-900 uppercase">Composición y Cuidados</span>
                  {openAccordion === 'cuidados' ? <Minus size={14} className="text-stone-500" /> : <Plus size={14} className="text-stone-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'cuidados' ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <p className="text-[11px] text-stone-600 tracking-[0.1em] leading-relaxed uppercase">
                    {cuidadosTexto}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CrossSelling */}
      <CrossSelling currentProductId={producto.id} />
    </div>
  );
}