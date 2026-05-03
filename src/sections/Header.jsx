import { useState, useEffect, useRef, useContext } from 'react';
import {
  Menu,
  User,
  ShoppingBag,
  X,
  Search,
  Package,
  CircleUserRound,
  Heart,
  LogOut,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/LOGO-PAVOA.svg';
import logoPavo from '../assets/Pavoa Logo Negro Sin Fondo.svg';
import { CartContext } from '../App';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import MegaMenu from './header/MegaMenu';
import MobileMenu from './header/MobileMenu';
import { InstagramIcon, FacebookIcon } from '../components/Icons';
import { estaAutenticado, getCliente, cerrarSesion } from '../services/authService';
import useSiteSettings from '../hooks/useSiteSettings';

const Header = () => {
  const settings = useSiteSettings();
  const { cartCount, isCartAnimating } = useContext(CartContext);
  const [cartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const megaRef = useRef(null);
  const panelRef = useRef(null);
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const autenticado = estaAutenticado();
  const usuario = getCliente();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setIsScrolled(currentY > 20);
          const headerEl = document.querySelector('header');
          const headerH = (headerEl?.offsetHeight ?? 72) + 36;
          document.documentElement.style.setProperty('--sticky-top', `${headerH}px`);
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
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = (menuOpen || cartOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, cartOpen]);

  return (
    <>
      <header
        className={`fixed top-9 left-0 w-full z-50 border-b ${
          isScrolled ? 'border-white/10 py-1 md:py-2 shadow-lg' : 'border-transparent py-2 md:py-4'
        } backdrop-blur-md`}
        style={{
          background: isScrolled ? 'rgba(242, 228, 225, 0.98)' : 'rgba(242, 228, 225, 0.92)',
          transition: 'background 500ms, box-shadow 500ms, padding 500ms',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <button
              className="md:hidden text-stone-800 mr-4 hover:text-stone-500 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu principal'}
              aria-expanded={menuOpen}
            >
              {menuOpen
                ? <X size={22} strokeWidth={1.5} aria-hidden="true" />
                : <Menu size={22} strokeWidth={1.5} aria-hidden="true" />}
            </button>

            <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium tracking-[0.18em]">
              <Link
                to="/"
                onClick={() => window.scrollTo(0, 0)}
                className="transition-opacity hover:opacity-70 relative group"
                style={{ color: '#3E2723' }}
              >
                INICIO
                <span
                  className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ background: 'var(--color-gold)' }}
                />
              </Link>

              <div className="relative" ref={megaRef}>
                <button
                  onClick={() => setCatalogoOpen(v => !v)}
                  aria-expanded={catalogoOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 500,
                    letterSpacing: '0.2em',
                    color: '#3E2723',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span style={{ position: 'relative' }}>
                    CATALOGO
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        height: 1,
                        width: catalogoOpen ? '100%' : '0%',
                        background: 'var(--color-gold)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 7,
                      height: 7,
                      borderRight: '1.5px solid #3E2723',
                      borderBottom: '1.5px solid #3E2723',
                      transform: catalogoOpen ? 'rotate(-135deg)' : 'rotate(45deg)',
                      verticalAlign: 'middle',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </button>
              </div>

              <Link
                to="/contacto"
                onClick={() => window.scrollTo(0, 0)}
                className="transition-opacity hover:opacity-70 relative group"
                style={{ color: '#3E2723' }}
              >
                CONTACTO
                <span
                  className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ background: 'var(--color-gold)' }}
                />
              </Link>
            </nav>
          </div>

          <div className="flex-1 flex justify-center">
            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
              <div className="flex items-center justify-center gap-0 md:gap-0.5">
                <img
                  src={logo}
                  alt="PAVOA"
                  width={180}
                  height={72}
                  className="h-14 md:h-20 w-auto object-contain transition-transform duration-500"
                />
                <img
                  src={logoPavo}
                  alt=""
                  aria-hidden="true"
                  width={38}
                  height={60}
                  className="h-10 md:h-[3.35rem] w-auto object-contain"
                />
              </div>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-end gap-5 text-stone-900">
            <div className="hidden sm:flex items-center gap-4">
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                aria-label="Siguenos en Instagram"
              >
                <InstagramIcon />
              </a>
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                aria-label="Siguenos en Facebook"
              >
                <FacebookIcon />
              </a>
            </div>

            <div className="w-[1px] h-4 bg-stone-200 hidden sm:block" />

            <button
              onClick={() => setIsSearchOpen(true)}
              className="hover:text-stone-900 transition-colors"
              aria-label="Abrir busqueda"
            >
              <Search size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>

            <div className="relative" ref={accountRef}>
              <button
                onClick={() => {
                  if (!autenticado) { navigate('/login'); return; }
                  setAccountOpen(v => !v);
                }}
                className="hover:text-stone-900 transition-colors relative"
                aria-label={autenticado ? 'Abrir menu de cuenta' : 'Iniciar sesion'}
                aria-haspopup={autenticado ? 'menu' : undefined}
                aria-expanded={autenticado ? accountOpen : undefined}
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

              {autenticado && (
                <div
                  className={`absolute right-0 top-full mt-1 w-64 z-[70] origin-top-right transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    accountOpen
                      ? 'opacity-100 translate-y-0 visible'
                      : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                  }`}
                  style={{
                    background: 'rgba(242, 228, 225, 0.98)',
                    border: '1px solid var(--color-border)',
                    borderTop: '1px solid var(--color-gold)',
                    boxShadow: '0 8px 30px rgba(11,11,11,0.08)',
                  }}
                >
                  <div className="px-4 py-3 border-b border-stone-200/70">
                    <p className="text-[8px] font-semibold tracking-[0.28em] uppercase text-stone-500">
                      Mi cuenta
                    </p>
                    <p className="text-[10px] text-stone-600 tracking-[0.08em] mt-1 truncate">
                      {usuario?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => { setAccountOpen(false); navigate('/cuenta?tab=pedidos'); }}
                    className="w-full px-4 py-3 text-left text-[10px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:bg-white/60 hover:text-stone-900 transition-colors flex items-center gap-3"
                  >
                    <Package size={15} strokeWidth={1.7} aria-hidden="true" />
                    Pedidos
                  </button>
                  <button
                    onClick={() => { setAccountOpen(false); navigate('/cuenta?tab=perfil'); }}
                    className="w-full px-4 py-3 text-left text-[10px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:bg-white/60 hover:text-stone-900 transition-colors flex items-center gap-3"
                  >
                    <CircleUserRound size={15} strokeWidth={1.7} aria-hidden="true" />
                    Cuenta
                  </button>
                  <button
                    onClick={() => { setAccountOpen(false); navigate('/cuenta?tab=deseos'); }}
                    className="w-full px-4 py-3 text-left text-[10px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:bg-white/60 hover:text-stone-900 transition-colors flex items-center gap-3"
                  >
                    <Heart size={15} strokeWidth={1.7} aria-hidden="true" />
                    Lista de deseos
                  </button>
                  <div className="h-px bg-stone-200/70" />
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      cerrarSesion();
                      navigate('/');
                    }}
                    className="w-full px-4 py-3 text-left text-[10px] font-bold tracking-[0.18em] uppercase text-stone-500 hover:bg-white/60 hover:text-stone-900 transition-colors flex items-center gap-3"
                  >
                    <LogOut size={15} strokeWidth={1.7} aria-hidden="true" />
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="hover:text-stone-900 transition-colors relative"
              aria-label={cartCount > 0 ? `Abrir carrito. Tienes ${cartCount} articulos` : 'Abrir carrito. Tu carrito esta vacio'}
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
      <MobileMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        instagramUrl={settings.instagramUrl}
        facebookUrl={settings.facebookUrl}
      />

      <CartDrawer cartOpen={cartOpen} setCartOpen={setCartOpen} />
      <SearchOverlay isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
    </>
  );
};

export default Header;
