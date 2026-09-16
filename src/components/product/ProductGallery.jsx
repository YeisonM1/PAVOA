import { useEffect, useRef, useState } from 'react';
import { heroImage, productImage, thumbImage } from '../../utils/imageUrl';
import { Maximize2, ShieldCheck, Truck, Undo2 } from 'lucide-react';
import {
  getSwipeImageIndex,
  getThumbnailScrollLeft,
  PRODUCT_EXCHANGE_COPY,
} from '../../utils/productGallery.js';

const TRUST_ITEMS = [
  { icon: Truck, text: 'Envíos a todo Colombia' },
  { icon: Undo2, text: PRODUCT_EXCHANGE_COPY },
  { icon: ShieldCheck, text: 'Pago seguro' },
];

function ProductTrustBlock() {
  return (
    <div className="mt-10 px-2">
      <ul className="grid grid-cols-3 gap-4">
        {TRUST_ITEMS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex flex-col items-center text-center gap-2.5">
            <span className="flex items-center justify-center text-[#1C1410]">
              <Icon size={24} strokeWidth={1.85} />
            </span>
            <span className="text-[9.5px] leading-[1.65] tracking-[0.14em] text-[#1C1410] uppercase">
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductGallery({
  imagenes,
  selectedImage,
  onSelectImage,
  onOpenLightbox,
  producto,
  isTransitioning,
  colorKey,
}) {
  const [displayed, setDisplayed] = useState(imagenes);
  const [phase, setPhase] = useState('idle');
  const prevColorKey = useRef(colorKey);
  const timers = useRef([]);
  const touchStart = useRef(null);
  const didSwipe = useRef(false);
  const mobileThumbsRef = useRef(null);
  const mobileThumbRefs = useRef([]);

  useEffect(() => {
    if (colorKey === prevColorKey.current) return;
    prevColorKey.current = colorKey;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setPhase('out');

    const t1 = setTimeout(() => {
      setDisplayed(imagenes);
      setPhase('in-start');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('in');
          const t2 = setTimeout(() => setPhase('idle'), 340 + imagenes.length * 55);
          timers.current.push(t2);
        });
      });
    }, 220);

    timers.current.push(t1);

    return () => { timers.current.forEach(clearTimeout); };
  }, [colorKey]);

  useEffect(() => {
    if (phase === 'idle') setDisplayed(imagenes);
  }, [imagenes]);

  useEffect(() => {
    if (phase !== 'idle') return;

    const container = mobileThumbsRef.current;
    const activeThumb = mobileThumbRefs.current[selectedImage];
    if (!container || !activeThumb || container.clientWidth <= 0) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeThumb.getBoundingClientRect();
    const left = getThumbnailScrollLeft({
      scrollLeft: container.scrollLeft,
      viewportWidth: container.clientWidth,
      itemOffsetLeft: container.scrollLeft + activeRect.left - containerRect.left,
      itemWidth: activeRect.width,
      maxScrollLeft: Math.max(0, container.scrollWidth - container.clientWidth),
    });

    if (left !== null) {
      container.scrollTo({ left, behavior: 'smooth' });
    }
  }, [displayed.length, phase, selectedImage]);

  const getThumbStyle = (i, isSelected) => {
    const baseOp = isSelected ? 1 : 0.35;

    if (phase === 'out') return {
      opacity: 0,
      transform: 'translateY(-10px) scale(0.9)',
      transition: 'opacity 180ms ease, transform 180ms ease',
      pointerEvents: 'none',
    };
    if (phase === 'in-start') return {
      opacity: 0,
      transform: 'translateY(8px) scale(0.9)',
      transition: 'none',
      pointerEvents: 'none',
    };
    if (phase === 'in') return {
      opacity: baseOp,
      transform: 'translateY(0) scale(1)',
      transition: `opacity 280ms ease ${i * 55}ms, transform 280ms ease ${i * 55}ms`,
    };
    return { opacity: baseOp, transition: 'opacity 200ms ease, transform 200ms ease' };
  };

  const colorChanging = phase === 'out' || phase === 'in-start';
  const mainStyle = {
    transition: phase === 'in-start' ? 'none' : 'opacity 0.35s ease, transform 0.35s ease',
    opacity: (isTransitioning || colorChanging) ? 0 : 1,
    transform: (isTransitioning || phase === 'out') ? 'scale(1.03)' : phase === 'in-start' ? 'scale(0.98)' : 'scale(1)',
  };

  const src = displayed[selectedImage] ?? displayed[0];

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    didSwipe.current = false;
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;

    const nextIndex = getSwipeImageIndex({
      startX: start.x,
      startY: start.y,
      endX: touch.clientX,
      endY: touch.clientY,
      currentIndex: selectedImage,
      total: displayed.length,
    });

    if (nextIndex !== selectedImage) {
      didSwipe.current = true;
      onSelectImage(nextIndex);
    }
  };

  const handleMobileImageClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    onOpenLightbox();
  };

  return (
    <>
      <div className="md:hidden w-full flex flex-col px-5 pt-6">
        <div
          className="w-full relative group cursor-zoom-in"
          onClick={handleMobileImageClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <div className="w-full overflow-hidden rounded-sm bg-stone-50" style={{ aspectRatio: '3/4' }}>
            <img
              src={heroImage(src)}
              alt={`${producto.nombre} vista ${selectedImage + 1}`}
              width={900}
              height={1200}
              className="w-full h-full object-contain block"
              loading="eager"
              style={mainStyle}
            />
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 px-2 py-1 pointer-events-none">
            <Maximize2 size={9} className="text-white/70" />
            <span className="text-[7.5px] tracking-[0.18em] text-white/70 font-medium">AMPLIAR</span>
          </div>
        </div>

        {displayed.length > 1 && (
          <div
            ref={mobileThumbsRef}
            className="flex gap-3 pt-4 pb-2 overflow-x-auto overscroll-x-contain"
            style={{ scrollbarWidth: 'none' }}
          >
            {displayed.map((img, i) => (
              <button
                key={i}
                ref={(node) => {
                  mobileThumbRefs.current[i] = node;
                }}
                onClick={() => onSelectImage(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={`flex-shrink-0 w-[72px] h-[90px] overflow-hidden rounded-sm ${
                  selectedImage === i ? 'ring-1 ring-stone-900 ring-offset-2' : ''
                }`}
                style={getThumbStyle(i, selectedImage === i)}
              >
                <img
                  src={productImage(img)}
                  alt={`${producto.nombre} miniatura ${i + 1}`}
                  width={144}
                  height={180}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        <ProductTrustBlock />
      </div>

      <div
        className="hidden md:block md:w-3/5 self-start"
        style={{ position: 'sticky', top: '120px', padding: '40px 20px 60px 40px' }}
      >
        <div className="flex gap-3">
          {displayed.length > 1 && (
            <div
              className="flex flex-col gap-2 flex-shrink-0"
              style={{
                width: 88,
                maxHeight: '78vh',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'thin',
              }}
            >
              {displayed.map((img, i) => (
                <button
                  key={i}
                  onClick={() => onSelectImage(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  style={{ aspectRatio: '3/4', width: 88, ...getThumbStyle(i, selectedImage === i) }}
                  className={`overflow-hidden rounded-sm flex-shrink-0 ${
                    selectedImage === i ? 'ring-1 ring-stone-900 ring-offset-1' : ''
                  }`}
                >
                  <img
                    src={thumbImage(img)}
                    alt={`${producto.nombre} miniatura ${i + 1}`}
                    width={264}
                    height={352}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          <div
            className="relative flex-1 overflow-hidden rounded-sm group cursor-zoom-in bg-stone-50"
            style={{ maxHeight: '78vh' }}
            onClick={onOpenLightbox}
          >
            <img
              src={heroImage(src)}
              alt={`${producto.nombre} vista ${selectedImage + 1}`}
              width={900}
              height={1200}
              className="w-full h-full object-contain block"
              loading="eager"
              style={mainStyle}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <Maximize2 size={10} className="text-white/75" />
              <span className="text-[8px] tracking-[0.2em] text-white/75 font-medium">AMPLIAR</span>
            </div>
          </div>
        </div>

        <ProductTrustBlock />
      </div>
    </>
  );
}
