-- Giveaway keys schema. Run this once in the Supabase SQL editor.
-- Matches the project's existing pattern of standalone .sql files run manually
-- (see supabase-giveaways-schema.sql, supabase-media-network-schema.sql).

create table if not exists giveaway_keys (
  id bigserial primary key,
  key_value text not null unique,
  label text,
  status text not null default 'unused' check (status in ('unused', 'used')),
  added_by text,
  used_by_discord_id text,
  used_by_username text,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists giveaway_keys_status_idx on giveaway_keys (status);
