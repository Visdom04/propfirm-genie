import { PAYOUT_FIRMS } from './catalog.js';
import { BUCKETS, hourFloor, keepPayout, rollFirm } from './rollup.js';
import { seedEvents } from './seed.js';

let cache = null;

export function buildSnapshot({ now = Date.now(), firms = PAYOUT_FIRMS, events, ownWallets } = {}) {
  const seeded = !events;
  if (seeded && cache && now - cache.at < 60_000) return cache.snap;
  const hour = hourFloor(now);
  const payouts = (events || seedEvents(now, firms)).filter(event => keepPayout(event, ownWallets));
  const snap = {
    v: 1,
    source: events ? 'events' : 'seed',
    hour: new Date(hour).toISOString(),
    updated: new Date(now).toISOString(),
    buckets: BUCKETS,
    firms: firms.map(firm => rollFirm(firm, payouts, now, hour)),
  };
  if (seeded) cache = { at: now, snap };
  return snap;
}
