-- Persistent live-stock snapshot. The server refreshes this in the background;
-- storefront requests never need to wait for the supplier API.
create table if not exists public.supplier_stock_cache (
  inventory_slug text primary key,
  product_slug text not null,
  upstream_product_id bigint,
  stock_label text not null,
  stock_count integer,
  cost_cents integer,
  synced_at timestamptz not null default now()
);

create index if not exists supplier_stock_cache_product_slug_idx
  on public.supplier_stock_cache (product_slug);

create table if not exists public.supplier_stock_sync_state (
  id text primary key,
  upstream_product_ids jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now()
);

alter table public.supplier_stock_cache enable row level security;
alter table public.supplier_stock_sync_state enable row level security;
