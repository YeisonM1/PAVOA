export const sanitizePhoneNumber = (value) => String(value || '').replace(/\D/g, '');

export const buildWhatsAppUrl = (number) => {
  const digits = sanitizePhoneNumber(number);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent('Hola, quiero información sobre PAVOA.')}`;
};
