/** Perp unit specs ($/pt). Review if the venue amends tick size. Updated 2026-10. */

export const INSTRUMENTS = [
  { id: 'NQ1', name: 'NQ perp unit', kind: 'perp', book: 'perps', tickSize: 0.25, tickValue: 0.25, pointValue: 1 },
  { id: 'ES1', name: 'ES perp unit', kind: 'perp', book: 'perps', tickSize: 0.25, tickValue: 1.25, pointValue: 5 },
  { id: 'BTC', name: 'BTC perp', kind: 'perp', book: 'perps', tickSize: 0.1, tickValue: 0.1, pointValue: 1 },
  { id: 'ETH', name: 'ETH perp', kind: 'perp', book: 'perps', tickSize: 0.1, tickValue: 0.1, pointValue: 1 },
  { id: 'SOL', name: 'SOL perp', kind: 'perp', book: 'perps', tickSize: 0.01, tickValue: 0.01, pointValue: 1 },
  { id: 'XAU', name: 'XAU perp', kind: 'perp', book: 'perps', tickSize: 0.1, tickValue: 0.1, pointValue: 1 },
];

export const BOOKS = [{ id: 'perps', label: 'Perps' }];

export function instrumentsForBook(book = 'perps') {
  const list = INSTRUMENTS.filter(i => i.book === book);
  return list.length ? list : INSTRUMENTS;
}

export function instrumentById(id) {
  return INSTRUMENTS.find(i => i.id === id) || INSTRUMENTS[0];
}
