import { PAYOUT_FIRMS } from './catalog.js';
import { DAY } from './rollup.js';

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const PROFILE = {
  tradeify: { daily: 18, mean: 1600, spread: 2200, since: 120 },
  mffu: { daily: 12, mean: 1100, spread: 1400, since: 120 },
  vest: { daily: 16, mean: 980, spread: 1600, since: 90 },
  fundednext: { daily: 9, mean: 1500, spread: 1800, since: 120 },
  'blue-guardian': { daily: 3, mean: 1700, spread: 900, since: 90 },
  mfp: { daily: 7, mean: 340, spread: 280, since: 50 },
};

function amount(rand, mean, spread) {
  const u = Math.max(0.04, rand());
  const raw = mean * (0.18 + u * 1.4) + (rand() - 0.5) * spread;
  if (rand() < 0.012) return Math.round(raw * (8 + rand() * 18) * 100) / 100;
  return Math.max(25, Math.round(raw * 100) / 100);
}

export function seedEvents(now = Date.now(), firms = PAYOUT_FIRMS) {
  const events = [];
  for (const firm of firms) {
    const profile = PROFILE[firm.id] || PROFILE.mfp;
    const rand = mulberry32(firm.sort * 9973 + 20261030);
    const days = profile.since;
    for (let d = days; d >= 0; d -= 1) {
      const count = Math.max(0, Math.round(profile.daily * (0.55 + rand() * 0.9)));
      for (let i = 0; i < count; i += 1) {
        const at = now - d * DAY + Math.floor(rand() * DAY);
        if (at > now) continue;
        events.push({ firmId: firm.id, amount: amount(rand, profile.mean, profile.spread), at, kind: 'payout' });
      }
    }
  }
  return events.sort((a, b) => a.at - b.at);
}
