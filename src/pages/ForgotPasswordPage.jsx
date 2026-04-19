import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import logo from '../assets/LOGO-PAVOA.svg';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F2E4E1' }}>
      {/* ── LADO IZQUIERDO ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16" style={{ backgroundColor: '#0B0B0B' }}>
        <Link to="/">
          <img src={logo} alt="PAVOA" className="h-16 w-auto object-contain brightness-0 invert" />
        </Link>
        <div>
          <p style={{ letterSpacing: '0.3em' }} className="text-[9px] text-white/40 uppercase font-medium mb-4">
            Colección 2026
          </p>
          <h2 className="text-4xl font-light text-white leading-tight tracking-[0.1em] uppercase mb-6">
            Elegancia natural.<br />
            <strong className="font-bold">Presencia silenciosa.</strong>
          </h2>
          <div className="w-12 h-[1px]" style={{ backgroundColor: '#DFCDB4' }} />
        </div>
        <p style={{ letterSpacing: '0.15em' }} className="text-[9px] text-white/30 uppercase">
          © 2026 PAVOA. Todos los derechos reservados.
        </p>
      </div>

      {/* ── LADO DERECHO ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-16">
        <div className="flex justify-center mb-12 lg:hidden">
          <Link to="/">
            <img src={logo} alt="PAVOA" className="h-14 w-auto object-contain" />
          </Link>
        </div>

        <div className="max-w-sm w-full mx-auto">
          <div className="mb-10">
            <p style={{ letterSpacing: '0.35em' }} className="text-[9px] text-stone-400 uppercase font-medium mb-3">
              Recuperación
            </p>
            <h1 className="text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
              Olvidé mi <strong className="font-bold">contraseña</strong>
            </h1>
            <div className="w-8 h-[1px] mt-4" style={{ backgroundColor: '#DFCDB4' }} />
            <p className="text-[12px] text-stone-500 mt-6 leading-relaxed">
              Ingresa tu correo electrónico y te enviaremos un enlace para que puedas crear una nueva contraseña.
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 p-6 flex flex-col gap-4 text-center">
              <p style={{ letterSpacing: '0.1em' }} className="text-[11px] text-green-800 uppercase font-bold">
                Correo enviado
              </p>
              <p className="text-[12px] text-green-700">
                Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos. Revisa tu carpeta de spam si no lo encuentras.
              </p>
              <Link
                to="/login"
                style={{ letterSpacing: '0.2em' }}
                className="text-[10px] text-stone-900 uppercase font-bold hover:opacity-70 mt-2 inline-block"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-500 uppercase">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@correo.com"
                  className="border border-stone-300 bg-white px-4 py-3.5 text-[12px] text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors duration-200"
                  style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                />
              </div>

              {error && (
                <p style={{ letterSpacing: '0.1em' }} className="text-[10px] text-red-500 uppercase">
                  ✦ {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ letterSpacing: '0.3em', backgroundColor: loading ? '#9ca3af' : '#0B0B0B' }}
                className="w-full h-13 py-4 text-[10px] font-bold text-white uppercase transition-all duration-300 hover:opacity-80 mt-2"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-stone-200" />
            <span style={{ letterSpacing: '0.2em' }} className="text-[9px] text-stone-300 uppercase">o</span>
            <div className="flex-1 h-[1px] bg-stone-200" />
          </div>

          <div className="text-center flex flex-col gap-4">
            <Link
              to="/login"
              style={{ letterSpacing: '0.2em' }}
              className="text-[9px] text-stone-400 uppercase hover:text-stone-900 transition-colors"
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}