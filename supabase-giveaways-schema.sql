-- Giveaways schema. Run this once in the Supabase SQL editor.
-- Matches the project's existing pattern of standalone .sql files run manually
-- (see supabase-media-network-schema.sql, supabase-admin-security.sql).

create table if not exists giveaways (
  id bigserial primary key,
  guild_id text,
  channel_id text not null,
  message_id text,
  host_discord_id text not null,
  host_username text,
  prize text not null,
  winners_count int not null default 1,
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'ended', 'cancelled')),
  winner_ids text[],
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists giveaways_status_idx on giveaways (status);
create index if not exists giveaways_ends_at_idx on giveaways (ends_at);

-- One row per unique entrant per giveaway. The unique index is the source of
-- truth for "already entered" — the button handler pre-checks for a friendlier
-- message but relies on this constraint to be certain.
create table if not exists giveaway_entries (
  id bigserial primary key,
  giveaway_id bigint not null references giveaways(id) on delete cascade,
  discord_id text not null,
  username text,
  entered_at timestamptz not null default now()
);
create unique index if not exists giveaway_entries_unique on giveaway_entries (giveaway_id, discord_id);
create index if not exists giveaway_entries_giveaway_idx on giveaway_entries (giveaway_id);
