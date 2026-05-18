import useSiteSettings from '../hooks/useSiteSettings';

const sanitizePhoneNumber = (value) => String(value || '').replace(/\D/g, '');

const formatPhoneLabel = (value) => {
  const digits = sanitizePhoneNumber(value);
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return value;
};

const buildWhatsAppUrl = (number) => {
  const digits = sanitizePhoneNumber(number);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent('Hola, quiero información sobre PAVOA.')}`;
};

const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12.05 3.2c-4.86 0-8.8 3.88-8.8 8.67 0 1.53.4 3.02 1.17 4.33L3.2 20.8l4.77-1.21a8.91 8.91 0 0 0 4.08.99c4.86 0 8.8-3.88 8.8-8.68 0-4.78-3.94-8.67-8.8-8.67Z"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.06 8.6c.18-.42.38-.43.56-.44.14 0 .3 0 .46.01.15 0 .4-.06.62.46.22.53.74 1.82.8 1.95.06.13.1.29.02.45-.07.16-.11.27-.22.42-.1.15-.22.33-.31.45-.11.13-.22.27-.09.54.13.26.56.9 1.2 1.46.82.72 1.5.94 1.76 1.05.26.11.4.1.54-.06.14-.15.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.13 1.14-.18.57-1.1 1.1-1.5 1.16-.39.06-.88.09-1.42-.08-.33-.11-.75-.24-1.3-.47-2.3-.98-3.8-3.28-3.92-3.44-.11-.16-.93-1.23-.93-2.34 0-1.1.58-1.64.79-1.86Z"
      fill="currentColor"
    />
  </svg>
);

export default function WhatsAppFloatingButton() {
  const settings = useSiteSettings();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber);
  const phoneLabel = formatPhoneLabel(settings.whatsappNumber);

  if (!whatsappUrl) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={phoneLabel ? `Hablar por WhatsApp al ${phoneLabel}` : 'Hablar por WhatsApp'}
      className="group fixed bottom-5 right-5 z-[95] md:bottom-7 md:right-7"
    >
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(173,125,60,0.18)_0%,_rgba(173,125,60,0)_72%)] blur-xl scale-110 opacity-80 transition-transform duration-500 group-hover:scale-[1.18]" />
      <span className="relative flex items-center gap-3 rounded-full border border-stone-700/70 bg-stone-950/92 pl-3.5 pr-4 py-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_22px_55px_rgba(0,0,0,0.34)]">
        <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(214,182,124,0.75)] to-transparent" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1f8f5f]/35 bg-[linear-gradient(145deg,#f8f4ec_0%,#e8decf_100%)] text-[#145c3f] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_22px_rgba(0,0,0,0.16)]">
          <WhatsAppIcon />
        </span>
        <span className="hidden min-w-0 md:flex md:flex-col md:items-start">
          <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-stone-400">
            Asesoría privada
          </span>
          <span className="text-[11px] font-semibold tracking-[0.1em] text-stone-100">
            WhatsApp
          </span>
          {phoneLabel ? (
            <span className="text-[10px] tracking-[0.08em] text-stone-400">
              {phoneLabel}
            </span>
          ) : null}
        </span>
      </span>
    </a>
  );
}
