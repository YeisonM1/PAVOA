import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logo from '../assets/LOGO-PAVOA.svg';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error | expired

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setEstado('error');
      return;
    }

    fetch(`/api/verify?token=${token}&email=${encodeURIComponent(email)}`)
      .then(res => {
        if (res.ok || res.redirected) {
          setEstado('ok');
        } else {
          setEstado('error');
        }
      })
      .catch(() => setEstado('error'));
  }, []);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F2E4E1' }}>

      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16" style={{ backgroundColor: '#0B0B0B' }}>
        <Link to="/">
          <img src={logo} alt="PAVOA" className="h-8 w-auto object-contain brightness-0 invert" />
        </Link>
        <div>
          <p style={{ letterSpacing: '0.3em' }} className="text-[9px] text-white/40 uppercase font-medium mb-4">
            Verificación
          </p>
          <h2 className="text-4xl font-light text-white leading-tight tracking-[0.1em] uppercase mb-6">
            Tu cuenta<br /><strong className="font-bold">te espera.</strong>
          </h2>
          <div className="w-12 h-[1px]" style={{ backgroundColor: '#DFCDB4' }} />
        </div>
        <p style={{ letterSpacing: '0.15em' }} className="text-[9px] text-white/30 uppercase">
          © 2026 PAVOA. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel derecho */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-16">
        <div className="flex justify-center mb-12 lg:hidden">
          <Link to="/"><img src={logo} alt="PAVOA" className="h-8 w-auto object-contain" /></Link>
        </div>

        <div className="max-w-sm w-full mx-auto text-center lg:text-left">

          {/* Cargando */}
          {estado === 'cargando' && (
            <p style={{ letterSpacing: '0.3em' }} className="text-[10px] font-bold uppercase text-stone-500 animate-pulse">
              Verificando tu cuenta...
            </p>
          )}

          {/* Éxito */}
          {estado === 'ok' && (
            <>
              <div className="mb-8 flex justify-center lg:justify-start">
                <div className="w-16 h-16 flex items-center justify-center" style={{ backgroundColor: '#0B0B0B' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <p style={{ letterSpacing: '0.35em' }} className="text-[9px] text-stone-400 uppercase font-medium mb-3">
                ¡Listo!
              </p>
              <h1 className="text-2xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
                Correo <strong className="font-bold">verificado</strong>
              </h1>
              <div className="w-8 h-[1px] mb-6" style={{ backgroundColor: '#DFCDB4' }} />
              <p className="text-[12px] text-stone-500 mb-8">
                Tu cuenta está activa. Ya puedes iniciar sesión.
              </p>
              <Link
                to="/login"
                style={{ letterSpacing: '0.3em', backgroundColor: '#0B0B0B' }}
                className="inline-block py-4 px-8 text-[10px] font-bold text-white uppercase hover:opacity-80 transition-opacity"
              >
                Iniciar sesión
              </Link>
            </>
          )}

          {/* Error */}
          {(estado === 'error' || estado === 'expired') && (
            <>
              <div className="mb-8 flex justify-center lg:justify-start">
                <div className="w-16 h-16 flex items-center justify-center" style={{ backgroundColor: '#0B0B0B' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <p style={{ letterSpacing: '0.35em' }} className="text-[9px] text-stone-400 uppercase font-medium mb-3">
                Error
              </p>
              <h1 className="text-2xl font-light text-stone-900 tracking-[0.15em] uppercase mb-4">
                Enlace <strong className="font-bold">inválido</strong>
              </h1>
              <div className="w-8 h-[1px] mb-6" style={{ backgroundColor: '#DFCDB4' }} />
              <p className="text-[12px] text-stone-500 mb-8">
                {estado === 'expired'
                  ? 'El enlace expiró. Regístrate de nuevo para recibir uno nuevo.'
                  : 'El enlace no es válido. Intenta registrarte de nuevo.'}
              </p>
              <Link
                to="/register"
                style={{ letterSpacing: '0.3em', backgroundColor: '#0B0B0B' }}
                className="inline-block py-4 px-8 text-[10px] font-bold text-white uppercase hover:opacity-80 transition-opacity"
              >
                Registrarse de nuevo
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}