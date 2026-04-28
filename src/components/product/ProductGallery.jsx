import { heroImage, productImage, thumbImage } from '../../utils/imageUrl';
import { Maximize2 } from 'lucide-react';

export default function ProductGallery({ imagenes, selectedImage, onSelectImage, onOpenLightbox, producto, isTransitioning }) {
  const mainImgStyle = {
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    opacity:   isTransitioning ? 0 : 1,
    transform: isTransitioning ? 'scale(1.03)' : 'scale(1)',
  };

  return (
    <>
      {/* ── GALERÍA MOBILE ── */}
      <div className="md:hidden w-full flex flex-col px-5 pt-6">
        <div
          className="w-full relative group cursor-zoom-in"
          onClick={onOpenLightbox}
        >
          <div className="w-full overflow-hidden rounded-sm bg-stone-50" style={{ aspectRatio: '3/4' }}>
            <img
              src={heroImage(imagenes[selectedImage])}
              alt={`${producto.nombre} vista ${selectedImage + 1}`}
              width={900} height={1200}
              className="w-full h-full object-contain block"
              loading="eager"
              style={mainImgStyle}
            />
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 px-2 py-1 pointer-events-none">
            <Maximize2 size={9} className="text-white/70" />
            <span className="text-[7.5px] tracking-[0.18em] text-white/70 font-medium">AMPLIAR</span>
          </div>
        </div>

        {imagenes.length > 1 && (
          <div className="flex gap-3 pt-4 pb-2">
            {imagenes.map((img, i) => (
              <button
                key={i}
                onClick={() => onSelectImage(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={`flex-shrink-0 w-[72px] h-[90px] overflow-hidden rounded-sm transition-all duration-200 ${
                  selectedImage === i ? 'ring-1 ring-stone-900 ring-offset-2' : 'opacity-40 hover:opacity-70'
                }`}
              >
                <img
                  src={productImage(img)}
                  alt={`${producto.nombre} miniatura ${i + 1}`}
                  width={144} height={180}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── GALERÍA DESKTOP ── */}
      <div
        className="hidden md:flex md:w-3/5 gap-3 self-start"
        style={{ position: 'sticky', top: '120px', padding: '40px 20px 60px 40px' }}
      >
        {imagenes.length > 1 && (
          <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 88 }}>
            {imagenes.map((img, i) => (
              <button
                key={i}
                onClick={() => onSelectImage(i)}
                aria-label={`Ver imagen ${i + 1}`}
                style={{ aspectRatio: '3/4', width: 88 }}
                className={`overflow-hidden rounded-sm flex-shrink-0 transition-all duration-200 ${
                  selectedImage === i ? 'ring-1 ring-stone-900 ring-offset-1 opacity-100' : 'opacity-35 hover:opacity-70'
                }`}
              >
                <img
                  src={thumbImage(img)}
                  alt={`${producto.nombre} miniatura ${i + 1}`}
                  width={264} height={352}
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
            src={heroImage(imagenes[selectedImage])}
            alt={`${producto.nombre} vista ${selectedImage + 1}`}
            width={900} height={1200}
            className="w-full h-full object-contain block"
            loading="eager"
            style={mainImgStyle}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <Maximize2 size={10} className="text-white/75" />
            <span className="text-[8px] tracking-[0.2em] text-white/75 font-medium">AMPLIAR</span>
          </div>
        </div>
      </div>
    </>
  );
}
