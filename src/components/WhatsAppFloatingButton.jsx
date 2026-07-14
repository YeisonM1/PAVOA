import useSiteSettings from '../hooks/useSiteSettings';
import { WhatsAppIcon } from './Icons';
import { buildWhatsAppUrl } from '../utils/whatsapp';

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
      <span className="shrink-0 text-[#faf5ef]"><WhatsAppIcon size={20} /></span>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold text-[#faf5ef] opacity-0 transition-all duration-300 md:inline md:group-hover:max-w-[120px] md:group-hover:opacity-100">
        Escríbenos
      </span>
    </a>
  );
}
