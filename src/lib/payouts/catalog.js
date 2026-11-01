export const PAYOUT_FIRMS = [
  { id: 'tradeify', name: 'Tradeify', short: 'Tradeify', catalog: 'Tradeify', rail: 'Rise', sort: 1 },
  { id: 'mffu', name: 'My Funded Futures', short: 'MFFU', catalog: 'My Funded Futures', rail: 'Rise', sort: 2 },
  { id: 'vest', name: 'Vest Markets', short: 'Vest', catalog: 'Vest Markets', rail: 'USDC', sort: 3 },
  { id: 'fundednext', name: 'FundedNext Futures', short: 'FundedNext', catalog: 'FundedNext Futures', rail: 'Rise', sort: 4 },
  { id: 'blue-guardian', name: 'Blue Guardian', short: 'Blue Guardian', catalog: 'Blue Guardian', rail: 'Rise', sort: 5 },
  { id: 'mfp', name: 'My Funded Perps', short: 'MFP', catalog: 'My Funded Perps', rail: 'Rise', sort: 6 },
  { id: 'e8', name: 'E8 Futures', short: 'E8', catalog: 'E8 Futures', rail: 'Rise', sort: 7 },
  { id: 'top-one-futures', name: 'Top One Futures', short: 'Top One', catalog: 'Top One Futures', rail: 'Rise', sort: 8 },
  { id: 'legends', name: 'Legends Trading', short: 'Legends', catalog: 'Legends Trading', rail: 'Rise', sort: 9 },
  { id: 'phidias', name: 'Phidias Propfirm', short: 'Phidias', catalog: 'Phidias Propfirm', rail: 'Rise', sort: 10 },
  { id: 'blusky', name: 'BluSky', short: 'BluSky', catalog: 'BluSky', rail: 'Rise', sort: 11 },
  { id: 'tradeday', name: 'TradeDay', short: 'TradeDay', catalog: 'TradeDay', rail: 'Rise', sort: 12 },
  { id: 'tradeify-247', name: 'Tradeify 247', short: 'Tradeify 247', catalog: 'Tradeify 247', rail: 'Rise', sort: 13 },
];

export const RAIL_LABEL = {
  Rise: 'Rise · Arbitrum',
  USDC: 'USDC · Base / Arbitrum / Ethereum',
};

export function payoutFirm(id) {
  return PAYOUT_FIRMS.find(firm => firm.id === id) || null;
}

export function railChip(rail) {
  return /^rise/i.test(rail || '') ? 'Rise' : 'USDC';
}
