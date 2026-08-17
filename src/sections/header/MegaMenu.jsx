import { useState } from 'react';
import { Link } from 'react-router-dom';

const defaultImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80';

// Removed sectionTitleStyle to use inline robust Tailwind classes

export default function MegaMenu({ catalogoOpen, setCatalogoOpen, panelRef, megamenuConfig }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const activeImage = hoveredItem ? (megamenuConfig?.images?.[hoveredItem] || defaultImage) : defaultImage;

  // Borde inferior real del header, medido en Header.jsx. El respaldo cubre el
  // instante antes de la primera medición.
  // El 1px de solape absorbe el redondeo sub-pixel: sin él, media unidad de
  // diferencia abre una rendija por la que se ve la página.
  const TOP_PANEL = 'calc(var(--sticky-top, 116px) - 1px)';

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
          position: 'fixed', inset: 0, top: TOP_PANEL, zIndex: 48,
          backgroundColor: 'rgba(20, 15, 15, 0.4)', backdropFilter: 'blur(3px)',
          opacity: catalogoOpen ? 1 : 0, pointerEvents: catalogoOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s ease'
        }}
        onClick={() => setCatalogoOpen(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', left: 0, right: 0, top: TOP_PANEL, zIndex: 49,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
          opacity: catalogoOpen ? 1 : 0,
          transform: catalogoOpen ? 'translateY(0)' : 'translateY(-12px)',
          visibility: catalogoOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: catalogoOpen ? 'auto' : 'none',
          boxShadow: catalogoOpen ? '0 8px 40px rgba(11,11,11,0.08)' : 'none',
          willChange: 'opacity, transform',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 64px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1.2fr', alignItems: 'start' }}>

          {/* MUJER */}
          <div style={{ paddingRight: 48 }}>
            <h2 className="text-stone-700 text-[15px] font-bold tracking-[0.32em] mb-6 block whitespace-nowrap">MUJER</h2>
            <Link
              to="/categoria/mujer"
              onClick={() => { setCatalogoOpen(false); window.scrollTo(0, 0); }}
              className="inline-block text-[10.5px] font-semibold tracking-[0.18em] text-stone-700 hover:text-black transition-colors mb-4"
            >
              VER TODO
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {megamenuConfig?.mujerSuperior?.length > 0 && (
                <div>
                  <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 8 }}>SUPERIOR</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {megamenuConfig.mujerSuperior.map(i => renderDesktopLink(i.label, i.badge))}
                  </ul>
                </div>
              )}
              {megamenuConfig?.mujerInferior?.length > 0 && (
                <div>
                  <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 8 }}>INFERIOR</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {megamenuConfig.mujerInferior.map(i => renderDesktopLink(i.label, i.badge))}
                  </ul>
                </div>
              )}
              {megamenuConfig?.mujerOtros?.length > 0 && (
                <div>
                  <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 8 }}>OTROS</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {megamenuConfig.mujerOtros.map(i => renderDesktopLink(i.label, i.badge))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--color-gold)', alignSelf: 'stretch' }} />

          {/* HOMBRE */}
          <div style={{ paddingLeft: 48, paddingRight: 48, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div>
              <h2 className="text-stone-700 text-[15px] font-bold tracking-[0.32em] mb-6 block whitespace-nowrap">HOMBRE</h2>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {megamenuConfig?.hombre?.map(i => renderDesktopLink(i.label, i.badge))}
              </ul>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 12 }}>DESTACADOS</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(megamenuConfig?.destacados || []).map((link) => (
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
              backgroundSize: 'cover', backgroundPosition: 'center center',
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

