import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/LOGO-PAVOA.svg';
import SEO from '../components/SEO';

export default function VerifyEmailPage() {
  const { state } = useLocation();
  const email = state?.email || 'tu correo';

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F2E4E1' }}>
      <SEO title="Verifica tu correo — PAVOA" url="/verify-email" noIndex />

      {/* ── LADO IZQUIERDO — decorativo (solo desktop) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16"
        style={{ backgroundColor: '#0B0B0B' }}
      >
        <Link to="/">
          <img src={logo} alt="PAVOA" className="h-8 w-auto object-contain brightness-0 invert" />
        </Link>
        <div>
          <p style={{ letterSpacing: '0.3em' }} className="text-[9px] text-white/40 uppercase font-medium mb-4">
            Casi listo
          </p>
          <h2 className="text-4xl font-light text-white leading-tight tracking-[0.1em] uppercase mb-6">
            Un paso más<br />
            <strong className="font-bold">para empezar.</strong>
          </h2>
          <div className="w-12 h-[1px]" style={{ backgroundColor: '#DFCDB4' }} />
        </div>
        <p style={{ letterSpacing: '0.15em' }} className="text-[9px] text-white/30 uppercase">
          © 2026 PAVOA. Todos los derechos reservados.
        </p>
      </div>

      {/* ── LADO DERECHO ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-16">

        {/* Logo mobile */}
        <div className="flex justify-center mb-12 lg:hidden">
          <Link to="/">
            <img src={logo} alt="PAVOA" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        <div className="max-w-sm w-full mx-auto">

          {/* Ícono */}
          <div className="mb-8 flex justify-center lg:justify-start">
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ backgroundColor: '#0B0B0B' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <p style={{ letterSpacing: '0.35em' }} className="text-[9px] text-stone-400 uppercase font-medium mb-3">
              Verifica tu cuenta
            </p>
            <h1 className="text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
              Revisa tu <strong className="font-bold">correo</strong>
            </h1>
            <div className="w-8 h-[1px] mt-4" style={{ backgroundColor: '#DFCDB4' }} />
          </div>

          {/* Mensaje */}
          <div className="flex flex-col gap-4 mb-10">
            <p className="text-[12px] text-stone-600 leading-relaxed">
              Hemos enviado un enlace de verificación a:
            </p>
            <p
              style={{ letterSpacing: '0.1em' }}
              className="text-[12px] font-bold text-stone-900 uppercase"
            >
              {email}
            </p>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Haz clic en el enlace del correo para activar tu cuenta. El enlace expira en 24 horas.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-[1px] bg-stone-200" />
            <span style={{ letterSpacing: '0.2em' }} className="text-[9px] text-stone-300 uppercase">o</span>
            <div className="flex-1 h-[1px] bg-stone-200" />
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4 text-center">
            <Link
              to="/login"
              style={{ letterSpacing: '0.2em' }}
              className="text-[10px] font-bold text-stone-900 uppercase underline underline-offset-2 hover:text-stone-500 transition-colors"
            >
              Ir al inicio de sesión
            </Link>
            <Link
              to="/"
              style={{ letterSpacing: '0.2em' }}
              className="text-[9px] text-stone-400 uppercase hover:text-stone-900 transition-colors"
            >
              ← Volver a la tienda
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}