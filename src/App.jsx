import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// Añadimos Suspense y lazy aquí
import { useEffect, useState, createContext, Suspense, lazy } from 'react'; 

import Header from './sections/Header';
import Footer from './sections/Footer';

// Convertimos las páginas a Lazy Imports
const HomePage = lazy(() => import('./pages/HomePage'));
const CategoriaPage = lazy(() => import('./pages/CategoriaPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));

export const CartContext = createContext();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ... (Tu función App con los estados se mantiene igual)

function App() {
  const [cartItems, setCartItems] = useState([]); 
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [showToast, setShowToast] = useState(null); 

  const addToCart = (producto, talla) => {
    setCartItems((prev) => {
      const itemExistente = prev.find(item => item.producto.id === producto.id && item.talla === talla);
      
      if (itemExistente) {
        return prev.map(item => 
          item.producto.id === producto.id && item.talla === talla 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prev, { producto, talla, cantidad: 1 }];
    });

    setIsCartAnimating(true);
    setShowToast(`${producto.nombre} añadido`);
    
    setTimeout(() => setIsCartAnimating(false), 300);
    setTimeout(() => setShowToast(null), 3000);
  };

  const removeFromCart = (productoId, talla) => {
    setCartItems(prev => prev.filter(item => !(item.producto.id === productoId && item.talla === talla)));
  };

  const updateQuantity = (productoId, talla, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.producto.id === productoId && item.talla === talla) {
        const nuevaCantidad = item.cantidad + delta;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
      }
      return item;
    }));
  };

  const cartCount = cartItems.reduce((total, item) => total + item.cantidad, 0);

  const cartTotal = cartItems.reduce((total, item) => {
    const precioNumerico = parseInt(item.producto.precio.replace('$', '').replace(/\./g, ''));
    return total + (precioNumerico * item.cantidad);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, cartCount, cartTotal, 
      addToCart, removeFromCart, updateQuantity, isCartAnimating 
    }}>
      <Router>
        <ScrollToTop />
        
        {/* Contenedor principal que envuelve TODO */}
        <div className="min-h-screen bg-white font-sans flex flex-col relative">
          <Header />
          
          <div className="flex-grow">
            <Suspense fallback={
              <div className="min-h-[60vh] flex items-center justify-center bg-white">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 animate-pulse">
                  Cargando...
                </span>
              </div>
            }>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/categoria" element={<CategoriaPage />} />
                <Route path="/categoria/:id" element={<CategoriaPage />} />
                <Route path="/producto/:id" element={<ProductPage />} />
              </Routes>
            </Suspense>
          </div>
          
          <Footer />

          {/* COMPONENTE TOAST AHORA DENTRO DEL DIV PRINCIPAL */}
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${
            showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
            <div className="bg-stone-900 text-white px-6 py-3 shadow-2xl flex items-center gap-3 border border-stone-800">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
                {showToast}
              </span>
              <div className="w-4 h-4 flex items-center justify-center bg-stone-700 rounded-full">
                <span className="text-[8px]">✓</span>
              </div>
            </div>
          </div>
          
        </div>
      </Router>
    </CartContext.Provider>
  );
}

export default App;