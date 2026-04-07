import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { CartProvider, CartContext } from './context/CartContext';

import Header from './sections/Header';
import Footer from './sections/Footer';

const HomePage     = lazy(() => import('./pages/HomePage'));
const CategoriaPage = lazy(() => import('./pages/CategoriaPage'));
const ProductPage  = lazy(() => import('./pages/ProductPage'));
const ContactPage  = lazy(() => import('./pages/ContactPage'));

// Re-export CartContext so existing imports keep working
export { CartContext };

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppShell() {
  return (
    <Router>
      <ScrollToTop />
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
              <Route path="/"              element={<HomePage />} />
              <Route path="/categoria"     element={<CategoriaPage />} />
              <Route path="/categoria/:id" element={<CategoriaPage />} />
              <Route path="/producto/:id"  element={<ProductPage />} />
              <Route path="/contacto"      element={<ContactPage />} />
            </Routes>
          </Suspense>
        </div>

        <Footer />

        <Toast />
      </div>
    </Router>
  );
}

import { useContext } from 'react';

function Toast() {
  const { showToast } = useContext(CartContext);
  return (
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
  );
}

function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  );
}

export default App;
