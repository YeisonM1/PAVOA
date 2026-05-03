import { useState, useEffect, useRef } from 'react';
import { getAnnouncementBar } from '../services/productService';

const normalizeAnnouncementCopy = (message) =>
  String(message || '')
    .replace(/piezas limitadas/gi, 'Ediciones limitadas')
    .replace(/\s+/g, ' ')
    .trim();

const RANGE_OR_NUMBER_REGEX = /(\d+\s+a\s+\d+|\d+)/gi;

const renderAnnouncementMessage = (message) =>
  String(message || '')
    .split(RANGE_OR_NUMBER_REGEX)
    .filter(Boolean)
    .map((chunk, index) => {
      if (RANGE_OR_NUMBER_REGEX.test(chunk)) {
        RANGE_OR_NUMBER_REGEX.lastIndex = 0;
        return (
          <span
            key={`${chunk}-${index}`}
            className="inline-block tracking-[0.08em] [font-variant-numeric:lining-nums_tabular-nums]"
          >
            {chunk}
          </span>
        );
      }

      RANGE_OR_NUMBER_REGEX.lastIndex = 0;
      return <span key={`${chunk}-${index}`}>{chunk}</span>;
    });

const FALLBACK = [
  'Descubre tu mejor version · PAVOA',
  'Nueva coleccion disponible · Ediciones limitadas',
  'Sientete segura · Envios a todo el pais',
].map(normalizeAnnouncementCopy);

export default function AnnouncementBar() {
  const [mensajes, setMensajes] = useState(FALLBACK);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [heroSyncActive, setHeroSyncActive] = useState(false);
  const currentRef = useRef(0);
  const syncTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    getAnnouncementBar().then((data) => {
      if (data && data.length > 0) setMensajes(data.map(normalizeAnnouncementCopy));
    });
  }, []);

  useEffect(() => {
    if (mensajes.length <= 1) return;
    if (heroSyncActive) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % mensajes.length);
        setVisible(true);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, [mensajes, heroSyncActive]);

  useEffect(() => {
    const onHeroSlideChange = (e) => {
      const rawIndex = Number(e?.detail?.index ?? 0);
      if (Number.isNaN(rawIndex) || mensajes.length === 0) return;

      const nextIndex = ((rawIndex % mensajes.length) + mensajes.length) % mensajes.length;
      setHeroSyncActive(true);

      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => setHeroSyncActive(false), 9000);

      if (currentRef.current === nextIndex) return;

      setVisible(false);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setCurrent(nextIndex);
        setVisible(true);
      }, 500);
    };

    window.addEventListener('pavoa:hero-slide-change', onHeroSlideChange);
    return () => {
      window.removeEventListener('pavoa:hero-slide-change', onHeroSlideChange);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [mensajes.length]);

  return (
    <div
      style={{ background: '#1C1410', height: 36 }}
      className="fixed top-0 left-0 w-full z-[48] flex items-center justify-center overflow-hidden"
    >
      <p
        className="text-[10px] font-medium tracking-[0.16em] uppercase text-center px-8 transition-all duration-500 ease-in-out select-none"
        style={{
          color: '#C9A96E',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
        }}
      >
        {renderAnnouncementMessage(mensajes[current])}
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
