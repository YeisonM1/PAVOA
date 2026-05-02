import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import logo from '../assets/LOGO-PAVOA.svg';
import { InstagramIcon, FacebookIcon } from '../components/Icons';

const INSTAGRAM_URL = 'https://instagram.com/pavoa';
const FACEBOOK_URL = 'https://facebook.com/pavoa';
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '573000000000';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.toLowerCase() });
      // Duplicado → mostrar éxito igual (no revelar si ya existe)
      if (error && error.code !== '23505') throw new Error('Error al suscribirse. Intenta de nuevo.');
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

      {/* Newsletter */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            {/* ✅ text-stone-500 → text-stone-400 para mejor contraste */}
            <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-medium text-stone-400 mb-2">
              NEWSLETTER
            </p>
            <h3 className="text-xl md:text-2xl font-light text-white">
              Sé la primera en enterarte.
            </h3>
            {/* ✅ text-stone-500 → text-stone-400 */}
            <p className="text-[12px] font-light text-stone-400 mt-2">
              Nuevas colecciones, descuentos exclusivos y más.
            </p>
          </div>

          {subscribed ? (
            <p style={{ letterSpacing: '0.15em' }} className="text-[11px] font-medium text-stone-300">
              ✓ GRACIAS POR SUSCRIBIRTE
            </p>
          ) : (
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
                <label htmlFor="newsletter-email" className="sr-only">Tu correo electrónico</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  disabled={loading}
                  className="bg-transparent border border-stone-700 text-white text-[11px] px-5 py-3 w-full md:w-72 placeholder-stone-500 focus:outline-none focus:border-stone-400 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ letterSpacing: '0.15em' }}
                  className="text-[10px] font-semibold text-stone-900 bg-white px-6 py-3 hover:bg-stone-200 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {loading ? '...' : 'SUSCRIBIRSE'}
                </button>
              </form>
              {error && <p className="text-[10px] text-red-400 tracking-[0.1em]">{error}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">

        {/* Logo y redes */}
        <div className="col-span-2 md:col-span-1">
          {/* ✅ width/height explícitos para evitar layout shift */}
          <img
            src={logo}
            alt="PAVOA"
            width={120}
            height={54}
            className="h-8 w-auto object-contain mb-6 brightness-0 invert"
          />
          {/* ✅ text-stone-500 → text-stone-400 */}
          <p className="text-[11px] font-light text-stone-400 leading-relaxed mb-6 max-w-xs">
            Ropa deportiva femenina premium. Elegancia natural. Presencia silenciosa.
          </p>
          <div className="flex items-center gap-4">
            {/* ✅ aria-labels en links de redes sociales */}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Síguenos en Instagram"><InstagramIcon /></a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Síguenos en Facebook"><FacebookIcon /></a>
          </div>
        </div>

        {/* Navegación */}
        <nav aria-label="Tienda">
          {/* ✅ text-stone-500 → text-white (ya estaba bien) */}
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">TIENDA</p>
          <ul className="space-y-3 text-[11px] font-light">
            {/* ✅ text-stone-400 para links (mejor contraste que stone-500 en negro) */}
            <li><Link to="/categoria" className="text-stone-400 hover:text-white transition-colors">Nueva Colección</Link></li>
            <li><Link to="/categoria/camisetas" className="text-stone-400 hover:text-white transition-colors">Prendas Superiores</Link></li>
            <li><Link to="/categoria/accesorios" className="text-stone-400 hover:text-white transition-colors">Accesorios</Link></li>
            <li><Link to="/categoria" className="text-stone-400 hover:text-white transition-colors">Más Vendidos</Link></li>
          </ul>
        </nav>

        {/* Ayuda */}
        <nav aria-label="Ayuda">
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">AYUDA</p>
          <ul className="space-y-3 text-[11px] font-light">
            <li><Link to="/envios-y-entregas" className="text-stone-400 hover:text-white transition-colors">Envíos y entregas</Link></li>
            <li><Link to="/cambios-y-devoluciones" className="text-stone-400 hover:text-white transition-colors">Cambios y devoluciones</Link></li>
            <li><Link to="/guia-de-tallas" className="text-stone-400 hover:text-white transition-colors">Guía de tallas</Link></li>
            <li><Link to="/preguntas-frecuentes" className="text-stone-400 hover:text-white transition-colors">Preguntas frecuentes</Link></li>
          </ul>
        </nav>

        {/* Contacto */}
        <div>
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">CONTACTO</p>
          <ul className="space-y-3 text-[11px] font-light">
            <li className="text-stone-400">WhatsApp: <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">+57 000 000 0000</a></li>
            <li className="text-stone-400">Email: <a href="mailto:hola@pavoa.co" className="hover:text-white transition-colors">hola@pavoa.co</a></li>
            {/* ✅ text-stone-600 → text-stone-400 para mejor contraste */}
            <li className="text-stone-400 text-[10px] leading-relaxed pt-1">
              Lun — Vie: 8am – 6pm<br />
              Sáb: 9am – 2pm
            </li>
          </ul>
        </div>
      </div>

      {/* Medios de pago + copyright */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* ✅ text-stone-600 → text-stone-400 */}
          <p style={{ letterSpacing: '0.1em' }} className="text-[10px] font-light text-stone-400">
            © 2026 PAVOA. TODOS LOS DERECHOS RESERVADOS.
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
