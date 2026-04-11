import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import logo from '../assets/LOGO-PAVOA.svg';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 5) {
      setError('La contraseña debe tener al menos 5 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/cuenta', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta.');
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
              Nueva cuenta
            </p>
            <h1 className="text-2xl font-light text-stone-900 tracking-[0.15em] uppercase">
              Crear <strong className="font-bold">cuenta</strong>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label style={{ letterSpacing: '0.2em' }} className="text-[9px] font-bold text-stone-500 uppercase">
                  Nombre
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Ana"
                  className="border border-stone-200 px-4 py-3 text-[12px] text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ letterSpacing: '0.2em' }} className="text-[9px] font-bold text-stone-500 uppercase">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="García"
                  className="border border-stone-200 px-4 py-3 text-[12px] text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ letterSpacing: '0.2em' }} className="text-[9px] font-bold text-stone-500 uppercase">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 5 caracteres"
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="flex flex-col gap-4 mt-8 text-center">
            <p className="text-[11px] text-stone-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ letterSpacing: '0.1em' }} className="text-stone-900 font-bold uppercase underline hover:text-stone-500 transition-colors">
                Inicia sesión
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