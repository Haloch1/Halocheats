-- Drop-off funnel + Discord churn analytics. Run this once in the Supabase
-- SQL editor. Matches the project's existing pattern of standalone .sql
-- files run manually (see supabase-giveaways-schema.sql).
--
-- Reuses the existing page_views table (already populated by the site-wide
-- visitor heartbeat in scripts/site.js) and the existing orders table —
-- no new client-side tracking needed for the funnel side. Only Discord
-- churn needed a new table since departures weren't persisted anywhere
-- before (only logged to a Discord channel).

create index if not exists idx_page_views_visitor_label on page_views (visitor_label);

create table if not exists member_departures (
  id bigserial primary key,
  discord_id text not null,
  username text,
  tag text,
  joined_at timestamptz,
  left_at timestamptz not null default now(),
  membership_days integer,
  roles text[],
  was_verified boolean default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_member_departures_left_at on member_departures (left_at desc);
create index if not exists idx_member_departures_discord_id on member_departures (discord_id);

create or replace function get_funnel_summary(days_back int default 30, idle_hours int default 2)
returns table (
  total_visitors bigint,
  viewed_product bigint,
  reached_checkout_result bigint,
  converted bigint,
  cancelled_at_checkout bigint,
  abandoned_after_product_view bigint,
  bounced_no_product_view bigint,
  still_active bigint
) language sql stable as $$
  with window_views as (
    select visitor_label, page_path, viewed_at
    from page_views
    where viewed_at >= now() - (days_back || ' days')::interval
  ),
  visitor_flags as (
    select
      visitor_label,
      bool_or(page_path like '/products/%') as viewed_product,
      bool_or(page_path like '/checkout/success%') as converted,
      bool_or(page_path like '/checkout/cancel%') as cancelled,
      max(viewed_at) as last_seen
    from window_views
    group by visitor_label
  )
  select
    count(*) as total_visitors,
    count(*) filter (where viewed_product) as viewed_product,
    count(*) filter (where converted or cancelled) as reached_checkout_result,
    count(*) filter (where converted) as converted,
    count(*) filter (where cancelled and not converted) as cancelled_at_checkout,
    count(*) filter (
      where viewed_product and not converted and not cancelled
        and last_seen < now() - (idle_hours || ' hours')::interval
    ) as abandoned_after_product_view,
    count(*) filter (
      where not viewed_product and not converted and not cancelled
        and last_seen < now() - (idle_hours || ' hours')::interval
    ) as bounced_no_product_view,
    count(*) filter (
      where not converted and not cancelled
        and last_seen >= now() - (idle_hours || ' hours')::interval
    ) as still_active
  from visitor_flags;
$$;

create or replace function get_funnel_exit_pages(days_back int default 30, idle_hours int default 2, limit_n int default 15)
returns table (page_path text, exits bigint) language sql stable as $$
  with window_views as (
    select visitor_label, page_path, viewed_at
    from page_views
    where viewed_at >= now() - (days_back || ' days')::interval
  ),
  visitor_flags as (
    select
      visitor_label,
      bool_or(page_path like '/checkout/success%') as converted,
      bool_or(page_path like '/checkout/cancel%') as cancelled,
      max(viewed_at) as last_seen
    from window_views
    group by visitor_label
  ),
  abandoned as (
    select visitor_label
    from visitor_flags
    where not converted and not cancelled
      and last_seen < now() - (idle_hours || ' hours')::interval
  ),
  last_page as (
    select distinct on (wv.visitor_label) wv.visitor_label, wv.page_path
    from window_views wv
    join abandoned a on a.visitor_label = wv.visitor_label
    order by wv.visitor_label, wv.viewed_at desc
  )
  select page_path, count(*) as exits
  from last_page
  group by page_path
  order by exits desc, page_path asc
  limit limit_n;
$$;

create or replace function get_checkout_abandonment(days_back int default 30, stale_hours int default 2)
returns table (
  product_slug text,
  abandoned_count bigint,
  abandoned_value_cents bigint,
  completed_count bigint,
  completed_value_cents bigint,
  canceled_count bigint
) language sql stable as $$
  with recent_orders as (
    select *
    from orders
    where created_at >= now() - (days_back || ' days')::interval
  )
  select
    coalesce(product_slug, 'unknown') as product_slug,
    count(*) filter (where status = 'pending' and created_at < now() - (stale_hours || ' hours')::interval) as abandoned_count,
    coalesce(sum(amount_cents) filter (where status = 'pending' and created_at < now() - (stale_hours || ' hours')::interval), 0) as abandoned_value_cents,
    count(*) filter (where status in ('paid', 'fulfilled')) as completed_count,
    coalesce(sum(amount_cents) filter (where status in ('paid', 'fulfilled')), 0) as completed_value_cents,
    count(*) filter (where status = 'canceled') as canceled_count
  from recent_orders
  group by product_slug
  order by abandoned_count desc, abandoned_value_cents desc;
$$;

create or replace function get_churn_summary(days_back int default 90)
returns table (
  total_departures bigint,
  avg_membership_days numeric,
  median_membership_days numeric,
  left_within_7_days bigint,
  left_within_30_days bigint,
  was_verified_count bigint
) language sql stable as $$
  with recent as (
    select * from member_departures
    where left_at >= now() - (days_back || ' days')::interval
  )
  select
    count(*) as total_departures,
    round(avg(membership_days)::numeric, 1) as avg_membership_days,
    round((percentile_cont(0.5) within group (order by membership_days))::numeric, 1) as median_membership_days,
    count(*) filter (where membership_days <= 7) as left_within_7_days,
    count(*) filter (where membership_days <= 30) as left_within_30_days,
    count(*) filter (where was_verified) as was_verified_count
  from recent;
$$;

create or replace function get_churn_trend(days_back int default 90)
returns table (week_start date, departures bigint) language sql stable as $$
  select date_trunc('week', left_at)::date as week_start, count(*) as departures
  from member_departures
  where left_at >= now() - (days_back || ' days')::interval
  group by 1
  order by 1;
$$;
