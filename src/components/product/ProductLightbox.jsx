import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { heroImage, thumbImage } from '../../utils/imageUrl';

export default function ProductLightbox({ imagenes, selectedImage, onClose, onSelectImage, producto }) {
  const [lbFading, setLbFading] = useState(false);
  const touchStartX = useRef(null);

  const lbNav = (dir) => {
    setLbFading(true);
    setTimeout(() => {
      onSelectImage(i => (i + dir + imagenes.length) % imagenes.length);
      setLbFading(false);
    }, 180);
  };

  const lbGoTo = (i) => {
    if (i === selectedImage) return;
    setLbFading(true);
    setTimeout(() => { onSelectImage(i); setLbFading(false); }, 180);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 80) lbNav(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  useEffect(() => {
    const total = imagenes.length;
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') onSelectImage(i => (i + 1) % total);
      if (e.key === 'ArrowLeft')  onSelectImage(i => (i - 1 + total) % total);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [imagenes, onClose, onSelectImage]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(8, 6, 6, 0.96)' }}
      role="dialog" aria-modal="true" aria-label="Visor de imágenes"
    >
      <div className="flex items-center justify-between px-6 py-5 flex-shrink-0">
        <span className="text-[9px] tracking-[0.3em] text-white/30 font-medium select-none">
          {selectedImage + 1} / {imagenes.length}
        </span>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors p-2 -mr-2"
          aria-label="Cerrar visor"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-12 md:px-20 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {imagenes.length > 1 && (
          <button onClick={() => lbNav(-1)} className="absolute left-3 md:left-5 text-white/30 hover:text-white/80 transition-colors p-2" aria-label="Imagen anterior">
            <ChevronLeft size={26} strokeWidth={1.2} />
          </button>
        )}
        <img
          key={selectedImage}
          src={heroImage(imagenes[selectedImage])}
          alt={`${producto.nombre} vista ${selectedImage + 1}`}
          className="max-h-[80vh] max-w-full object-contain select-none"
          style={{ transition: 'opacity 0.2s ease', opacity: lbFading ? 0 : 1 }}
          draggable={false}
        />
        {imagenes.length > 1 && (
          <button onClick={() => lbNav(1)} className="absolute right-3 md:right-5 text-white/30 hover:text-white/80 transition-colors p-2" aria-label="Siguiente imagen">
            <ChevronRight size={26} strokeWidth={1.2} />
          </button>
        )}
      </div>

      {imagenes.length > 1 && (
        <div className="flex justify-center gap-2.5 px-6 py-5 flex-shrink-0">
          {imagenes.map((img, i) => (
            <button
              key={i}
              onClick={() => lbGoTo(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`w-12 h-[60px] overflow-hidden rounded-sm flex-shrink-0 transition-all duration-200 ${
                selectedImage === i ? 'ring-1 ring-white/70 ring-offset-1 ring-offset-transparent opacity-100' : 'opacity-25 hover:opacity-55'
              }`}
            >
              <img src={thumbImage(img)} alt="" aria-hidden="true" className="w-full h-full object-cover object-top" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
