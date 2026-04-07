import { useState, useEffect } from 'react';

/**
 * Hook reutilizable para carruseles con auto-avance.
 * @param {number} length  - Número total de slides
 * @param {number} interval - Tiempo entre slides en ms (default 6000)
 * @param {number} transitionDuration - Duración de la transición en ms (default 800)
 */
export function useCarousel(length, interval = 6000, transitionDuration = 800) {
  const [current, setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (idx) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, transitionDuration);
  };

  const next = () => goTo((current + 1) % length);
  const prev = () => goTo((current - 1 + length) % length);

  // Auto-avance
  useEffect(() => {
    const t = setTimeout(next, interval);
    return () => clearTimeout(t);
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  return { current, animating, goTo, next, prev };
}
