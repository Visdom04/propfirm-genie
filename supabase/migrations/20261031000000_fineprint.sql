-- Market intelligence (Fine Print) storage.
-- Run once in the Supabase SQL editor for project rtzkywwbsldinjgykqag.
-- Writes come only from the server: the daily GitHub job and the admin API,
-- both with the service role key. The public can read published rows only.

create table if not exists public.fineprint_changes (
  id text primary key,
  page_id text,
  origin text not null default 'watcher' check (origin in ('watcher', 'manual')),
  status text not null default 'published' check (status in ('published', 'hidden')),
  firm text not null,
  market text,
  kind text,
  product text,
  plan text,
  title text,
  summary text,
  source_url text,
  facts jsonb not null default '[]'::jsonb,
  hunks jsonb not null default '[]'::jsonb,
  trending boolean not null default false,
  detected_at timestamptz not null default now(),
  published_at timestamptz,
  hidden_at timestamptz,
  hidden_by text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists fineprint_changes_feed on public.fineprint_changes (status, detected_at desc);

-- One row per watched page: what the last daily check saw.
create table if not exists public.fineprint_watch (
  page_id text primary key,
  firm text not null,
  url text,
  state text not null,
  http_status int,
  source text,
  cards int not null default 0,
  checked_at timestamptz not null,
  last_ok_at timestamptz,
  fail_streak int not null default 0
);

-- Which firms appear on the public board.
create table if not exists public.fineprint_coverage (
  firm text primary key,
  market text not null default 'futures',
  shown boolean not null default true,
  logo text,
  updated_at timestamptz not null default now()
);

alter table public.fineprint_changes enable row level security;
alter table public.fineprint_watch enable row level security;
alter table public.fineprint_coverage enable row level security;

drop policy if exists "Published changes are public" on public.fineprint_changes;
create policy "Published changes are public" on public.fineprint_changes
  for select to anon, authenticated using (status = 'published');

drop policy if exists "Coverage is public" on public.fineprint_coverage;
create policy "Coverage is public" on public.fineprint_coverage
  for select to anon, authenticated using (true);

-- fineprint_watch has no public policy: only the service role reads it.
