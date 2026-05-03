import { useEffect } from 'react';
import { X } from 'lucide-react';

const TALLAS = [
  { talla: 'XS',  busto: '76–80', cintura: '58–62', cadera: '84–88' },
  { talla: 'S',   busto: '80–84', cintura: '62–66', cadera: '88–92' },
  { talla: 'M',   busto: '84–88', cintura: '66–70', cadera: '92–96' },
  { talla: 'L',   busto: '88–92', cintura: '70–74', cadera: '96–100' },
  { talla: 'XL',  busto: '92–96', cintura: '74–78', cadera: '100–104' },
  { talla: 'XXL', busto: '96–102', cintura: '78–84', cadera: '104–110' },
];

export default function GuiaTallasModal({ onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
          <div>
            <p className="text-[9px] font-medium tracking-[0.3em] text-stone-400 uppercase mb-1">PAVOA</p>
            <h2 className="text-[13px] font-bold tracking-[0.2em] text-stone-900 uppercase">Guía de tallas</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            aria-label="Cerrar guía de tallas"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-8 py-6">

          {/* Cómo medirte */}
          <div className="mb-6">
            <p className="text-[9px] font-bold tracking-[0.25em] text-stone-400 uppercase mb-3">Cómo medirte</p>
            <ul className="flex flex-col gap-2">
              {[
                ['Busto', 'Mide alrededor de la parte más ancha del pecho, con los brazos relajados.'],
                ['Cintura', 'Mide en la parte más estrecha del torso, sobre el ombligo.'],
                ['Cadera', 'Mide alrededor de la parte más ancha de las caderas.'],
              ].map(([parte, desc]) => (
                <li key={parte} className="flex gap-3 text-[11px] text-stone-500 leading-relaxed">
                  <span className="font-bold text-stone-900 min-w-[52px]">{parte}</span>
                  {desc}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full h-[1px] bg-stone-100 mb-6" />

          {/* Tabla */}
          <p className="text-[9px] font-bold tracking-[0.25em] text-stone-400 uppercase mb-4">Medidas en cm</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200">
                  {['Talla', 'Busto', 'Cintura', 'Cadera'].map(col => (
                    <th key={col} className="pb-3 pr-4 text-[9px] font-bold tracking-[0.2em] text-stone-400 uppercase">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TALLAS.map(({ talla, busto, cintura, cadera }) => (
                  <tr key={talla} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="py-3 pr-4 text-[12px] font-bold text-stone-900 tracking-[0.1em]">{talla}</td>
                    <td className="py-3 pr-4 text-[12px] text-stone-600">{busto}</td>
                    <td className="py-3 pr-4 text-[12px] text-stone-600">{cintura}</td>
                    <td className="py-3 pr-4 text-[12px] text-stone-600">{cadera}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="w-full h-[1px] bg-stone-100 my-6" />

          {/* Talla única */}
          <div className="bg-[#F2E4E1] px-5 py-4">
            <p className="text-[9px] font-bold tracking-[0.25em] text-stone-700 uppercase mb-1">Talla Única</p>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Nuestras piezas de talla única están diseñadas para adaptarse a cuerpos entre S y L, con tejidos de alta elasticidad que se moldean a tu figura.
            </p>
          </div>

          <p className="text-[10px] text-stone-400 tracking-[0.08em] mt-5 leading-relaxed">
            ¿Dudas sobre tu talla? Escríbenos a{' '}
            <a
              href="mailto:hola@pavoa.co"
              className="text-stone-900 font-bold underline underline-offset-2 hover:text-stone-500 transition-colors"
            >
              hola@pavoa.co
            </a>{' '}
            y te ayudamos.
          </p>
        </div>
      </div>
    </div>
  );
}
