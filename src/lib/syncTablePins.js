/** Keep extracted headers aligned with the board. No JS fake-pin — that lags iOS scroll. */
export function syncTablePins(board, rail) {
  if (!board || !rail) return;
  if (rail.scrollLeft !== board.scrollLeft) rail.scrollLeft = board.scrollLeft;
}

export function bindTablePinScroll(board, rail) {
  if (!board) return () => {};
  let ticking = false;
  const sync = () => {
    ticking = false;
    syncTablePins(board, rail);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sync);
  };
  sync();
  const raf = requestAnimationFrame(() => {
    sync();
    requestAnimationFrame(sync);
  });
  const later = window.setTimeout(sync, 120);
  board.addEventListener('scroll', onScroll, { passive: true });
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(onScroll) : null;
  ro?.observe(board);
  if (rail) ro?.observe(rail);
  window.addEventListener('resize', onScroll);
  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(later);
    board.removeEventListener('scroll', onScroll);
    ro?.disconnect();
    window.removeEventListener('resize', onScroll);
  };
}
