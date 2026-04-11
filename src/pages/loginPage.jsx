import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import logo from '../assets/LOGO-PAVOA.svg';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/cuenta', { replace: true });
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Logo */}
      <div className="flex justify-center pt-16 pb-12">
        <Link to="/">
          <img src={logo} alt="PAVOA" className="h-10 w-auto object-contain" />
        </Link>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-start justify-center px-6">
        <div className="w-full max-w-sm">

          <div className="mb-10">
            <p style={{ letterSpacing: '0.3em' }} className="text-[9px] text-stone-400 uppercase font-medium mb-2">
              Bienvenida
            </p>
            <h1 className="text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
              Iniciar <strong className="font-bold">sesión</strong>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label style={{ letterSpacing: '0.2em' }} className="text-[9px] font-bold text-stone-500 uppercase">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="border border-stone-200 px-4 py-3 text-[12px] text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ letterSpacing: '0.2em' }} className="text-[9px] font-bold text-stone-500 uppercase">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="border border-stone-200 px-4 py-3 text-[12px] text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
              />
            </div>

            {error && (
              <p style={{ letterSpacing: '0.1em' }} className="text-[10px] text-red-500 uppercase">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ letterSpacing: '0.25em' }}
              className={`w-full h-12 text-[10px] font-bold uppercase transition-all duration-300 mt-2
                ${loading ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-700'} text-white`}
            >
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="flex flex-col gap-4 mt-8 text-center">
            <p className="text-[11px] text-stone-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" style={{ letterSpacing: '0.1em' }} className="text-stone-900 font-bold uppercase underline hover:text-stone-500 transition-colors">
                Regístrate
              </Link>
            </p>
            <Link to="/" style={{ letterSpacing: '0.15em' }} className="text-[10px] text-stone-400 uppercase hover:text-stone-900 transition-colors">
              ← Volver a la tienda
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}