import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InstagramIcon, FacebookIcon } from '../../components/Icons';

const hombreItems = ['Pantalonetas', 'Camisetas', 'Buzos', 'Joggers'];

export default function MobileMenu({
  menuOpen,
  setMenuOpen,
  instagramUrl = 'https://www.instagram.com/pavoacolombia/',
  facebookUrl = 'https://facebook.com/pavoa',
}) {
  const [mobileCatalogoOpen, setMobileCatalogoOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('mujer');

  return (
    <div
      style={{ background: 'var(--color-bg)' }}
      className={`fixed inset-0 z-40 transition-opacity duration-500 overflow-hidden ${
        menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Panel principal */}
      <div className={`absolute inset-0 pt-32 px-8 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileCatalogoOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <nav className="flex flex-col text-[13px] font-medium tracking-[0.2em] text-stone-900">
          <Link to="/" onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-stone-900 transition-colors border-b border-stone-100 py-5">
            INICIO
          </Link>
          <button
            onClick={() => setMobileCatalogoOpen(true)}
            className="w-full flex justify-between items-center py-5 border-b border-stone-100 text-stone-800 text-left"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, letterSpacing: '0.2em' }}
          >
            CATÁLOGO
            <span style={{ fontSize: 16, color: 'var(--color-gold)', fontWeight: 300 }}>→</span>
          </button>
          <Link to="/contacto" onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-stone-900 transition-colors border-b border-stone-100 py-5">
            CONTACTO
          </Link>
        </nav>
        <div className="flex items-center gap-5 mt-10" style={{ color: 'var(--color-charcoal)' }}>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-charcoal)' }} aria-label="Síguenos en Instagram"><InstagramIcon /></a>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-charcoal)' }} aria-label="Síguenos en Facebook"><FacebookIcon /></a>
        </div>
      </div>

      {/* Panel catálogo */}
      <div
        className={`absolute inset-0 pt-32 px-6 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto pb-12 ${mobileCatalogoOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
                {['Camisetas', 'Tops Deportivos', 'Buzos', 'Chaquetas', 'Bodies', 'Enterizos'].map(item => (
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
                {['Sets', 'Vestidos', 'Accesorios'].map(item => (
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
  );
}
