import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, createContext } from 'react';

import Header from './sections/Header';
import Footer from './sections/Footer';
import HomePage from './pages/HomePage';
import CategoriaPage from './pages/CategoriaPage';
import ProductPage from './pages/ProductPage';

export const CartContext = createContext();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  // ── ESTADO AVANZADO DEL CARRITO ──
  const [cartItems, setCartItems] = useState([]); // Guardará objetos reales
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  // Función para agregar un producto real con su talla
  const addToCart = (producto, talla) => {
    setCartItems((prev) => {
      // Verificamos si ya existe ese producto con esa misma talla
      const itemExistente = prev.find(item => item.producto.id === producto.id && item.talla === talla);
      
      if (itemExistente) {
        // Si existe, le sumamos 1 a la cantidad
        return prev.map(item => 
          item.producto.id === producto.id && item.talla === talla 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      // Si no existe, lo agregamos como nuevo
      return [...prev, { producto, talla, cantidad: 1 }];
    });

    setIsCartAnimating(true);
    setTimeout(() => setIsCartAnimating(false), 300);
  };

  // Función para eliminar un producto
  const removeFromCart = (productoId, talla) => {
    setCartItems(prev => prev.filter(item => !(item.producto.id === productoId && item.talla === talla)));
  };

  // Función para cambiar la cantidad (+ o -)
  const updateQuantity = (productoId, talla, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.producto.id === productoId && item.talla === talla) {
        const nuevaCantidad = item.cantidad + delta;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
      }
      return item;
    }));
  };

  // Calculamos el número total de artículos
  const cartCount = cartItems.reduce((total, item) => total + item.cantidad, 0);

  // Calculamos el precio total (Convertimos "$280.000" a número)
  const cartTotal = cartItems.reduce((total, item) => {
    const precioNumerico = parseInt(item.producto.precio.replace('$', '').replace(/\./g, ''));
    return total + (precioNumerico * item.cantidad);
  }, 0);

  return (
    // Pasamos todas estas nuevas herramientas a la app
    <CartContext.Provider value={{ 
      cartItems, cartCount, cartTotal, 
      addToCart, removeFromCart, updateQuantity, isCartAnimating 
    }}>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-white font-sans flex flex-col">
          <Header />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categoria" element={<CategoriaPage />} />
              <Route path="/categoria/:id" element={<CategoriaPage />} />
              <Route path="/producto/:id" element={<ProductPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </CartContext.Provider>
  );
}

export default App;