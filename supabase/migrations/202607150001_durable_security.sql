create table if not exists public.pavoa_rate_limits (
  scope text not null,
  identifier_hash text not null,
  attempt_count integer not null default 0,
  window_expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (scope, identifier_hash)
);

create index if not exists pavoa_rate_limits_expires_idx
  on public.pavoa_rate_limits (window_expires_at);

alter table public.pavoa_rate_limits enable row level security;
revoke all on public.pavoa_rate_limits from anon, authenticated;
grant all on public.pavoa_rate_limits to service_role;

create or replace function public.pavoa_consume_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_record public.pavoa_rate_limits%rowtype;
  retry_seconds integer;
begin
  insert into public.pavoa_rate_limits (
    scope, identifier_hash, attempt_count, window_expires_at, updated_at
  ) values (
    p_scope,
    p_identifier_hash,
    1,
    now() + make_interval(secs => greatest(1, p_window_seconds)),
    now()
  )
  on conflict (scope, identifier_hash) do update set
    attempt_count = case
      when public.pavoa_rate_limits.window_expires_at <= now() then 1
      else public.pavoa_rate_limits.attempt_count + 1
    end,
    window_expires_at = case
      when public.pavoa_rate_limits.window_expires_at <= now()
        then now() + make_interval(secs => greatest(1, p_window_seconds))
      else public.pavoa_rate_limits.window_expires_at
    end,
    updated_at = now()
  returning * into current_record;

  retry_seconds := greatest(
    0,
    ceil(extract(epoch from (current_record.window_expires_at - now())))::integer
  );

  -- Limpieza ocasional para evitar que identificadores vencidos crezcan sin limite.
  if random() < 0.02 then
    delete from public.pavoa_rate_limits
    where window_expires_at < now() - interval '1 day';
  end if;

  return jsonb_build_object(
    'allowed', current_record.attempt_count <= greatest(1, p_limit),
    'remaining', greatest(0, greatest(1, p_limit) - current_record.attempt_count),
    'retry_after', retry_seconds
  );
end;
$$;

revoke all on function public.pavoa_consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.pavoa_consume_rate_limit(text, text, integer, integer) to service_role;

create table if not exists public.pavoa_idempotency (
  scope text not null,
  key_hash text not null,
  state text not null check (state in ('processing', 'completed', 'failed')),
  claim_token text not null,
  response jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

create index if not exists pavoa_idempotency_expires_idx
  on public.pavoa_idempotency (expires_at);

alter table public.pavoa_idempotency enable row level security;
revoke all on public.pavoa_idempotency from anon, authenticated;
grant all on public.pavoa_idempotency to service_role;

create or replace function public.pavoa_claim_idempotency(
  p_scope text,
  p_key_hash text,
  p_claim_token text,
  p_ttl_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_record public.pavoa_idempotency%rowtype;
begin
  insert into public.pavoa_idempotency (
    scope, key_hash, state, claim_token, response, expires_at
  ) values (
    p_scope,
    p_key_hash,
    'processing',
    p_claim_token,
    null,
    now() + make_interval(secs => greatest(10, p_ttl_seconds))
  )
  on conflict (scope, key_hash) do update set
    state = 'processing',
    claim_token = excluded.claim_token,
    response = null,
    expires_at = excluded.expires_at,
    updated_at = now()
  where public.pavoa_idempotency.expires_at <= now()
     or public.pavoa_idempotency.state = 'failed'
  returning * into current_record;

  if current_record.scope is null then
    select * into current_record
    from public.pavoa_idempotency
    where scope = p_scope and key_hash = p_key_hash;
  end if;

  -- Las respuestas se conservan durante su TTL y luego se depuran gradualmente.
  if random() < 0.02 then
    delete from public.pavoa_idempotency
    where expires_at < now() - interval '1 day';
  end if;

  return jsonb_build_object(
    'claimed', current_record.claim_token = p_claim_token,
    'state', current_record.state,
    'response', current_record.response,
    'expires_at', current_record.expires_at
  );
end;
$$;

create or replace function public.pavoa_complete_idempotency(
  p_scope text,
  p_key_hash text,
  p_claim_token text,
  p_response jsonb,
  p_ttl_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pavoa_idempotency
  set state = 'completed',
      response = coalesce(p_response, '{}'::jsonb),
      expires_at = now() + make_interval(secs => greatest(10, p_ttl_seconds)),
      updated_at = now()
  where scope = p_scope
    and key_hash = p_key_hash
    and claim_token = p_claim_token
    and state = 'processing';
  return found;
end;
$$;

create or replace function public.pavoa_fail_idempotency(
  p_scope text,
  p_key_hash text,
  p_claim_token text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pavoa_idempotency
  set state = 'failed', updated_at = now()
  where scope = p_scope
    and key_hash = p_key_hash
    and claim_token = p_claim_token
    and state = 'processing';
  return found;
end;
$$;

revoke all on function public.pavoa_claim_idempotency(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.pavoa_complete_idempotency(text, text, text, jsonb, integer) from public, anon, authenticated;
revoke all on function public.pavoa_fail_idempotency(text, text, text) from public, anon, authenticated;
grant execute on function public.pavoa_claim_idempotency(text, text, text, integer) to service_role;
grant execute on function public.pavoa_complete_idempotency(text, text, text, jsonb, integer) to service_role;
grant execute on function public.pavoa_fail_idempotency(text, text, text) to service_role;
