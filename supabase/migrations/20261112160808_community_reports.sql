-- Phase 2: community reports of scam links and phone numbers.
--
-- reports              one row per "Report this scam" tap. Users can insert and read only their own.
-- indicator_reporters  who reported which indicator, so each person counts once.
-- indicators           domains / links / phone hashes with a count of distinct reporters.
--                      Confirmed (and used to raise risk scores) after 3 different people report it.
--
-- Phone numbers are stored only as SHA-256 hex of the E.164 number, hashed on the phone.
-- No message text is stored.

create table public.reports (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (
    category in ('bank', 'lottery_prize', 'courier', 'job', 'investment', 'telecom',
                 'government', 'romance', 'shopping', 'other')
  ),
  domains text[] not null default '{}',
  urls text[] not null default '{}',
  phone_hashes text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint reports_sizes check (
    cardinality(domains) <= 10 and cardinality(urls) <= 10 and cardinality(phone_hashes) <= 10
  ),
  constraint reports_not_empty check (
    cardinality(domains) + cardinality(urls) + cardinality(phone_hashes) > 0
  )
);

create index reports_user_time_idx on public.reports (user_id, created_at desc);

create table public.indicators (
  kind text not null check (kind in ('domain', 'url', 'phone')),
  value text not null check (char_length(value) between 3 and 300),
  report_count integer not null default 0,
  confirmed boolean generated always as (report_count >= 3) stored,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (kind, value)
);

create table public.indicator_reporters (
  kind text not null,
  value text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (kind, value, user_id),
  foreign key (kind, value) references public.indicators (kind, value) on delete cascade
);

create index indicator_reporters_user_idx on public.indicator_reporters (user_id);

-- RLS: reports are the user's own; indicators are server-only (read through the analyze function).
alter table public.reports enable row level security;
alter table public.indicators enable row level security;
alter table public.indicator_reporters enable row level security;

create policy "insert own reports" on public.reports
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "read own reports" on public.reports
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Validates a report and limits how often one user can report.
create function public.reports_validate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v text;
begin
  if (select count(*) from public.reports r
      where r.user_id = new.user_id and r.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'report_rate_limited' using errcode = 'P0001';
  end if;
  foreach v in array new.phone_hashes loop
    if v !~ '^[0-9a-f]{64}$' then
      raise exception 'bad_phone_hash' using errcode = '22023';
    end if;
  end loop;
  foreach v in array new.domains loop
    if v !~ '^[a-z0-9.-]{3,253}$' or v !~ '\.' then
      raise exception 'bad_domain' using errcode = '22023';
    end if;
  end loop;
  foreach v in array new.urls loop
    if char_length(v) not between 3 and 300 or v ~ '\s' then
      raise exception 'bad_url' using errcode = '22023';
    end if;
  end loop;
  return new;
end;
$$;

create trigger reports_validate
  before insert on public.reports
  for each row execute function public.reports_validate();

-- Counts each reporter once per indicator. Runs as the table owner, because users cannot write
-- to indicators directly.
create function public.reports_count_indicators()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  added integer;
begin
  for item in
    select 'domain' as kind, unnest(new.domains) as value
    union all select 'url', unnest(new.urls)
    union all select 'phone', unnest(new.phone_hashes)
  loop
    insert into public.indicators (kind, value) values (item.kind, item.value)
      on conflict (kind, value) do nothing;
    insert into public.indicator_reporters (kind, value, user_id)
      values (item.kind, item.value, new.user_id)
      on conflict do nothing;
    get diagnostics added = row_count;
    if added > 0 then
      update public.indicators
        set report_count = report_count + 1, last_seen = now()
        where kind = item.kind and value = item.value;
    end if;
  end loop;
  return null;
end;
$$;

revoke execute on function public.reports_count_indicators() from public, anon, authenticated;

create trigger reports_count_indicators
  after insert on public.reports
  for each row execute function public.reports_count_indicators();
