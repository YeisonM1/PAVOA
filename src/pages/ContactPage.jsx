import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { enviarContacto } from '../services/productService';
import { WhatsAppIcon, MailIcon, ClockIcon } from '../components/Icons';

const ASUNTOS = [
  'Selecciona un asunto',
  'Información de pedido',
  'Guía de tallas',
  'Cambios y devoluciones',
  'Disponibilidad de producto',
  'Otro',
];

export default function ContactPage() {
  const [form, setForm] = useState({
    nombre: '',
    contacto: '',
    asunto: 'Selecciona un asunto',
    mensaje: '',
  });
  const [estado, setEstado] = useState('idle');
  const [errores, setErrores] = useState({});
  const [asuntoOpen, setAsuntoOpen] = useState(false); // ✅ NUEVO

  // ✅ Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#asunto-dropdown')) setAsuntoOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrores(prev => ({ ...prev, [e.target.name]: null }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.nombre.trim())   nuevosErrores.nombre   = 'Tu nombre es requerido';
    if (!form.contacto.trim()) nuevosErrores.contacto = 'Tu email o WhatsApp es requerido';
    if (form.asunto === 'Selecciona un asunto') nuevosErrores.asunto = 'Selecciona un asunto';
    if (!form.mensaje.trim())  nuevosErrores.mensaje  = 'Escribe tu mensaje';
    return nuevosErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setEstado('loading');
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      );
      const ok = await Promise.race([enviarContacto(form), timeout]);
      if (ok) {
        setEstado('success');
        setForm({ nombre: '', contacto: '', asunto: 'Selecciona un asunto', mensaje: '' });
      } else {
        setEstado('error');
      }
    } catch {
      setEstado('error');
    }
  };

  const inputBase = `w-full bg-transparent border-b text-[12px] tracking-[0.08em] text-stone-900 placeholder-stone-400 py-3 focus:outline-none transition-colors duration-200`;
  const inputNormal = `border-stone-200 focus:border-stone-900`;
  const inputError  = `border-red-300 focus:border-red-500`;
  const labelBase   = `text-[9px] font-bold tracking-[0.25em] uppercase text-stone-500 block mb-2`;

  return (
    <div className="min-h-screen bg-white" >
      <SEO
        title="Contacto"
        description="¿Tienes preguntas sobre tallas, pedidos o colecciones? Escríbenos y te respondemos pronto."
        url="/contacto"
      />

      {/* ── HERO ── */}
      <section className="w-full pt-[140px] md:pt-[160px] pb-8 md:pb-12 px-6 border-b border-stone-100"
        style={{ background: 'var(--color-ivory)' }}>
        <div className="max-w-[1400px] mx-auto">
          <nav className="mb-8">
            <span className="text-[10px] tracking-[0.2em] text-stone-500 uppercase flex items-center gap-2">
              <Link to="/" className="hover:text-stone-900 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-stone-900 font-bold">Contacto</span>
            </span>
          </nav>
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-stone-400 block mb-3">
            Estamos aquí
          </span>
          <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-[0.15em] uppercase">
            Hablemos
          </h1>
          <div className="w-12 h-[1px] mt-6" style={{ background: 'var(--color-gold)' }} />
        </div>
      </section>

      {/* ── CONTENIDO ── */}
      <section className="w-full py-10 md:py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-24">

          {/* ── INFORMACIÓN ── */}
          <aside className="lg:col-span-2 flex flex-col gap-10">
            <div>
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-stone-400 mb-6">Información</p>
              <div className="flex flex-col gap-8">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 flex items-center justify-center border border-stone-200 flex-shrink-0 text-stone-500">
                    <WhatsAppIcon />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-900 mb-1">WhatsApp</p>
                    <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer"
                      className="text-[12px] text-stone-500 hover:text-stone-900 transition-colors">
                      +57 300 000 0000
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 flex items-center justify-center border border-stone-200 flex-shrink-0 text-stone-500">
                    <MailIcon />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-900 mb-1">Email</p>
                    <a href="mailto:hola@pavoa.co"
                      className="text-[12px] text-stone-500 hover:text-stone-900 transition-colors">
                      hola@pavoa.co
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 flex items-center justify-center border border-stone-200 flex-shrink-0 text-stone-500">
                    <ClockIcon />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-900 mb-1">Horario</p>
                    <p className="text-[12px] text-stone-500 leading-relaxed">
                      Lun — Vie: 8am – 6pm<br />
                      Sáb: 9am – 2pm
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[1px] w-full bg-stone-100" />
            <div>
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-stone-400 mb-3">Tiempo de respuesta</p>
              <p className="text-[12px] text-stone-500 leading-relaxed">
                Respondemos todos los mensajes en un máximo de <strong className="text-stone-900">24 horas hábiles</strong>.
              </p>
            </div>
          </aside>

          {/* ── FORMULARIO ── */}
          <div className="lg:col-span-3">
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-stone-400 mb-10">
              Envíanos un mensaje
            </p>

            {estado === 'success' ? (
              <div className="flex flex-col items-center justify-center py-20 gap-6 text-center border border-stone-100">
                <div className="w-12 h-12 flex items-center justify-center border border-stone-900">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-900 mb-2">Mensaje enviado</p>
                  <p className="text-[12px] text-stone-500 tracking-[0.08em]">Te respondemos en menos de 24 horas.</p>
                </div>
                <button
                  onClick={() => setEstado('idle')}
                  className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-stone-900 pb-1 hover:opacity-60 transition-opacity mt-2"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">

                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className={labelBase}>Nombre</label>
                  <input
                    id="nombre" name="nombre" type="text"
                    value={form.nombre} onChange={handleChange}
                    placeholder="Tu nombre completo"
                    className={`${inputBase} ${errores.nombre ? inputError : inputNormal}`}
                                     />
                  {errores.nombre && <p className="text-[10px] text-red-400 mt-1 tracking-[0.05em]">{errores.nombre}</p>}
                </div>

                {/* Contacto */}
                <div>
                  <label htmlFor="contacto" className={labelBase}>Email o WhatsApp</label>
                  <input
                    id="contacto" name="contacto" type="text"
                    value={form.contacto} onChange={handleChange}
                    placeholder="hola@correo.com o +57 300 000 0000"
                    className={`${inputBase} ${errores.contacto ? inputError : inputNormal}`}
                                     />
                  {errores.contacto && <p className="text-[10px] text-red-400 mt-1 tracking-[0.05em]">{errores.contacto}</p>}
                </div>

                {/* ✅ Asunto — dropdown custom */}
                <div className="relative" id="asunto-dropdown">
                  <label className={labelBase}>Asunto</label>
                  <button
                    type="button"
                    onClick={() => setAsuntoOpen(v => !v)}
                    className={`w-full flex items-center justify-between py-3 border-b text-[12px] tracking-[0.08em] transition-colors duration-200 text-left
                      ${errores.asunto ? 'border-red-300' : 'border-stone-200 hover:border-stone-900'}
                      ${form.asunto === 'Selecciona un asunto' ? 'text-stone-400' : 'text-stone-900'}
                    `}
                    style={{ background: 'none' }}
                    aria-haspopup="listbox"
                    aria-expanded={asuntoOpen}
                  >
                    {form.asunto}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.5" aria-hidden="true"
                      className={`transition-transform duration-300 text-stone-400 flex-shrink-0 ${asuntoOpen ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Opciones */}
                  <div
                    role="listbox"
                    className={`absolute top-full left-0 right-0 z-20 bg-white border border-stone-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 origin-top
                      ${asuntoOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}
                    `}
                  >
                    {ASUNTOS.filter(a => a !== 'Selecciona un asunto').map(a => (
                      <button
                        key={a}
                        type="button"
                        role="option"
                        aria-selected={form.asunto === a}
                        onClick={() => {
                          setForm(prev => ({ ...prev, asunto: a }));
                          setErrores(prev => ({ ...prev, asunto: null }));
                          setAsuntoOpen(false);
                        }}
                                               className={`w-full text-left px-5 py-4 text-[11px] tracking-[0.1em] transition-colors duration-150
                          ${form.asunto === a ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'}
                        `}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  {errores.asunto && <p className="text-[10px] text-red-400 mt-1 tracking-[0.05em]">{errores.asunto}</p>}
                </div>

                {/* Mensaje */}
                <div>
                  <label htmlFor="mensaje" className={labelBase}>Mensaje</label>
                  <textarea
                    id="mensaje" name="mensaje" rows={5}
                    value={form.mensaje} onChange={handleChange}
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                    className={`${inputBase} ${errores.mensaje ? inputError : inputNormal} resize-none`}
                                     />
                  {errores.mensaje && <p className="text-[10px] text-red-400 mt-1 tracking-[0.05em]">{errores.mensaje}</p>}
                </div>

                {/* Error general */}
                {estado === 'error' && (
                  <p className="text-[11px] text-red-400 tracking-[0.08em]">
                    Hubo un error al enviar. Intenta de nuevo o escríbenos por WhatsApp.
                  </p>
                )}

                {/* Botón */}
                <button
                  type="submit"
                  disabled={estado === 'loading'}
                  className={`h-14 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3
                    ${estado === 'loading'
                      ? 'bg-stone-400 text-white cursor-not-allowed'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                >
                  {estado === 'loading' ? 'Enviando...' : 'Enviar mensaje'}
                </button>

              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}