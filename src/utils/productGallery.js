export const PRODUCT_EXCHANGE_COPY = 'Cambios dentro de los primeros 2 días';

export const getThumbnailScrollLeft = ({
  scrollLeft,
  viewportWidth,
  itemOffsetLeft,
  itemWidth,
  maxScrollLeft,
  edgePadding = 8,
}) => {
  const visibleStart = scrollLeft + edgePadding;
  const visibleEnd = scrollLeft + viewportWidth - edgePadding;
  const itemEnd = itemOffsetLeft + itemWidth;

  if (itemOffsetLeft < visibleStart) {
    return Math.max(0, itemOffsetLeft - edgePadding);
  }
  if (itemEnd > visibleEnd) {
    return Math.min(maxScrollLeft, itemEnd - viewportWidth + edgePadding);
  }
  return null;
};

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
