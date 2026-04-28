import { useState, useEffect, useRef, useContext } from 'react';
import { Menu, User, ShoppingBag, X, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/LOGO-PAVOA.svg';
import { CartContext } from '../App';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import MegaMenu from './header/MegaMenu';
import MobileMenu from './header/MobileMenu';
import { InstagramIcon, FacebookIcon } from '../components/Icons';
import { estaAutenticado, getCliente } from '../services/authService';

const Header = () => {
  const { cartCount, isCartAnimating } = useContext(CartContext);
  const [cartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isScrolled, setIsScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [catalogoOpen, setCatalogoOpen] = useState(false);

  const megaRef  = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(estaAutenticado());
  const usuario = getCliente();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        megaRef.current && !megaRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setCatalogoOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (menuOpen || cartOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, cartOpen]);

  return (
    <>
      <header
        className={`fixed top-9 left-0 w-full z-50 transition-all duration-500 border-b ${
          isScrolled ? 'border-white/10 py-1 md:py-2 shadow-lg' : 'border-transparent py-2 md:py-4'
        } backdrop-blur-md`}
        style={{
          background: isScrolled ? 'rgba(242, 228, 225, 0.98)' : 'rgba(242, 228, 225, 0.92)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <button
              className="md:hidden text-stone-800 mr-4 hover:text-stone-500 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú principal"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} strokeWidth={1.5} aria-hidden="true" /> : <Menu size={22} strokeWidth={1.5} aria-hidden="true" />}
            </button>

            <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium tracking-[0.18em]">
              <Link
                to="/"
                onClick={() => window.scrollTo(0, 0)}
                className="transition-opacity hover:opacity-70 relative group"
                style={{ color: '#3E2723' }}
              >
                INICIO
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ background: 'var(--color-gold)' }} />
              </Link>

              <div className="relative" ref={megaRef}>
                <button
                  onClick={() => setCatalogoOpen(v => !v)}
                  aria-expanded={catalogoOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                  style={{
                    fontSize: '13.5px', fontWeight: 500,
                    letterSpacing: '0.2em', color: '#3E2723', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  <span style={{ position: 'relative' }}>
                    CATÁLOGO
                    <span style={{
                      position: 'absolute', bottom: 0, left: 0, height: 1,
                      width: catalogoOpen ? '100%' : '0%', background: 'var(--color-gold)',
                      transition: 'width 0.3s ease',
                    }} />
                  </span>
                  <span style={{
                    display: 'inline-block', width: 7, height: 7,
                    borderRight: '1.5px solid #3E2723', borderBottom: '1.5px solid #3E2723',
                    transform: catalogoOpen ? 'rotate(-135deg)' : 'rotate(45deg)',
                    verticalAlign: 'middle',
                    transition: 'transform 0.3s ease',
                  }} />
                </button>
              </div>

              <Link
                  to="/contacto"
                  onClick={() => window.scrollTo(0, 0)}
                  className="transition-opacity hover:opacity-70 relative group"
                  style={{ color: '#3E2723' }}
                >
                  CONTACTO
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                    style={{ background: 'var(--color-gold)' }} />
              </Link>
            </nav>
          </div>

          <div className="flex-1 flex justify-center">
            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
              <img
                src={logo}
                alt="PAVOA"
                width={160}
                height={72}
                className="h-14 md:h-20 w-auto object-contain transition-transform duration-500"
              />
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-end gap-5 text-stone-900">
            <div className="hidden sm:flex items-center gap-4">
              <a href="#" className="hover:text-stone-900 transition-colors" aria-label="Síguenos en Instagram"><InstagramIcon /></a>
              <a href="#" className="hover:text-stone-900 transition-colors" aria-label="Síguenos en Facebook"><FacebookIcon /></a>
            </div>
            <div className="w-[1px] h-4 bg-stone-200 hidden sm:block" />
            <button onClick={() => setIsSearchOpen(true)} className="hover:text-stone-900 transition-colors" aria-label="Abrir búsqueda">
              <Search size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
                  onClick={() => navigate(autenticado ? '/cuenta' : '/login')}
                  className="hover:text-stone-900 transition-colors relative"
                  aria-label={autenticado ? 'Ir a mi cuenta' : 'Iniciar sesión'}
                >
                  {autenticado && usuario ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: '#DFCDB4' }}
                    >
                      {usuario.firstName?.[0]?.toUpperCase()}{usuario.lastName?.[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <User size={20} strokeWidth={1.8} aria-hidden="true" />
                  )}
                </button>
            <button
              onClick={() => setCartOpen(true)}
              className="hover:text-stone-900 transition-colors relative"
              aria-label={cartCount > 0 ? `Abrir carrito. Tienes ${cartCount} artículos` : "Abrir carrito. Tu carrito está vacío"}
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {cartCount > 0 ? (
                <span
                  className={`absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white transition-transform duration-300 ${isCartAnimating ? 'scale-125' : 'scale-100'}`}
                  style={{ background: 'var(--color-gold)' }}
                >
                  {cartCount}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--color-black)' }} />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MegaMenu catalogoOpen={catalogoOpen} setCatalogoOpen={setCatalogoOpen} isScrolled={isScrolled} panelRef={panelRef} />
      <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <CartDrawer cartOpen={cartOpen} setCartOpen={setCartOpen} />
      <SearchOverlay isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
    </>
  );
};

export default Header;