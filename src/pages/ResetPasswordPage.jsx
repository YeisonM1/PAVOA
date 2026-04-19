import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import logo from '../assets/LOGO-PAVOA.svg';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    if (!email || !token) {
      setError('Enlace inválido o incompleto. Solicita uno nuevo.');
    }
  }, [email, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !token) return;
    
    setError('');
    setLoading(true);
    try {
      await resetPassword(email, token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
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
              Seguridad
            </p>
            <h1 className="text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
              Nueva <strong className="font-bold">contraseña</strong>
            </h1>
            <div className="w-8 h-[1px] mt-4" style={{ backgroundColor: '#DFCDB4' }} />
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 p-6 text-center">
              <p style={{ letterSpacing: '0.1em' }} className="text-[11px] text-green-800 uppercase font-bold mb-2">
                Contraseña actualizada
              </p>
              <p className="text-[12px] text-green-700 mb-4">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label style={{ letterSpacing: '0.25em' }} className="text-[9px] font-bold text-stone-500 uppercase">
                  Ingresa nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={!email || !token}
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
                disabled={loading || !email || !token}
                style={{ letterSpacing: '0.3em', backgroundColor: (loading || !email || !token) ? '#9ca3af' : '#0B0B0B' }}
                className="w-full h-13 py-4 text-[10px] font-bold text-white uppercase transition-all duration-300 hover:opacity-80 mt-2"
              >
                {loading ? 'Actualizando...' : 'Guardar contraseña'}
              </button>
            </form>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/login"
              style={{ letterSpacing: '0.2em' }}
              className="text-[9px] text-stone-400 uppercase hover:text-stone-900 transition-colors"
            >
              ← Cancelar y volver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}