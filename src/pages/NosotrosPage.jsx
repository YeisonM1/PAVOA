import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getNosotrosPage, NOSOTROS_PAGE_DEFAULTS } from '../services/productService';

const isExternalUrl = (url = '') => /^(https?:\/\/|mailto:|tel:)/i.test(url);

function NosotrosCtaLink({ to, children }) {
  if (!to || !children) return null;

  const className = 'text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1 hover:opacity-60 transition-opacity';
  const opensNewTab = /^https?:\/\//i.test(to);

  if (isExternalUrl(to)) {
    return (
      <a
        href={to}
        className={className}
        target={opensNewTab ? '_blank' : undefined}
        rel={opensNewTab ? 'noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

export default function NosotrosPage() {
  const [content, setContent] = useState(NOSOTROS_PAGE_DEFAULTS);

  useEffect(() => {
    let active = true;

    getNosotrosPage()
      .then((data) => {
        if (!active || !data) return;
        setContent(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Nuestra Filosofia"
        description={content.blocks[0]?.body || 'Conoce la filosofia de PAVOA, su manifiesto, sus pilares y su vision.'}
        url="/nosotros"
      />

      <section
        className="w-full pt-[140px] md:pt-[160px] pb-10 md:pb-14 px-6 border-b border-stone-100"
        style={{ background: 'var(--color-ivory)' }}
      >
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Nosotros</span>
            </span>
          </nav>

          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">{content.eyebrow}</span>

          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase max-w-4xl">
            {content.title}
          </h1>

          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      <section className="w-full py-12 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {content.blocks.map((bloque, index) => (
            <article key={bloque.id || `${bloque.internalName}-${index}`} className="border border-stone-100 p-8 md:p-10">
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-4">
                {bloque.label}
              </p>
              <h2 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.08em] uppercase mb-4">
                {bloque.title}
              </h2>
              <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]">
                {bloque.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full pb-16 md:pb-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto border border-stone-100 p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-3">
              {content.ctaEyebrow}
            </p>
            <h3 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.08em] uppercase">
              {content.ctaTitle}
            </h3>
          </div>

          <div className="flex items-center gap-6">
            <NosotrosCtaLink to={content.ctaLink1Url}>{content.ctaLink1Text}</NosotrosCtaLink>
            <NosotrosCtaLink to={content.ctaLink2Url}>{content.ctaLink2Text}</NosotrosCtaLink>
          </div>
        </div>
      </section>
    </div>
  );
}
