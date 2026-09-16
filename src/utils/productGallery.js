export const getSwipeImageIndex = ({
  startX,
  startY,
  endX,
  endY,
  currentIndex,
  total,
  threshold = 48,
}) => {
  if (total <= 1) return currentIndex;

  const deltaX = endX - startX;
  const deltaY = endY - startY;

  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return currentIndex;
  }

  return deltaX < 0
    ? Math.min(currentIndex + 1, total - 1)
    : Math.max(currentIndex - 1, 0);
};
