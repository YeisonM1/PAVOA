import { useState, useEffect, useRef } from 'react';
import { Menu, User, ShoppingBag, X, ChevronDown, Search } from 'lucide-react';
import logo from '../assets/LOGO PAVOA.png';

// Íconos SVG minimalistas de Instagram y Facebook
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

const catalogoItems = [
  {
    label: 'Nueva Colección',
    desc: 'Lo más reciente de PAVOA',
    href: '#nueva-coleccion',
  },
  {
    label: 'Vestidos',
    desc: 'Elegancia en cada ocasión',
    href: '#vestidos',
  },
  {
    label: 'Accesorios',
    desc: 'Los detalles que marcan la diferencia',
    href: '#accesorios',
  },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const catalogoRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cierra el dropdown si se hace click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catalogoRef.current && !catalogoRef.current.contains(e.target)) {
        setCatalogoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        style={{ fontFamily: 'Montserrat, sans-serif' }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
          isScrolled
            ? 'bg-white/98 border-stone-200 py-3 shadow-sm'
            : 'bg-white/90 border-transparent py-5'
        } backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* IZQUIERDA: Navegación */}
          <div className="flex-1 flex items-center">
            {/* Botón menú mobile */}
            <button
              className="md:hidden text-stone-800 mr-4 hover:text-stone-500 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>

            <nav className="hidden md:flex items-center gap-8 text-[12px] font-medium tracking-[0.2em] text-stone-900">
              <a href="#inicio" className="hover:text-stone-900 transition-colors relative group">
                INICIO
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full" />
              </a>

              {/* CATÁLOGO con dropdown */}
              <div className="relative" ref={catalogoRef}>
                <button
                  onClick={() => setCatalogoOpen(!catalogoOpen)}
                  className="flex items-center gap-1 hover:text-stone-900 transition-colors relative group"
                >
                  CATÁLOGO
                  <ChevronDown
                    size={12}
                    strokeWidth={2}
                    className={`transition-transform duration-300 ${catalogoOpen ? 'rotate-180' : ''}`}
                  />
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full" />
                </button>

                {/* Dropdown */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-white border border-stone-100 shadow-xl transition-all duration-300 ${
                    catalogoOpen
                      ? 'opacity-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
                  {/* Línea decorativa superior */}
                  <div className="h-[2px] bg-stone-900 w-full" />
                  <div className="py-2">
                    {catalogoItems.map((item, i) => (
                      <a
                        key={i}
                        href={item.href}
                        onClick={() => setCatalogoOpen(false)}
                        className="flex flex-col px-6 py-4 hover:bg-stone-50 transition-colors group/item border-b border-stone-50 last:border-none"
                      >
                        <span className="text-[11px] font-semibold tracking-[0.15em] text-stone-800 group-hover/item:text-stone-900 transition-colors">
                          {item.label.toUpperCase()}
                        </span>
                        <span className="text-[10px] tracking-wide text-stone-400 mt-0.5 font-light">
                          {item.desc}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <a href="#contacto" className="hover:text-stone-900 transition-colors relative group">
                CONTACTO
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-stone-900 transition-all duration-300 group-hover:w-full" />
              </a>
            </nav>
          </div>

          {/* CENTRO: Logo */}
          <div className="flex-1 flex justify-center">
            <a href="/">
              <img src={logo} alt="PAVOA" className="h-11 md:h-14 w-auto object-contain" />
            </a>
          </div>

          {/* DERECHA: Social e íconos */}
          <div className="flex-1 flex items-center justify-end gap-5 text-stone-900">
            <div className="hidden sm:flex items-center gap-4">
              <a href="#" className="hover:text-stone-900 transition-colors">
                <InstagramIcon />
              </a>
              <a href="#" className="hover:text-stone-900 transition-colors">
                <FacebookIcon />
              </a>
            </div>

            <div className="w-[1px] h-4 bg-stone-200 hidden sm:block" />

            <button className="hover:text-stone-900 transition-colors">
                <Search size={20} strokeWidth={1.8} />
            </button>

            <button className="hover:text-stone-900 transition-colors">
              <User size={20} strokeWidth={1.8} />
            </button>

            <button className="hover:text-stone-900 transition-colors relative">
              <ShoppingBag size={20} strokeWidth={1.8} />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-800" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <div
        style={{ fontFamily: 'Montserrat, sans-serif' }}
        className={`fixed inset-0 z-40 bg-white transition-all duration-500 flex flex-col pt-24 px-8 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col gap-6 text-[13px] font-medium tracking-[0.2em] text-stone-900">
          <a href="#inicio" onClick={() => setMenuOpen(false)} className="hover:text-stone-900 transition-colors border-b border-stone-100 pb-4">INICIO</a>
          <div className="border-b border-stone-100 pb-4">
            <p className="mb-3 text-stone-800">CATÁLOGO</p>
            <div className="flex flex-col gap-3 pl-4">
              {catalogoItems.map((item, i) => (
                <a key={i} href={item.href} onClick={() => setMenuOpen(false)} className="text-stone-400 hover:text-stone-900 transition-colors text-[11px]">
                  {item.label.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
          <a href="#contacto" onClick={() => setMenuOpen(false)} className="hover:text-stone-900 transition-colors border-b border-stone-100 pb-4">CONTACTO</a>
        </nav>

        <div className="flex items-center gap-5 mt-8 text-stone-400">
          <a href="#"><InstagramIcon /></a>
          <a href="#"><FacebookIcon /></a>
        </div>
      </div>
    </>
  );
};

export default Header;