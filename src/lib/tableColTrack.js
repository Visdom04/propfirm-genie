/** Shared compare-table column contract: every row uses the same pixel tracks. */

export function colTrack(px) {
  const n = Math.max(0, Number(px) || 0);
  return {
    boxSizing: 'border-box',
    flex: `0 0 ${n}px`,
    width: n,
    minWidth: n,
    maxWidth: n,
    overflow: 'hidden',
  };
}

export function midTrackPx(cols, sizeOf = col => col.min) {
  return cols.reduce((sum, col) => sum + (Number(sizeOf(col)) || 0), 0);
}
