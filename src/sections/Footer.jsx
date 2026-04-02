import { useState } from 'react';
import logo from '../assets/LOGO PAVOA.png';

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer style={{ backgroundColor: '#0B0B0B', fontFamily: 'Montserrat, sans-serif' }} className="w-full text-stone-400">

      {/* Newsletter */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-medium text-stone-500 mb-2">
              NEWSLETTER
            </p>
            <h3 className="text-xl md:text-2xl font-light text-white">
              Sé la primera en enterarte.
            </h3>
            <p className="text-[12px] font-light text-stone-500 mt-2">
              Nuevas colecciones, descuentos exclusivos y más.
            </p>
          </div>

          {subscribed ? (
            <p style={{ letterSpacing: '0.15em' }} className="text-[11px] font-medium text-stone-300">
              ✓ GRACIAS POR SUSCRIBIRTE
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                className="bg-transparent border border-stone-700 text-white text-[11px] px-5 py-3 w-full md:w-72 placeholder-stone-600 focus:outline-none focus:border-stone-400 transition-colors"
              />
              <button
                type="submit"
                style={{ letterSpacing: '0.15em' }}
                className="text-[10px] font-semibold text-stone-900 bg-white px-6 py-3 hover:bg-stone-200 transition-colors whitespace-nowrap"
              >
                SUSCRIBIRSE
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">

        {/* Logo y redes */}
        <div className="col-span-2 md:col-span-1">
          <img src={logo} alt="PAVOA" className="h-8 w-auto object-contain mb-6 brightness-0 invert" />
          <p className="text-[11px] font-light text-stone-500 leading-relaxed mb-6 max-w-xs">
            Ropa deportiva femenina premium. Elegancia natural. Presencia silenciosa.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors"><InstagramIcon /></a>
            <a href="#" className="hover:text-white transition-colors"><FacebookIcon /></a>
            <a href="#" className="hover:text-white transition-colors"><WhatsAppIcon /></a>
          </div>
        </div>

        {/* Navegación */}
        <div>
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">
            TIENDA
          </p>
          <ul className="space-y-3 text-[11px] font-light">
            <li><a href="#" className="hover:text-white transition-colors">Nueva Colección</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Vestidos</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Accesorios</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Más Vendidos</a></li>
          </ul>
        </div>

        {/* Ayuda */}
        <div>
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">
            AYUDA
          </p>
          <ul className="space-y-3 text-[11px] font-light">
            <li><a href="#" className="hover:text-white transition-colors">Envíos y entregas</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Cambios y devoluciones</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Guía de tallas</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Preguntas frecuentes</a></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <p style={{ letterSpacing: '0.2em' }} className="text-[10px] font-semibold text-white mb-6">
            CONTACTO
          </p>
          <ul className="space-y-3 text-[11px] font-light">
            <li>WhatsApp: <a href="#" className="hover:text-white transition-colors">+57 000 000 0000</a></li>
            <li>Email: <a href="#" className="hover:text-white transition-colors">hola@pavoa.co</a></li>
            <li className="text-stone-600 text-[10px] leading-relaxed pt-1">
              Lun — Vie: 8am – 6pm<br />
              Sáb: 9am – 2pm
            </li>
          </ul>
        </div>

      </div>

      {/* Medios de pago + copyright */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Copyright */}
          <p style={{ letterSpacing: '0.1em' }} className="text-[10px] font-light text-stone-600">
            © 2025 PAVOA. TODOS LOS DERECHOS RESERVADOS.
          </p>

          {/* Medios de pago en texto */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {['Visa', 'Mastercard', 'PSE', 'Nequi', 'Daviplata', 'Contraentrega'].map((medio) => (
              <span
                key={medio}
                style={{ letterSpacing: '0.1em' }}
                className="text-[9px] font-medium text-stone-600 border border-stone-800 px-3 py-1"
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