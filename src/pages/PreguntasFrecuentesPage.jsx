import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HelpBlockBody from '../components/HelpBlockBody';
import SEO from '../components/SEO';
import { getHelpPage, HELP_PAGES_DEFAULTS } from '../services/productService';

const normalizeCareBody = (value) =>
  String(value || '')
    .replace(/\\n\\n/g, '\n')
    .replace(/\\n/g, '\n');

const getCareItems = (body) =>
  normalizeCareBody(body)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PreguntasFrecuentesPage() {
  const [content, setContent] = useState(HELP_PAGES_DEFAULTS.faq);

  useEffect(() => {
    let active = true;

    getHelpPage('faq')
      .then((faqData) => {
        if (!active || !faqData) return;
        setContent(faqData);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const sortedBlocks = [...content.blocks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const careBlocks = sortedBlocks.filter((block) => block.blockType === 'care');
  const regularBlocks = sortedBlocks.filter((block) => block.blockType !== 'care');

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={content.seoTitle}
        description={content.seoDescription}
        url="/preguntas-frecuentes"
      />

      <section className="w-full pt-[140px] md:pt-[160px] pb-8 md:pb-12 px-6 border-b border-stone-100" style={{ background: 'var(--color-ivory)' }}>
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">{content.title}</span>
            </span>
          </nav>
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">{content.eyebrow}</span>
          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase">{content.title}</h1>
          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      <section className="w-full py-10 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1000px] mx-auto grid gap-4">
          {regularBlocks.map((block) => (
            <article key={block.id} className="border border-stone-100 p-7 md:p-9">
              <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-4">{block.title}</h2>
              <HelpBlockBody
                body={block.body}
                className="text-[12px] text-stone-500 leading-relaxed tracking-[0.08em]"
              />
            </article>
          ))}
        </div>
      </section>

      {careBlocks.length > 0 && (
        <section className="w-full pb-14 md:pb-20 px-6 md:px-12 lg:px-16">
          <div className="max-w-[1000px] mx-auto border border-stone-100 p-7 md:p-9" style={{ background: 'var(--color-ivory)' }}>
            <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">
              Cuidado de producto
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-stone-900 tracking-[0.12em] uppercase">
              Cuidados para tus prendas
            </h2>
            <p className="text-[12px] text-stone-500 leading-relaxed tracking-[0.06em] mt-4 max-w-2xl">
              Recomendaciones generales para conservar mejor la horma, el color y la vida útil de tus prendas. Si una referencia tiene una indicación especial, prima lo que aparezca en su propia página de producto.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {careBlocks.map((block) => {
                const isDo = block.label === 'do';
                const items = getCareItems(block.body);

                return (
                  <article
                    key={block.id}
                    className="border border-stone-200 bg-white p-6 md:p-7"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                          isDo
                            ? 'bg-[#d8bf79] text-stone-900'
                            : 'bg-stone-900 text-white'
                        }`}
                        aria-hidden="true"
                      >
                        {isDo ? '✓' : '×'}
                      </div>
                      <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-900">
                        {block.title}
                      </h3>
                    </div>

                    <ul className="space-y-3">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-[12px] text-stone-600 leading-relaxed">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#c8a75a] flex-shrink-0" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
