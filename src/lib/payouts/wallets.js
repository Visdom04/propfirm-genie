// On-chain payout sources. Public addresses, one row per wallet we read.
// 'burn': Rise settlement contract. A trader payout is RiseUSD burned to the zero address.
// 'out': firm payout wallet. A trader payout is USDC sent out of it.
// Check each address on its block explorer before adding a firm here.

const RISE_USD = '0xace876e867ecf2c3d1b8097b160a666adce04cd0';
// Rise's token before 2026-06-21. Old accounts paid traders directly in it.
const RISE_PAY = '0x1b34bcc581d535d33c895fabce3c85f1bf3bdb33';
const ZERO = '0x0000000000000000000000000000000000000000';

// Transfers below this are test sends and dust, not trader payouts.
export const MIN_PAYOUT = 10;
// Largest single transfer from a shared wallet still counted as a trader payout.
export const MAX_SHARED_PAYOUT = 250000;

export const USDC = {
  ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  arbitrum: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
};

export const CHAINS = {
  ethereum: { alchemy: 'eth-mainnet', explorer: 'https://etherscan.io' },
  arbitrum: { alchemy: 'arb-mainnet', explorer: 'https://arbiscan.io' },
  base: { alchemy: 'base-mainnet', explorer: 'https://basescan.org' },
};

const rise = (firmId, address) => ({ firmId, chain: 'arbitrum', address, mode: 'burn', token: RISE_USD, label: 'Rise settlement (RiseUSD)' });
// Pre-June-2026 Rise account. Each transfer to a trader wallet is a payout; the
// zero-address sweeps are dropped in payoutCounts. It stops 2026-06-21, where the
// settlement contract above starts, so the two never overlap.
const legacy = (firmId, address) => ({ firmId, chain: 'arbitrum', address, mode: 'out', token: RISE_PAY, label: 'Rise account (RISEPAY)', legacy: true });
// Shared USDC wallets also move treasury money, so they get a start date
// (before it the wallet was not a trader payout wallet) and a size cap.
// Rise burns are payout-only and need neither.
const usdc = (firmId, chain, address, since) => ({ firmId, chain, address, mode: 'out', token: USDC[chain], label: 'Payout wallet (USDC)', since, maxPayout: MAX_SHARED_PAYOUT });

export const PAYOUT_WALLETS = [
  rise('tradeify', '0x6f7a634a9d5f47a9da491a095f1c8375dc9495c1'),
  rise('mffu', '0x228d19d3f95727625018272bb534ff3b17d2e212'),
  rise('fundednext', '0x3a19638e995791676f8b4c5bc4e6f7a74d87f10e'),
  rise('blue-guardian', '0x2a289ea079ad8b798186ca0cef17747f1ccc5844'),
  rise('mfp', '0x748184d5661eaeb7432e9c7612ebece1f8f93d3a'),
  legacy('tradeify', '0x9549875baf75b9921a0e507b6684565440504795'),
  legacy('mffu', '0x9f28bac1f793790dd3b0c2f8945f7ca28874f7a6'),
  legacy('fundednext', '0x2b9a16e8448091159cc2b2a205b11f2368d53cb6'),
  legacy('blue-guardian', '0x68035843020b6c0cd94dd29c273fff13c8e9a914'),
  rise('tradeday', '0x7f452224633654653f37e5e5ce2f0f01d3623c91'),
  // unverified, 1.5-3x PropFirmLoop's all-time: legacy('tradeday', '0x4b1cdd9fb0785ff8fbed22e8de3b795fe16bd632'),
  rise('phidias', '0xd615b4fa6c05295f95f191c0da83aa296c98ff1a'),
  // unverified, 1.5-3x PropFirmLoop's all-time: legacy('phidias', '0xdd3f6f0b13d804dd28198c6a3127b3db27f0bec8'),
  rise('blusky', '0x736cb34fdf4515f13493b4553b7aa7bb2e79ec9b'),
  // unverified, 1.5-3x PropFirmLoop's all-time: legacy('blusky', '0xea397e5f9fc1230d1593973180f4bfc88ef0966c'),
  rise('legends', '0x44bf51ab580ba1ef55d7847b338af6a33c2b8895'),
  legacy('legends', '0xf9a625400908c871b21b65585052a43e144d8c52'),
  rise('tradeify-247', '0x2727d30cfc79e55361df3f5b684fcfe6bd5d4130'),
  legacy('tradeify-247', '0x4b72f02fcde43886529f0aae501726941fa6c374'),
  rise('e8', '0x11879c38d7889f98d07957a46ad4f2e398835915'),
  // unverified, 1.5-3x PropFirmLoop's all-time: legacy('e8', '0xd19e945eeea57475b791c20112ebb4b628f5b95c'),
  rise('top-one-futures', '0x498578d100d13826836e078d5b6a7094cc54eb32'),
  // unverified, 1.5-3x PropFirmLoop's all-time: legacy('top-one-futures', '0xf016d90ec62fa7f4bec9af221c5039da6ce93a5c'),
  usdc('vest', 'base', '0x55133c825603e6a5b9e911abab23e75dc3bb07af', '2026-07-01'),
  usdc('vest', 'arbitrum', '0xb2f86eae1197032fa85389cc6c0f3b06b58dd1ea', '2026-07-01'),
  usdc('vest', 'ethereum', '0xe80f92077131b9890599e418ae323de71ce1c35a', '2026-07-01'),
];

export function payoutCounts(wallet, row) {
  if (wallet.mode === 'out' && row.recipient === ZERO) return false;
  const at = Date.parse(row.paid_at);
  if (wallet.since && at < Date.parse(wallet.since)) return false;
  if (wallet.maxPayout && Number(row.amount) > wallet.maxPayout) return false;
  return Number(row.amount) >= MIN_PAYOUT;
}

export const ZERO_ADDRESS = ZERO;

export function ownWalletSet(wallets = PAYOUT_WALLETS) {
  return new Set(wallets.map(wallet => wallet.address.toLowerCase()));
}

export function explorerAddress(chain, address) {
  const base = CHAINS[chain]?.explorer;
  return base ? `${base}/address/${address}` : null;
}
