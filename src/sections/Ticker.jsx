import { useEffect, useRef, useState } from 'react';
import { getTickerItems, TICKER_DEFAULTS } from '../services/productService';

export default function Ticker() {
  const trackRef = useRef(null);
  const [items, setItems] = useState(TICKER_DEFAULTS);

  useEffect(() => {
    getTickerItems().then(data => setItems(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let pos = 0;
    const speed = 0.5;
    const totalWidth = track.scrollWidth / 2;

    const step = () => {
      pos -= speed;
      if (Math.abs(pos) >= totalWidth) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(step);
    };

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  const repeated = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden py-3"
      style={{ backgroundColor: '#1c1917', borderTop: '1px solid #292524', borderBottom: '1px solid #292524' }}
    >
      <div ref={trackRef} className="flex whitespace-nowrap will-change-transform">
        {repeated.map((item, i) => (
          <span
            key={i}
            style={{ letterSpacing: '0.2em' }}
            className="font-secondary text-[10px] font-light text-stone-300 flex-shrink-0 flex items-center"
          >
            <span className="mx-8">{item.toUpperCase()}</span>
            <span style={{ color: '#57534e' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
