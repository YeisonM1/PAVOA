create table if not exists public.funnel_journeys (
  id uuid primary key default gen_random_uuid(),
  journey_key text not null unique,
  session_id text,
  user_id text,
  user_email text,
  actor_type text not null default 'guest' check (actor_type in ('guest', 'auth')),
  primary_product_id text,
  primary_product_name text,
  primary_variant_id text,
  primary_variant_label text,
  is_multi_product boolean not null default false,
  product_count integer not null default 0,
  status text not null default 'interest_only' check (
    status in (
      'interest_only',
      'browsing',
      'in_cart',
      'in_checkout',
      'payment_pending',
      'payment_rejected',
      'purchase_completed',
      'checkout_error'
    )
  ),
  started_at timestamptz,
  viewed_at timestamptz,
  first_variant_at timestamptz,
  add_to_cart_at timestamptz,
  begin_checkout_at timestamptz,
  payment_click_at timestamptz,
  payment_result_at timestamptz,
  completed_at timestamptz,
  last_event_at timestamptz,
  order_id text,
  payment_id text,
  amount numeric(12,2),
  line_items jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  event_types jsonb not null default '{}'::jsonb,
  event_count integer not null default 0,
  error_count integer not null default 0,
  time_to_variant_seconds integer,
  time_to_cart_seconds integer,
  time_in_cart_seconds integer,
  time_in_checkout_seconds integer,
  time_to_purchase_seconds integer,
  total_duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funnel_journeys_status_idx
  on public.funnel_journeys (status);

create index if not exists funnel_journeys_last_event_at_idx
  on public.funnel_journeys (last_event_at desc);

create index if not exists funnel_journeys_primary_product_id_idx
  on public.funnel_journeys (primary_product_id);

create index if not exists funnel_journeys_order_id_idx
  on public.funnel_journeys (order_id);

create index if not exists funnel_journeys_payment_id_idx
  on public.funnel_journeys (payment_id);

create index if not exists funnel_journeys_session_id_idx
  on public.funnel_journeys (session_id);

alter table public.funnel_journeys disable row level security;
