import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, createContext } from 'react'; // ── NUEVO: Importamos useState y createContext

import Header from './sections/Header';
import Footer from './sections/Footer';
import HomePage from './pages/HomePage';
import CategoriaPage from './pages/CategoriaPage';

// ── 1. NUEVO: CREAMOS EL CONTEXTO DEL CARRITO ──
export const CartContext = createContext();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  // ── 2. NUEVO: ESTADO GLOBAL DEL CARRITO ──
  const [cartCount, setCartCount] = useState(0);
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  // Función que llamaremos desde los productos
  const addToCart = () => {
    setCartCount((prev) => prev + 1);
    setIsCartAnimating(true);
    // Quitamos la animación de rebote después de 300ms
    setTimeout(() => setIsCartAnimating(false), 300);
  };

  return (
    // ── 3. NUEVO: ENVOLVEMOS LA APP CON EL PROVIDER ──
    <CartContext.Provider value={{ cartCount, addToCart, isCartAnimating }}>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-white font-sans flex flex-col">
          <Header />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categoria" element={<CategoriaPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </CartContext.Provider>
  );
}

export default App;