-- Run once in the Supabase SQL editor.
-- Keeps the supplier order ID attached to the customer order so retries
-- retrieve the existing key instead of placing a duplicate purchase.
create table if not exists public.supplier_order_links (
  order_id uuid primary key references public.orders(id) on delete cascade,
  supplier_order_id text not null,
  supplier_order_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_order_links_supplier_order_id_idx
  on public.supplier_order_links (supplier_order_id);

alter table public.supplier_order_links enable row level security;
