import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import HelpBlockBody from '../components/HelpBlockBody';
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
        description={content.manifestoSupportingText || content.blocks[0]?.body || 'Conoce la filosofia de PAVOA, su manifiesto y sus pilares.'}
        url="/nosotros"
      />

      <section
        className="w-full pt-[140px] md:pt-[165px] pb-14 md:pb-20 px-6 border-b border-stone-100 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(246,241,234,1) 0%, rgba(255,255,255,1) 100%)',
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Nosotros</span>
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-10 lg:gap-16 items-end">
            <div className="relative">
              <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-4">
                {content.eyebrow}
              </span>

              <h1 className="text-3xl md:text-5xl xl:text-6xl font-light text-stone-900 tracking-[0.14em] uppercase max-w-4xl">
                {content.title}
              </h1>

              <div className="w-12 h-[1px] mt-6 mb-8" style={{ background: 'var(--color-gold)' }} />

              <p className="max-w-3xl text-2xl md:text-4xl xl:text-[3.2rem] font-light leading-[1.15] text-stone-900">
                {content.manifesto}
              </p>
            </div>

            <div className="lg:pb-3">
              <div className="border border-stone-200 bg-white/70 backdrop-blur-sm px-6 py-7 md:px-8 md:py-9">
                <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-stone-400 mb-4">
                  Seguridad en movimiento
                </p>
                <p className="text-[12px] md:text-[13px] text-stone-600 leading-relaxed tracking-[0.08em]">
                  {content.manifestoSupportingText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.25fr)] gap-10 lg:gap-20 items-start">
          <div className="lg:sticky lg:top-[140px]">
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-stone-400 mb-4">
              {content.introEyebrow}
            </p>
            <h2 className="text-2xl md:text-4xl font-light text-stone-900 tracking-[0.08em] uppercase leading-tight">
              {content.introTitle}
            </h2>
          </div>

          <div className="max-w-3xl">
            <HelpBlockBody
              body={content.introBody}
              className="text-[13px] md:text-[14px] text-stone-600 leading-8 tracking-[0.06em]"
            />
          </div>
        </div>
      </section>

      <section className="w-full pb-10 md:pb-14 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-3 mb-10 md:mb-12">
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-stone-400">
              La filosofia PAVOA
            </p>
            <h2 className="text-2xl md:text-4xl font-light text-stone-900 tracking-[0.08em] uppercase">
              Principios que sostienen la marca
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200 border border-stone-200">
            {content.blocks.map((bloque, index) => (
              <article
                key={bloque.id || `${bloque.internalName}-${index}`}
                className="bg-white p-8 md:p-10 lg:p-12 min-h-[260px] flex flex-col"
              >
                <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-stone-400 mb-5">
                  {bloque.label}
                </p>
                <h3 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.08em] uppercase mb-5 max-w-md">
                  {bloque.title}
                </h3>
                <p className="text-[12px] md:text-[13px] text-stone-600 leading-relaxed tracking-[0.08em] max-w-xl">
                  {bloque.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full pb-16 md:pb-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto border border-stone-100 bg-[linear-gradient(135deg,rgba(246,241,234,0.9),rgba(255,255,255,1))] p-8 md:p-12 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-8 lg:gap-12 items-end">
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-4">
                Manifiesto
              </p>
              <p className="text-xl md:text-3xl font-light text-stone-900 leading-relaxed max-w-4xl">
                "{content.quote}"
              </p>
              {content.signature && (
                <p className="mt-6 text-[11px] tracking-[0.22em] uppercase text-stone-500">
                  {content.signature}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start lg:items-end gap-5">
              <div>
                <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-3">
                  {content.ctaEyebrow}
                </p>
                <h3 className="text-xl md:text-2xl font-light text-stone-900 tracking-[0.08em] uppercase max-w-md">
                  {content.ctaTitle}
                </h3>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <NosotrosCtaLink to={content.ctaLink1Url}>{content.ctaLink1Text}</NosotrosCtaLink>
                <NosotrosCtaLink to={content.ctaLink2Url}>{content.ctaLink2Text}</NosotrosCtaLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
