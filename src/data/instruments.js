/** CME micro/mini specs plus $1/pt perp units. Review if the exchange amends tick size. Updated 2026-10. */

export const INSTRUMENTS = [
  { id: 'MES', name: 'Micro E-mini S&P 500', kind: 'micro', book: 'futures', tickSize: 0.25, tickValue: 1.25, pointValue: 5 },
  { id: 'ES', name: 'E-mini S&P 500', kind: 'mini', book: 'futures', tickSize: 0.25, tickValue: 12.5, pointValue: 50 },
  { id: 'MNQ', name: 'Micro Nasdaq-100', kind: 'micro', book: 'futures', tickSize: 0.25, tickValue: 0.5, pointValue: 2 },
  { id: 'NQ', name: 'E-mini Nasdaq-100', kind: 'mini', book: 'futures', tickSize: 0.25, tickValue: 5, pointValue: 20 },
  { id: 'MYM', name: 'Micro Dow', kind: 'micro', book: 'futures', tickSize: 1, tickValue: 0.5, pointValue: 0.5 },
  { id: 'YM', name: 'E-mini Dow', kind: 'mini', book: 'futures', tickSize: 1, tickValue: 5, pointValue: 5 },
  { id: 'M2K', name: 'Micro Russell 2000', kind: 'micro', book: 'futures', tickSize: 0.1, tickValue: 0.5, pointValue: 5 },
  { id: 'RTY', name: 'E-mini Russell 2000', kind: 'mini', book: 'futures', tickSize: 0.1, tickValue: 5, pointValue: 50 },
  { id: 'MCL', name: 'Micro Crude Oil', kind: 'micro', book: 'futures', tickSize: 0.01, tickValue: 1, pointValue: 100 },
  { id: 'CL', name: 'Crude Oil', kind: 'mini', book: 'futures', tickSize: 0.01, tickValue: 10, pointValue: 1000 },
  { id: 'MGC', name: 'Micro Gold', kind: 'micro', book: 'futures', tickSize: 0.1, tickValue: 1, pointValue: 10 },
  { id: 'GC', name: 'Gold', kind: 'mini', book: 'futures', tickSize: 0.1, tickValue: 10, pointValue: 100 },
  { id: 'NQ1', name: 'Perp NQ unit', kind: 'perp', book: 'perps', tickSize: 0.25, tickValue: 0.25, pointValue: 1 },
  { id: 'ES1', name: 'Perp ES unit', kind: 'perp', book: 'perps', tickSize: 0.25, tickValue: 1.25, pointValue: 5 },
];

export const BOOKS = [
  { id: 'futures', label: 'Futures' },
  { id: 'perps', label: 'Perps' },
];

export function instrumentsForBook(book = 'futures') {
  const list = INSTRUMENTS.filter(i => i.book === book);
  return list.length ? list : INSTRUMENTS.filter(i => i.book === 'futures');
}

export function instrumentById(id) {
  return INSTRUMENTS.find(i => i.id === id) || INSTRUMENTS[2];
}
