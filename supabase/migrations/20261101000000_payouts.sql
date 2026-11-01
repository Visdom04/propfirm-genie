-- Payout tracker storage.
-- Run once in the Supabase SQL editor for project rtzkywwbsldinjgykqag.
-- Writes come only from the hourly GitHub job with the service role key.
-- The public reads the finished snapshot and nothing else.

-- One row per on-chain payout: a RiseUSD burn from a firm's Rise settlement
-- contract, or a USDC transfer out of a firm's payout wallet. The chain, tx
-- hash and log index identify a log uniquely, so re-scanning a block range
-- never counts a payout twice.
create table if not exists public.payout_events (
  chain text not null,
  tx_hash text not null,
  log_index int not null,
  firm_id text not null,
  source text not null,
  token text not null,
  recipient text not null,
  amount numeric(20, 6) not null check (amount > 0),
  block bigint not null,
  paid_at timestamptz not null,
  primary key (chain, tx_hash, log_index)
);

create index if not exists payout_events_firm_time on public.payout_events (firm_id, paid_at desc);

-- Last block scanned per tracked wallet, so each run resumes where the last stopped.
create table if not exists public.payout_cursors (
  chain text not null,
  address text not null,
  firm_id text not null,
  last_block bigint not null,
  updated_at timestamptz not null default now(),
  primary key (chain, address)
);

-- The rolled-up tracker the page renders. One row, id 'current'.
create table if not exists public.payout_snapshot (
  id text primary key default 'current',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.payout_events enable row level security;
alter table public.payout_cursors enable row level security;
alter table public.payout_snapshot enable row level security;

drop policy if exists "Payout snapshot is public" on public.payout_snapshot;
create policy "Payout snapshot is public" on public.payout_snapshot
  for select to anon, authenticated using (true);

-- payout_events and payout_cursors have no public policy: only the service role reads them.
