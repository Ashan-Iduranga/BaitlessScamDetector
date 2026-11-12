-- Phase 1: one row per call to the `analyze` Edge Function.
-- Used for per-user rate limiting and basic usage stats. Message text is never stored here.

create table public.analyze_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  url_count smallint not null default 0,
  used_ai boolean not null default false,
  used_safe_browsing boolean not null default false,
  latency_ms integer
);

create index analyze_requests_user_time_idx
  on public.analyze_requests (user_id, created_at desc);

-- Only the Edge Function (service role) reads and writes this table. RLS on with no policies
-- means the app's anon/authenticated keys cannot touch it.
alter table public.analyze_requests enable row level security;

-- Counts a user's calls in the last hour. Called by the Edge Function before doing any work.
create function public.analyze_requests_last_hour(p_user uuid)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
  from public.analyze_requests
  where user_id = p_user
    and created_at > now() - interval '1 hour';
$$;

revoke execute on function public.analyze_requests_last_hour(uuid) from public, anon, authenticated;
