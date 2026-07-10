import { useState } from 'react';
import { Link } from 'react-router-dom';

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
  'Bodies':           'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
  'Enterizos':        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
};

const defaultImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80';

const sectionTitleStyle = { fontSize: 15, fontWeight: 700, letterSpacing: '0.32em', color: '#5C3D2E', marginBottom: 24 };

export default function MegaMenu({ catalogoOpen, setCatalogoOpen, isScrolled, panelRef }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const activeImage = hoveredItem ? (categoryImages[hoveredItem] || defaultImage) : defaultImage;

  const HEADER_H_DEFAULT  = '80px';
  const HEADER_H_SCROLLED = '64px';

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
      {/* Overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, top: isScrolled ? HEADER_H_SCROLLED : HEADER_H_DEFAULT, zIndex: 48,
          backgroundColor: 'rgba(20, 15, 15, 0.4)', backdropFilter: 'blur(3px)',
          opacity: catalogoOpen ? 1 : 0, pointerEvents: catalogoOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s ease, top 0.5s ease'
        }}
        onClick={() => setCatalogoOpen(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', left: 0, right: 0, top: isScrolled ? HEADER_H_SCROLLED : HEADER_H_DEFAULT, zIndex: 49,
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-gold)', borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
          opacity: catalogoOpen ? 1 : 0,
          transform: catalogoOpen ? 'translateY(0)' : 'translateY(-12px)',
          visibility: catalogoOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1), top 0.5s ease',
          pointerEvents: catalogoOpen ? 'auto' : 'none',
          boxShadow: catalogoOpen ? '0 8px 40px rgba(11,11,11,0.08)' : 'none',
          willChange: 'opacity, transform',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 64px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1.2fr', alignItems: 'start' }}>

          {/* MUJER */}
          <div style={{ paddingRight: 48 }}>
            <p style={sectionTitleStyle}>MUJER</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 8 }}>SUPERIOR</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {renderDesktopLink('Camisetas')}
                  {renderDesktopLink('Tops Deportivos', 'BEST SELLER')}
                  {renderDesktopLink('Buzos')}
                  {renderDesktopLink('Chaquetas')}
                  {renderDesktopLink('Bodies', 'NUEVO')}
                  {renderDesktopLink('Enterizos', 'NUEVO')}
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
                  {renderDesktopLink('Accesorios')}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--color-gold)', alignSelf: 'stretch' }} />

          {/* HOMBRE */}
          <div style={{ paddingLeft: 48, paddingRight: 48, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div>
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

          {/* IMAGEN */}
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
    </>
  );
}

