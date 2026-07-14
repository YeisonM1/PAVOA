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
