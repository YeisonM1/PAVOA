import useSiteSettings from '../hooks/useSiteSettings';

const sanitizePhoneNumber = (value) => String(value || '').replace(/\D/g, '');

const buildWhatsAppUrl = (number) => {
  const digits = sanitizePhoneNumber(number);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent('Hola, quiero información sobre PAVOA.')}`;
};

export default function WhatsAppFloatingButton() {
  const settings = useSiteSettings();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber);

  if (!whatsappUrl) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar por WhatsApp"
      className="group fixed bottom-5 right-5 z-[95] flex h-12 items-center gap-2 rounded-full border border-[#d6b67c]/40 bg-[#111827] pl-3.5 pr-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d6b67c]/70 hover:shadow-[0_8px_28px_rgba(0,0,0,0.22)] md:bottom-7 md:right-7 md:hover:pl-4 md:hover:pr-5"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[#faf5ef]">
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
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold text-[#faf5ef] opacity-0 transition-all duration-300 md:inline md:group-hover:max-w-[120px] md:group-hover:opacity-100">
        Escríbenos
      </span>
    </a>
  );
}
