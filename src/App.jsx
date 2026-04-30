import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy, useState, useContext, Component } from 'react';
import { trackPageView } from './lib/analytics';
import { CartProvider, CartContext } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
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
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage      = lazy(() => import('./pages/ResetPasswordPage'));
const OrdenConfirmadaPage    = lazy(() => import('./pages/OrdenConfirmadaPage'));
const WishlistPage           = lazy(() => import('./pages/WishlistPage'));

export { CartContext };

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error('[PAVOA] Error de renderizado:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
          <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500">
            Algo salió mal. Por favor recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Analytics() {
  const { pathname } = useLocation();
  useEffect(() => { trackPageView(pathname); }, [pathname]);
  return null;
}

const RUTAS_LIMPIAS = ['/login', '/register', '/verify-email', '/verify', '/forgot-password', '/reset-password'];

function AppShell() {
  const { pathname } = useLocation();
  const esRutaLimpia = RUTAS_LIMPIAS.includes(pathname);

  return (
    <>
      <ScrollToTop />
      <Analytics />
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
          <ErrorBoundary>
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
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password"   element={<ResetPasswordPage />} />
              <Route path="/orden-confirmada" element={<OrdenConfirmadaPage />} />
              <Route path="/wishlist"         element={<WishlistPage />} />
              <Route path="*"              element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </div>

        {!esRutaLimpia && <Footer />}
        <Toast />
      </div>
    </>
  );
}

function Toast() {
  const { showToast, toastKey } = useContext(CartContext);
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${
      showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}>
      <div className="relative bg-stone-900 text-white px-6 py-3 shadow-2xl flex items-center gap-3 border border-stone-800 overflow-hidden">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
          {showToast}
        </span>
        <div className="w-4 h-4 flex items-center justify-center bg-stone-700 rounded-full flex-shrink-0">
          <span className="text-[8px]">✓</span>
        </div>
        {showToast && (
          <div
            key={toastKey}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
            style={{ background: 'var(--color-gold)', animation: 'progress-shrink 3s linear forwards' }}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <Router>
          <AppShell />
        </Router>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;