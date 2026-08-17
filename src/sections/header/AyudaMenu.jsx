import { Link } from 'react-router-dom';
import useSiteSettings from '../../hooks/useSiteSettings';
import { normalizeAyudaMenu } from '../../utils/ayudaMenu.js';

const sectionTitleStyle = { fontSize: 15, fontWeight: 700, letterSpacing: '0.32em', color: '#5C3D2E', marginBottom: 24 };
const eyebrowStyle      = { fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--color-charcoal)', opacity: 0.5, marginBottom: 16 };

const AyudaLink = ({ item, setAyudaOpen }) => (
  <li>
    <Link
      to={item.to}
      onClick={() => { setAyudaOpen(false); window.scrollTo(0, 0); }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(6px)';
        e.currentTarget.querySelector('span').style.color = '#0B0B0B';
        e.currentTarget.querySelector('u').style.width = '100%';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.querySelector('span').style.color = '';
        e.currentTarget.querySelector('u').style.width = '0%';
      }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', textDecoration: 'none', transition: 'transform 0.3s cubic-bezier(0.25,1,0.5,1)' }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.18em', color: 'var(--color-stone-700, #44403c)', position: 'relative', transition: 'color 0.2s ease' }}>
        {item.label.toUpperCase()}
        <u style={{ position: 'absolute', bottom: -2, left: 0, height: 1, width: '0%', background: 'var(--color-gold)', transition: 'width 0.3s ease', display: 'block', textDecoration: 'none' }} />
      </span>
    </Link>
  </li>
);

export default function AyudaMenu({ ayudaOpen, setAyudaOpen, isScrolled, panelRef, ayudaMenuConfig }) {
  const settings = useSiteSettings();
  const menu = normalizeAyudaMenu(ayudaMenuConfig);
  // Mismo desplazamiento que el megamenu. El header flota 36px bajo la barra
  // de anuncios, asi que su borde inferior no coincide con su propio alto:
  // con los 80px de antes quedaba por encima y tapaba los titulos de seccion.
  const HEADER_H_DEFAULT  = '116px';
  const HEADER_H_SCROLLED = '100px';

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, top: isScrolled ? HEADER_H_SCROLLED : HEADER_H_DEFAULT, zIndex: 48,
          backgroundColor: 'rgba(20,15,15,0.4)', backdropFilter: 'blur(3px)',
          opacity: ayudaOpen ? 1 : 0, pointerEvents: ayudaOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s ease, top 0.5s ease',
        }}
        onClick={() => setAyudaOpen(false)}
      />

      <div
        ref={panelRef}
        style={{
          position: 'fixed', left: 0, right: 0, top: isScrolled ? HEADER_H_SCROLLED : HEADER_H_DEFAULT, zIndex: 49,
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-gold)', borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
          opacity: ayudaOpen ? 1 : 0,
          transform: ayudaOpen ? 'translateY(0)' : 'translateY(-12px)',
          visibility: ayudaOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1), top 0.5s ease',
          pointerEvents: ayudaOpen ? 'auto' : 'none',
          boxShadow: ayudaOpen ? '0 8px 40px rgba(11,11,11,0.08)' : 'none',
          willChange: 'opacity, transform',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 64px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 0.85fr', alignItems: 'start' }}>

          {/* La celda se renderiza siempre: la rejilla coloca sus cinco hijos
              por posición y omitir una columna correría el separador dorado. */}
          <div style={{ paddingRight: 48 }}>
            {menu.pedidos.enlaces.length > 0 && (
              <>
                <p style={sectionTitleStyle}>{menu.pedidos.titulo}</p>
                <p style={eyebrowStyle}>{menu.pedidos.subtitulo}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {menu.pedidos.enlaces.map(item => <AyudaLink key={item.to} item={item} setAyudaOpen={setAyudaOpen} />)}
                </ul>
              </>
            )}
          </div>

          <div style={{ background: 'var(--color-gold)', alignSelf: 'stretch' }} />

          <div style={{ paddingLeft: 48, paddingRight: 48 }}>
            {menu.atencion.enlaces.length > 0 && (
              <>
                <p style={sectionTitleStyle}>{menu.atencion.titulo}</p>
                <p style={eyebrowStyle}>{menu.atencion.subtitulo}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {menu.atencion.enlaces.map(item => <AyudaLink key={item.to} item={item} setAyudaOpen={setAyudaOpen} />)}
                </ul>
              </>
            )}
          </div>

          <div style={{ background: 'var(--color-gold)', alignSelf: 'stretch' }} />

          <div style={{ paddingLeft: 48, position: 'relative', height: 320, overflow: 'hidden' }}>
            {menu.soporte.imagen && (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${menu.soporte.imagen})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: 0.88,
              }} />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(242,228,225,0.92) 0%, rgba(242,228,225,0.2) 60%, transparent 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: 28, left: 28, right: 16 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.32em', color: 'var(--color-black)', marginBottom: 8 }}>{menu.soporte.eyebrow}</p>
              <p style={{ fontSize: 22, fontWeight: 300, letterSpacing: '0.18em', color: 'var(--color-black)', lineHeight: 1.25, textTransform: 'uppercase', marginBottom: 10 }}>
                {menu.soporte.lineaFina}<br /><strong style={{ fontWeight: 600 }}>{menu.soporte.lineaFuerte}</strong>
              </p>
              <div style={{ height: 1, width: 40, background: 'var(--color-gold)', marginBottom: 16 }} />
              {settings.whatsappUrl && (
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setAyudaOpen(false)}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
                    color: '#1C1410', background: 'var(--color-gold)',
                    padding: '9px 18px', textDecoration: 'none',
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  ESCRÍBENOS →
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
