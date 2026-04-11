import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy, useState, useContext } from 'react';
import { CartProvider, CartContext } from './context/CartContext';
import AnnouncementBar from './sections/AnnouncementBar';
import Header from './sections/Header';
import Footer from './sections/Footer';

const HomePage        = lazy(() => import('./pages/HomePage'));
const CategoriaPage   = lazy(() => import('./pages/CategoriaPage'));
const ProductPage     = lazy(() => import('./pages/ProductPage'));
const ContactPage     = lazy(() => import('./pages/ContactPage'));
const CheckoutPage    = lazy(() => import('./pages/CheckoutPage'));
const NotFoundPage    = lazy(() => import('./pages/NotFoundPage'));
const AccountPage     = lazy(() => import('./pages/AccountPage'));
const LoginPage       = lazy(() => import('./pages/LoginPage'));
const RegisterPage    = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));

export { CartContext };

const NUMERO_WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function WhatsAppButton() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  const ocultar = ['/checkout', '/login', '/register', '/verify-email'].includes(pathname);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (ocultar) return null;

  const handleClick = () => {
    const msg = encodeURIComponent('Hola PAVOA, tengo una pregunta sobre un producto 👋');
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${msg}`, '_blank');
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[90] flex items-center gap-3 transition-all duration-700 ease-out ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    }`}>
      <div className={`transition-all duration-300 ${tooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
        <div className="bg-stone-900 text-white text-[10px] tracking-[0.15em] uppercase px-4 py-2.5 whitespace-nowrap shadow-lg">
          ¿Tienes dudas?
        </div>
      </div>
      <button
        onClick={handleClick}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        aria-label="Contactar por WhatsApp"
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_28px_rgba(37,211,102,0.6)] hover:scale-110 transition-all duration-300"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.523 5.849L.057 23.487a.5.5 0 0 0 .609.61l5.717-1.498A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.953 9.953 0 0 1-5.193-1.452l-.36-.214-3.815 1.001.974-3.73-.233-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      </button>
    </div>
  );
}

const RUTAS_LIMPIAS = ['/login', '/register', '/verify-email', '/verify'];

function AppShell() {
  const { pathname } = useLocation();
  const esRutaLimpia = RUTAS_LIMPIAS.includes(pathname);

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-white font-sans flex flex-col relative">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[999] focus:bg-stone-900 focus:text-white focus:px-4 focus:py-2 focus:text-[11px] focus:tracking-[0.2em] focus:uppercase"
        >
          Saltar al contenido principal
        </a>

        {!esRutaLimpia && <AnnouncementBar />}
        {!esRutaLimpia && <Header />}

        <div className="flex-grow" id="main-content">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
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
              <Route path="/checkout"      element={<CheckoutPage />} />
              <Route path="/cuenta"        element={<AccountPage />} />
              <Route path="/login"         element={<LoginPage />} />
              <Route path="/register"      element={<RegisterPage />} />
              <Route path="/verify-email"  element={<VerifyEmailPage />} />
              <Route path="*"              element={<NotFoundPage />} />
              <Route path="/verify" element={<VerifyPage />} />
            </Routes>
          </Suspense>
        </div>

        {!esRutaLimpia && <Footer />}
        <WhatsAppButton />
        <Toast />
      </div>
    </>
  );
}

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
      <Router>
        <AppShell />
      </Router>
    </CartProvider>
  );
}

export default App;