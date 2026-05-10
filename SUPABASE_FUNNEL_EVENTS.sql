create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_key text unique,
  event_type text not null,
  source text not null check (source in ('frontend', 'backend')),
  session_id text,
  user_id text,
  user_email text,
  product_id text,
  product_name text,
  variant_id text,
  color text,
  size text,
  order_id text,
  payment_id text,
  amount numeric(12,2),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_event_type_idx
  on public.funnel_events (event_type);

create index if not exists funnel_events_created_at_idx
  on public.funnel_events (created_at desc);

create index if not exists funnel_events_product_id_idx
  on public.funnel_events (product_id);

create index if not exists funnel_events_order_id_idx
  on public.funnel_events (order_id);

create index if not exists funnel_events_payment_id_idx
  on public.funnel_events (payment_id);

alter table public.funnel_events disable row level security;
