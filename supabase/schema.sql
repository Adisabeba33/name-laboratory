-- Word Laboratory / Sianelara — database schema (Supabase / Postgres)
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste → Run. It creates the private lexicon table (Stage 2) and locks it down
-- with row-level security so each account can only ever see its OWN words.
--
-- The shared PUBLIC dictionary (Stage 3) will be added here later.

-- ── Private lexicon ────────────────────────────────────────────────────────
create table if not exists public.lexicon_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  -- our lexId(word, brief): stable per (word, concept), so re-saving updates.
  entry_key           text not null,
  word                text not null,
  transliteration     text default '',
  pronunciation_guide text default '',
  part_of_speech      text default 'noun',
  meaning             text default '',
  short_meaning       text default '',
  usage               jsonb default '{"en":[],"ru":[]}'::jsonb,
  language            text default '',
  adoption_band       text default '',
  adoption_score      integer default 0,
  brief               text default '',
  created_at          timestamptz not null default now(),
  unique (user_id, entry_key)
);

create index if not exists lexicon_entries_user_idx
  on public.lexicon_entries (user_id, created_at desc);

-- ── Row-level security: a user sees and edits ONLY their own rows ───────────
alter table public.lexicon_entries enable row level security;

drop policy if exists "own lexicon: select" on public.lexicon_entries;
create policy "own lexicon: select" on public.lexicon_entries
  for select using (auth.uid() = user_id);

drop policy if exists "own lexicon: insert" on public.lexicon_entries;
create policy "own lexicon: insert" on public.lexicon_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "own lexicon: update" on public.lexicon_entries;
create policy "own lexicon: update" on public.lexicon_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own lexicon: delete" on public.lexicon_entries;
create policy "own lexicon: delete" on public.lexicon_entries
  for delete using (auth.uid() = user_id);
