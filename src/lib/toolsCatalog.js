export const TOOLS = [
  {
    slug: 'position-size',
    title: 'Position size',
    short: 'Size',
    job: 'Units from risk, stop, size cap, and remaining room.',
  },
  {
    slug: 'blowout',
    title: 'Account blowout',
    short: 'Blowout',
    job: 'How many losses until the drawdown, severity, and wins to recover.',
  },
  {
    slug: 'consistency',
    title: 'Consistency rule',
    short: 'Consistency',
    job: 'Best day vs eval and funded caps — dollars still needed to get paid.',
  },
  {
    slug: 'challenge-cost',
    title: 'Payout & challenge cost',
    short: 'Payout',
    job: 'Take-home after the split, and payouts to recoup the fee.',
  },
  {
    slug: 'growth',
    title: 'Growth',
    short: 'Growth',
    job: 'Simple vs compound path at your risk, win rate, and R:R across 252 sessions.',
  },
  {
    slug: 'dca',
    title: 'DCA / scale-in',
    short: 'DCA',
    job: 'Ladder, average price, $/pt, dollars at risk, and recovery back to breakeven.',
  },
  {
    slug: 'cheat-sheet',
    title: 'Sizing cheat sheet',
    short: 'Cheat sheet',
    job: 'Sweet spot by room on a 20-point stop — perp units only.',
  },
  {
    slug: 'roi',
    title: 'Challenge ROI',
    short: 'ROI',
    job: 'Pass rate, blowout, and median take-home across 400 simulated paths.',
  },
];

export function toolBySlug(slug) {
  return TOOLS.find(t => t.slug === slug) || null;
}

export const TOOL_SLUGS = TOOLS.map(t => t.slug);
