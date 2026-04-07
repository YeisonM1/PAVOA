import { useState, useEffect, useRef, useContext } from 'react';
import { Menu, User, ShoppingBag, X, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/LOGO-PAVOA.svg';
import { CartContext } from '../App';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const mujerItems = [
  'Camisetas', 'Tops Deportivos', 'Sets', 'Buzos', 'Chaquetas',
  'Licras', 'Shorts', 'Faldas', 'Vestidos', 'Sudaderas',
  'Bikers', 'Accesorios', 'Pantalonetas',
  'Bodies', 'Enterizos', // ✅ NUEVO
];

const hombreItems = [
  'Pantalonetas', 'Camisetas', 'Buzos', 'Joggers',
];

const categoryImages = {
  'Camisetas':        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
  'Tops Deportivos':  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  'Sets':             'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
  'Buzos':            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  'Chaquetas':        'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=800&q=80',
  'Licras':           'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80',
  'Shorts':           'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80',
  'Faldas':           'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80',
  'Vestidos':         'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
  'Sudaderas':        'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
  'Bikers':           'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80',
  'Accesorios':       'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80',
  'Pantalonetas':     'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80',
  'Joggers':          'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80',
  // ✅ NUEVO
  'Bodies':           'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
  'Enterizos':        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
};

const defaultImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80';

// ✅ Estilo compartido para los títulos de sección (MUJER / HOMBRE)
// Subimos de fontSize:9 → 12 y añadimos un toque más de peso visual
const sectionTitleStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.32em',
  color: 'var(--color-gold)',
  marginBottom: 24,
};

