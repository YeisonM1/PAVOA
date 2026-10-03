const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

export const getVerifiedPaymentState = ({ verifiedStatus, isVerifying }) => {
  const effectiveStatus = isVerifying ? '' : normalizeStatus(verifiedStatus);

  return {
    effectiveStatus,
    isApproved: effectiveStatus === 'approved',
    isPending: effectiveStatus === 'pending' || effectiveStatus === 'in_process',
    isRejected: ['failure', 'rejected', 'cancelled', 'cancelled_process'].includes(effectiveStatus),
  };
};

// Mientras el pago siga en proceso, la pagina vuelve a preguntar. Un PSE se
// aprueba en uno o dos minutos y la clienta suele estar mirando esta pagina
// cuando pasa: el 1 y el 2 de octubre de 2026 los dos pagos se aprobaron con
// ella aqui, pero la pagina habia preguntado una sola vez al cargar y las
// ordenes tardaron horas en aparecer.
export const ESTADOS_EN_PROCESO = ['pending', 'in_process'];
export const INTERVALO_VERIFICACION_MS = 10_000;
// Diez minutos. Un pago que sigue pendiente despues de eso suele ser una
// transferencia que el banco confirma mas tarde, y para eso estan el aviso de
// Mercado Pago y la conciliacion.
export const MAX_VERIFICACIONES = 60;

export const sigueEnProceso = (status) => ESTADOS_EN_PROCESO.includes(normalizeStatus(status));
