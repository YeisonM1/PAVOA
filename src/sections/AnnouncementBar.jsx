import { useState, useEffect } from 'react';
import { getAnnouncementBar } from '../services/productService';

const FALLBACK = [
  '✦ Envío gratis en compras mayores a $150.000 · Colombia ✦',
  '✦ Nueva colección disponible · Piezas limitadas ✦',
  '✦ Envíos a todo el país · 3 a 5 días hábiles ✦',
];

export default function AnnouncementBar() {
  const [mensajes, setMensajes] = useState(FALLBACK);
  const [current, setCurrent]   = useState(0);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    getAnnouncementBar().then(data => {
      if (data && data.length > 0) setMensajes(data);
    });
  }, []);

  useEffect(() => {
    if (mensajes.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % mensajes.length);
        setVisible(true);
      }, 600);
    }, 4000);
    return () => clearInterval(interval);
  }, [mensajes]);

  return (
    // ✏️ FIX: eliminado "relative" que conflictuaba con "fixed"
    <div
      style={{ background: '#1C1410', height: 36 }}
      className="fixed top-0 left-0 w-full z-[48] flex items-center justify-center overflow-hidden"
    >
      <p
        className="text-[10px] font-medium tracking-[0.22em] uppercase text-center px-8 transition-all duration-500 ease-in-out select-none"
        style={{
          color: '#C9A96E',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
        }}
      >
        {mensajes[current]}
      </p>

      {mensajes.length > 1 && (
        <div className="absolute right-4 flex items-center gap-1.5">
          {mensajes.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 14 : 4,
                height: 4,
                background: '#C9A96E',
                opacity: i === current ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}