const Header = () => {
  const { cartCount, isCartAnimating } = useContext(CartContext);
  const [cartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isScrolled, setIsScrolled]                 = useState(false);
  const [menuOpen, setMenuOpen]                     = useState(false);
  const [catalogoOpen, setCatalogoOpen]             = useState(false);
  const [mobileCatalogoOpen, setMobileCatalogoOpen] = useState(false);
  const [mobileTab, setMobileTab]                   = useState('mujer');
  const [hoveredItem, setHoveredItem]               = useState(null);
  
  const megaRef  = useRef(null);
  const panelRef = useRef(null); 

  useEffect(() => {
    Object.values(categoryImages).forEach((url) => {
      const img = new Image();
      img.src = url;
    });
    const defaultImg = new Image();
    defaultImg.src = defaultImage;
  }, []);

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

  const activeImage = hoveredItem ? (categoryImages[hoveredItem] || defaultImage) : defaultImage;

  const renderDesktopLink = (item, badge = null) => {
    const isHovered = hoveredItem === item;
    const isDimmed  = hoveredItem && !isHovered && hoveredItem !== 'destacados'; 
    
    return (
      <li key={item}>
        <Link
          to={`/categoria/${item.toLowerCase()}`}
          onClick={() => { setCatalogoOpen(false); window.scrollTo(0, 0); }}
          onMouseEnter={() => setHoveredItem(item)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`flex items-center gap-2.5 py-1.5 relative transition-all duration-300 ease-out ${
            isDimmed ? 'opacity-35' : 'opacity-100'
          } ${isHovered ? 'translate-x-1.5' : 'translate-x-0'}`}
        >
          <span className={`text-[10.5px] font-medium tracking-[0.18em] relative transition-colors duration-200 ${
            isHovered ? 'text-black' : 'text-stone-700'
          }`}>
            {item.toUpperCase()}
            <span 
              className="absolute -bottom-0.5 left-0 h-[1px] transition-all duration-300 ease-out"
              style={{ width: isHovered ? '100%' : '0%', background: 'var(--color-gold)' }} 
            />
          </span>
          {badge && (
            <span 
              className="text-[6.5px] font-semibold tracking-[0.1em] px-1 py-0.5 rounded-[2px] border"
              style={{
                color:       badge === 'NUEVO' ? 'var(--color-gold)' : 'var(--color-border)',
                borderColor: badge === 'NUEVO' ? 'var(--color-gold)' : 'var(--color-border)',
              }}
            >
              {badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
          isScrolled ? 'border-white/10 py-2 shadow-lg' : 'border-transparent py-4'
        } backdrop-blur-md`}
        style={{
          fontFamily: 'var(--font-primary)',
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
                    fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 500,
                    letterSpacing: '0.2em', color: '#3E2723', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  <span style={{ position: 'relative', paddingBottom: 2 }}>
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
                    marginTop: catalogoOpen ? '3px' : '-2px', transition: 'transform 0.3s ease, margin-top 0.3s ease',
                  }} />
                </button>
              </div>

              <a href="#contacto" className="transition-opacity hover:opacity-70 relative group" style={{ color: '#3E2723' }}>
                CONTACTO
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
                  style={{ background: 'var(--color-gold)' }} />
              </a>
            </nav>
          </div>

          <div className="flex-1 flex justify-center">
            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
              <img 
                src={logo} 
                alt="PAVOA" 
                className="h-14 md:h-20 w-auto object-contain transition-transform duration-500" 
              />
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-end gap-5 text-stone-900">
            <div className="hidden sm:flex items-center gap-4">
              <a href="#" className="hover:text-stone-900 transition-colors"><InstagramIcon /></a>
              <a href="#" className="hover:text-stone-900 transition-colors"><FacebookIcon /></a>
            </div>
            <div className="w-[1px] h-4 bg-stone-200 hidden sm:block" />
            <button onClick={() => setIsSearchOpen(true)} className="hover:text-stone-900 transition-colors" aria-label="Abrir búsqueda">
              <Search size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button className="hover:text-stone-900 transition-colors" aria-label="Ir a mi cuenta">
              <User size={20} strokeWidth={1.8} aria-hidden="true" />
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

      {/* ── MEGA MENÚ DESKTOP ── */}
      <div 
        style={{
          position: 'fixed', inset: 0, top: isScrolled ? '52px' : '68px', zIndex: 48,
          backgroundColor: 'rgba(20, 15, 15, 0.4)', backdropFilter: 'blur(3px)',
          opacity: catalogoOpen ? 1 : 0, pointerEvents: catalogoOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s ease, top 0.5s ease'
        }}
        onClick={() => setCatalogoOpen(false)}
      />

      <div
        ref={panelRef}
        style={{
          position: 'fixed', left: 0, right: 0, top: isScrolled ? '52px' : '68px', zIndex: 49,
          fontFamily: 'var(--font-primary)', background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-gold)', borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden', maxHeight: catalogoOpen ? '650px' : '0px', opacity: catalogoOpen ? 1 : 0,
          transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, top 0.5s ease',
          pointerEvents: catalogoOpen ? 'auto' : 'none', boxShadow: catalogoOpen ? '0 8px 40px rgba(11,11,11,0.08)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 64px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1.2fr', alignItems: 'start' }}>

          {/* ── COLUMNA MUJER ── */}
          <div style={{ paddingRight: 48 }}>
            {/* ✅ fontSize subido de 9 → 12, fontWeight 600 → 700 */}
            <p style={sectionTitleStyle}>MUJER</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 8 }}>SUPERIOR</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {renderDesktopLink('Camisetas')}
                  {renderDesktopLink('Tops Deportivos', 'BEST SELLER')}
                  {renderDesktopLink('Buzos')}
                  {renderDesktopLink('Chaquetas')}
                </ul>
              </div>
              <div>
                <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 8 }}>INFERIOR</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {renderDesktopLink('Licras')}
                  {renderDesktopLink('Shorts')}
                  {renderDesktopLink('Faldas')}
                  {renderDesktopLink('Sudaderas')}
                  {renderDesktopLink('Bikers')}
                  {renderDesktopLink('Pantalonetas')}
                </ul>
              </div>
              <div>
                <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 8 }}>OTROS</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {renderDesktopLink('Sets', 'NUEVO')}
                  {renderDesktopLink('Vestidos')}
                  {renderDesktopLink('Bodies', 'NUEVO')}   {/* ✅ NUEVO */}
                  {renderDesktopLink('Enterizos', 'NUEVO')} {/* ✅ NUEVO */}
                  {renderDesktopLink('Accesorios')}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--color-gold)', alignSelf: 'stretch' }} />

          {/* ── COLUMNA HOMBRE ── */}
          <div style={{ paddingLeft: 48, paddingRight: 48, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div>
              {/* ✅ fontSize subido de 9 → 12, fontWeight 600 → 700 */}
              <p style={sectionTitleStyle}>HOMBRE</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {renderDesktopLink('Pantalonetas')}
                {renderDesktopLink('Camisetas')}
                {renderDesktopLink('Buzos')}
                {renderDesktopLink('Joggers', 'BEST SELLER')}
              </ul>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 12 }}>DESTACADOS</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'VER TODO HOMBRE →', href: '/categoria/hombre' },
                  { label: 'GUÍA DE TALLAS',    href: '#tallas' },
                  { label: 'COLECCIÓN ESSENTIAL', href: '/categoria/essential' }
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      onClick={() => { setCatalogoOpen(false); window.scrollTo(0, 0); }}
                      onMouseEnter={() => setHoveredItem('destacados')}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{ 
                        display: 'inline-flex', alignItems: 'center', textDecoration: 'none',
                        fontSize: 9.5, fontWeight: 500, letterSpacing: '0.15em', color: 'var(--color-charcoal)',
                        opacity: (hoveredItem && hoveredItem !== 'destacados') ? 0.35 : 1,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ background: 'var(--color-gold)', alignSelf: 'stretch' }} />

          {/* ── COLUMNA IMAGEN ── */}
          <Link 
            to={hoveredItem && hoveredItem !== 'destacados' ? `/categoria/${hoveredItem.toLowerCase()}` : '/categoria'}
            onClick={() => { setCatalogoOpen(false); window.scrollTo(0, 0); }}
            style={{ paddingLeft: 48, position: 'relative', height: 420, display: 'block', textDecoration: 'none' }}
          >
            <div style={{
              position: 'absolute', inset: 0, backgroundImage: `url(${activeImage})`,
              backgroundSize: 'cover', backgroundPosition: 'center top',
              transition: 'opacity 0.4s ease', opacity: 0.88,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(242,228,225,0.92) 0%, rgba(242,228,225,0.2) 60%, transparent 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: 28, left: 28, right: 16 }}>
              {(hoveredItem && hoveredItem !== 'destacados') ? (
                <>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.28em', color: 'var(--color-gold)', marginBottom: 8 }}>VER COLECCIÓN →</p>
                  <p style={{ fontSize: 22, fontWeight: 300, letterSpacing: '0.18em', color: 'var(--color-black)', lineHeight: 1.2, textTransform: 'uppercase' }}>{hoveredItem}</p>
                  <div style={{ marginTop: 10, height: 1, width: 48, background: 'var(--color-gold)' }} />
                </>
              ) : (
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.32em', color: 'var(--color-gold)' }}>PAVOA — NUEVA COLECCIÓN</p>
              )}
            </div>
          </Link>

        </div>
      </div>

      {/* ── MENÚ MÓVIL ── */}
      <div
        style={{ fontFamily: 'var(--font-primary)', background: 'var(--color-bg)' }}
        className={`fixed inset-0 z-40 transition-opacity duration-500 overflow-hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Panel principal */}
        <div className={`absolute inset-0 pt-24 px-8 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileCatalogoOpen ? '-translate-x-full' : 'translate-x-0'}`}>
          <nav className="flex flex-col text-[13px] font-medium tracking-[0.2em] text-stone-900">
            <Link 
              to="/" 
              onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} 
              className="hover:text-stone-900 transition-colors border-b border-stone-100 py-5"
            >
              INICIO
            </Link>
            <button
              onClick={() => setMobileCatalogoOpen(true)}
              className="w-full flex justify-between items-center py-5 border-b border-stone-100 text-stone-800 text-left"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 500, letterSpacing: '0.2em' }}
            >
              CATÁLOGO
              <span style={{ fontSize: 16, color: 'var(--color-gold)', fontWeight: 300 }}>→</span>
            </button>
            <a href="#contacto" onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-stone-900 transition-colors border-b border-stone-100 py-5">
              CONTACTO
            </a>
          </nav>
          <div className="flex items-center gap-5 mt-10" style={{ color: 'var(--color-charcoal)' }}>
            <a href="#" style={{ color: 'var(--color-charcoal)' }}><InstagramIcon /></a>
            <a href="#" style={{ color: 'var(--color-charcoal)' }}><FacebookIcon /></a>
          </div>
        </div>

        {/* Panel catálogo */}
        <div 
          className={`absolute inset-0 pt-24 px-6 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto pb-12 ${mobileCatalogoOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ background: 'var(--color-bg)' }}
        >
          <button 
            onClick={() => setMobileCatalogoOpen(false)}
            className="flex items-center gap-2 mb-6 text-stone-500 hover:text-stone-900 transition-colors py-3 px-2 -ml-2 rounded-lg active:bg-stone-100/60"
            style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em' }}
          >
            <span style={{ fontSize: 16 }}>←</span> VOLVER
          </button>

          <div className="flex mb-8 border-b border-stone-200">
            <button onClick={() => setMobileTab('mujer')} className={`flex-1 py-4 text-center text-[12px] font-bold tracking-[0.2em] transition-colors relative active:bg-stone-50 ${mobileTab === 'mujer' ? 'text-stone-900' : 'text-stone-400'}`}>
              MUJER
              {mobileTab === 'mujer' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-stone-900 transition-all" />}
            </button>
            <button onClick={() => setMobileTab('hombre')} className={`flex-1 py-4 text-center text-[12px] font-bold tracking-[0.2em] transition-colors relative active:bg-stone-50 ${mobileTab === 'hombre' ? 'text-stone-900' : 'text-stone-400'}`}>
              HOMBRE
              {mobileTab === 'hombre' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-stone-900 transition-all" />}
            </button>
          </div>

          {mobileTab === 'mujer' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <p style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.28em', color: 'var(--color-gold)', marginBottom: 8, paddingLeft: 8 }}>SUPERIOR</p>
                <div className="flex flex-col gap-1">
                  {['Camisetas', 'Tops Deportivos', 'Buzos', 'Chaquetas'].map(item => (
                    <Link key={item} to={`/categoria/${item.toLowerCase()}`} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} className="block py-3 px-2 rounded-lg text-[12px] font-medium tracking-[0.15em] text-stone-800 active:bg-stone-100/60 transition-colors">{item.toUpperCase()}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.28em', color: 'var(--color-gold)', marginBottom: 8, paddingLeft: 8 }}>INFERIOR</p>
                <div className="flex flex-col gap-1">
                  {['Licras', 'Shorts', 'Faldas', 'Sudaderas', 'Bikers', 'Pantalonetas'].map(item => (
                    <Link key={item} to={`/categoria/${item.toLowerCase()}`} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} className="block py-3 px-2 rounded-lg text-[12px] font-medium tracking-[0.15em] text-stone-800 active:bg-stone-100/60 transition-colors">{item.toUpperCase()}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.28em', color: 'var(--color-gold)', marginBottom: 8, paddingLeft: 8 }}>OTROS</p>
                <div className="flex flex-col gap-1">
                  {/* ✅ Bodies y Enterizos añadidos aquí también */}
                  {['Sets', 'Vestidos', 'Bodies', 'Enterizos', 'Accesorios'].map(item => (
                    <Link key={item} to={`/categoria/${item.toLowerCase()}`} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} className="block py-3 px-2 rounded-lg text-[12px] font-medium tracking-[0.15em] text-stone-800 active:bg-stone-100/60 transition-colors">{item.toUpperCase()}</Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mobileTab === 'hombre' && (
            <div className="flex flex-col gap-1 animate-fade-in">
              {hombreItems.map(item => (
                <Link key={item} to={`/categoria/${item.toLowerCase()}`} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} className="block py-3 px-2 rounded-lg text-[12px] font-medium tracking-[0.15em] text-stone-800 active:bg-stone-100/60 transition-colors">{item.toUpperCase()}</Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <CartDrawer cartOpen={cartOpen} setCartOpen={setCartOpen} />
      <SearchOverlay isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
    </>
  );
};

export default Header;