import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import logo from '../assets/LOGO-PAVOA.svg';
import { InstagramIcon, FacebookIcon } from '../components/Icons';
import { FOOTER_CONTENT_DEFAULTS, getFooterContent } from '../services/productService';
import useSiteSettings from '../hooks/useSiteSettings';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Footer() {
  const settings = useSiteSettings();
  const [content, setContent] = useState(FOOTER_CONTENT_DEFAULTS);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getFooterContent()
      .then((data) => {
        if (!active || !data) return;
        setContent((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error: subscribeError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.toLowerCase() });
      if (subscribeError && subscribeError.code !== '23505') {
        throw new Error('Error al suscribirse. Intenta de nuevo.');
      }
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer style={{ backgroundColor: '#0B0B0B' }} className="w-full text-stone-400">
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-medium text-stone-400 mb-2">
              {content.newsletterEyebrow}
            </p>
            <h3 className="text-xl md:text-2xl font-light text-white">
              {content.newsletterTitle}
            </h3>
            <p className="text-[12px] font-light text-stone-400 mt-2">
              {content.newsletterBody}
            </p>
          </div>

          {subscribed ? (
            <p style={{ letterSpacing: '0.15em' }} className="text-[11px] font-medium text-stone-300">
              {content.newsletterSuccessText}
            </p>
          ) : (
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
                <label htmlFor="newsletter-email" className="sr-only">Tu correo electronico</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={content.newsletterInputPlaceholder}
                  disabled={loading}
                  className="bg-transparent border border-stone-700 text-white text-[11px] px-5 py-3 w-full md:w-72 placeholder-stone-500 focus:outline-none focus:border-stone-400 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ letterSpacing: '0.15em' }}
                  className="text-[10px] font-semibold text-stone-900 bg-white px-6 py-3 hover:bg-stone-200 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {loading ? '...' : content.newsletterButtonText}
                </button>
              </form>
              {error && <p className="text-[10px] text-red-400 tracking-[0.1em]">{error}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <img
            src={logo}
            alt="PAVOA"
            width={120}
            height={54}
            className="h-8 w-auto object-contain mb-6 brightness-0 invert"
          />
          <p className="text-[11px] font-light text-stone-400 leading-relaxed mb-6 max-w-xs">
            {content.brandBody}
          </p>
          <div className="flex items-center gap-4">
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Siguenos en Instagram"><InstagramIcon /></a>
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Siguenos en Facebook"><FacebookIcon /></a>
          </div>
        </div>

        <nav aria-label="Tienda">
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">{content.storeHeading}</p>
          <ul className="space-y-3 text-[11px] font-light">
            <li><Link to="/categoria" className="text-stone-400 hover:text-white transition-colors">Nueva Coleccion</Link></li>
            <li><Link to="/categoria/superior" className="text-stone-400 hover:text-white transition-colors">Tops y Camisetas</Link></li>
            <li><Link to="/categoria/accesorios" className="text-stone-400 hover:text-white transition-colors">Accesorios</Link></li>
            <li><Link to="/categoria" className="text-stone-400 hover:text-white transition-colors">Mas Vendidos</Link></li>
          </ul>
        </nav>

        <nav aria-label="Ayuda">
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">{content.helpHeading}</p>
          <ul className="space-y-3 text-[11px] font-light">
            <li><Link to="/envios-y-entregas" className="text-stone-400 hover:text-white transition-colors">Envios y entregas</Link></li>
            <li><Link to="/cambios-y-devoluciones" className="text-stone-400 hover:text-white transition-colors">Cambios y devoluciones</Link></li>
            <li><Link to="/guia-de-tallas" className="text-stone-400 hover:text-white transition-colors">Guia de tallas</Link></li>
            <li><Link to="/preguntas-frecuentes" className="text-stone-400 hover:text-white transition-colors">Preguntas frecuentes</Link></li>
          </ul>
        </nav>

        <div>
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">{content.contactHeading}</p>
          <ul className="space-y-3 text-[11px] font-light">
            <li className="text-stone-400">Email: <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">{settings.contactEmail}</a></li>
            <li className="text-stone-400 text-[10px] leading-relaxed pt-1">
              {settings.contactSchedule}
            </li>
            <li className="text-[9px] tracking-[0.18em] uppercase text-stone-500 border border-stone-800 bg-stone-900/40 px-3 py-2 inline-block">
              {settings.contactNote}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p style={{ letterSpacing: '0.1em' }} className="text-[10px] font-light text-stone-400">
            {content.copyrightText}
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {['Visa', 'Mastercard', 'PSE', 'Nequi'].map((medio) => (
              <span
                key={medio}
                style={{ letterSpacing: '0.1em' }}
                className="text-[9px] font-medium text-stone-400 border border-stone-700 px-3 py-1"
              >
                {medio.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
