-- Security hardening after the Phase 2-5 review (docs/privacy.md explains the rules).
--
-- 1. Trusted domains (real banks, telcos, government) can never become "confirmed scams", and only
--    accounts older than 24 hours count towards confirming anything. Anonymous accounts are free,
--    so without this one person could make 3 accounts and flag a real bank.
-- 2. Reported links may not contain phone numbers or query strings: wa.me/<number> links are sent
--    as hashed phone numbers instead, and Scam Radar never shows a number.
-- 3. AI requests are counted before Gemini is called (one at a time per user), with an overall
--    hourly cap, so parallel calls or many accounts cannot use up the free quota.
-- 4. Family Guardian: wrong invite codes are limited to 10 per hour, codes use unbiased random
--    bytes, and guardians only see alerts sent after they were linked.

-- 1. Trusted domains -------------------------------------------------------------------------

create table public.trusted_domains (
  domain text primary key check (domain ~ '^[a-z0-9.-]+\.[a-z]+$')
);

alter table public.trusted_domains enable row level security;

-- Official domains of Sri Lankan banks, telcos and services that scammers imitate. Keep in sync
-- with BRANDS in packages/detector/src/url.ts. Any *.gov.lk and *.ac.lk domain is trusted too.
insert into public.trusted_domains (domain) values
  ('boc.lk'), ('peoplesbank.lk'), ('sampath.lk'), ('sampathbank.com'), ('combank.lk'),
  ('combank.net'), ('hnb.lk'), ('hnb.net'), ('hnbfinance.lk'), ('nsb.lk'), ('seylan.lk'),
  ('ndbbank.com'), ('dfcc.lk'), ('dialog.lk'), ('mobitel.lk'), ('slt.lk'), ('slt.com.lk'),
  ('hutch.lk'), ('airtel.lk'), ('daraz.lk'), ('pickme.lk');

create function public.is_trusted_domain(p_domain text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_domain = 'gov.lk' or p_domain like '%.gov.lk'
      or p_domain = 'ac.lk' or p_domain like '%.ac.lk'
      or exists (
        select 1 from public.trusted_domains t
        where p_domain = t.domain or p_domain like '%.' || t.domain
      );
$$;

revoke execute on function public.is_trusted_domain(text) from public, anon, authenticated;

create or replace function public.reports_count_indicators()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  added integer;
begin
  -- New accounts can report (the report is kept) but do not count towards confirming anything.
  if (select u.created_at from auth.users u where u.id = new.user_id) > now() - interval '24 hours' then
    return null;
  end if;

  for item in
    select 'domain' as kind, unnest(new.domains) as value
    union all select 'url', unnest(new.urls)
    union all select 'phone', unnest(new.phone_hashes)
  loop
    if item.kind = 'domain' and public.is_trusted_domain(item.value) then
      continue;
    end if;
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

-- Trusted domains are never looked up as scams either (in case one was confirmed before this).
create or replace function public.lookup_indicators(
  p_domains text[],
  p_urls text[],
  p_phone_hashes text[]
)
returns table (kind text, value text, report_count integer)
language sql
stable
set search_path = ''
as $$
  select i.kind, i.value, i.report_count
  from public.indicators i
  where i.confirmed
    and (
      (i.kind = 'domain' and i.value = any (p_domains) and not public.is_trusted_domain(i.value))
      or (i.kind = 'url' and i.value = any (p_urls))
      or (i.kind = 'phone' and i.value = any (p_phone_hashes))
    );
$$;

delete from public.indicators where kind = 'domain' and public.is_trusted_domain(value);

-- 2. No phone numbers or query strings in reported links -------------------------------------

create or replace function public.reports_validate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v text;
begin
  new.created_at := now();

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
    -- 9+ digits in a row is a phone number (wa.me/94771234567): those must be sent hashed.
    if char_length(v) not between 3 and 300 or v ~ '\s' or v ~ '[?#]' or v ~ '\d{9,}' then
      raise exception 'bad_url' using errcode = '22023';
    end if;
  end loop;
  return new;
end;
$$;

delete from public.indicators where kind = 'url' and (value ~ '\d{9,}' or value ~ '[?#]');


-- Scam Radar never shows trusted domains or phone-number links.
create or replace function public.radar_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with recent as (
    select category, created_at
    from public.reports
    where created_at > now() - interval '30 days'
  ),
  days as (
    select generate_series(
      (now() at time zone 'Asia/Colombo')::date - 13,
      (now() at time zone 'Asia/Colombo')::date,
      interval '1 day'
    )::date as day
  ),
  confirmed as (
    select
      i.kind,
      i.value,
      i.report_count,
      i.first_seen,
      i.last_seen,
      -- When the third person reported it, i.e. when it became a confirmed scam.
      (select ir.created_at
         from public.indicator_reporters ir
        where ir.kind = i.kind and ir.value = i.value
        order by ir.created_at
        offset 2 limit 1) as confirmed_at
    from public.indicators i
    where i.confirmed and i.kind in ('domain', 'url')
      -- Never show a trusted domain or anything that looks like a phone number.
      and not (i.kind = 'domain' and public.is_trusted_domain(i.value))
      and i.value !~ '\d{9,}'
  ),
  trending as (
    select
      c.kind,
      c.value,
      c.report_count as "reportCount",
      c.first_seen as "firstSeen",
      c.last_seen as "lastSeen",
      c.confirmed_at as "confirmedAt",
      (select r.category
         from public.reports r
        where (c.kind = 'domain' and c.value = any (r.domains))
           or (c.kind = 'url' and c.value = any (r.urls))
        group by r.category
        order by count(*) desc, r.category
        limit 1) as category
    from confirmed c
    where c.last_seen > now() - interval '30 days'
    order by c.last_seen desc
    limit 10
  )
  select jsonb_build_object(
    'generatedAt', now(),
    'thisWeek', (select count(*) from recent where created_at > now() - interval '7 days'),
    'lastWeek', (select count(*) from recent
                  where created_at <= now() - interval '7 days'
                    and created_at > now() - interval '14 days'),
    'confirmedTotal', (select count(*) from confirmed),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
                'day', d.day,
                'count', (select count(*) from recent r
                           where (r.created_at at time zone 'Asia/Colombo')::date = d.day)
              ) order by d.day), '[]'::jsonb)
              from days d),
    'categories', (select coalesce(jsonb_agg(jsonb_build_object('category', c.category, 'count', c.n)
                     order by c.n desc, c.category), '[]'::jsonb)
                   from (select category, count(*) as n from recent group by category) c),
    'trending', (select coalesce(jsonb_agg(to_jsonb(t) order by t."lastSeen" desc), '[]'::jsonb)
                 from trending t)
  );
$$;

-- 3. Reserve AI requests before calling Gemini ----------------------------------------------

create index analyze_requests_time_idx on public.analyze_requests (created_at desc);

-- Returns the new row id and 'ok', or a null id and 'user_limit' / 'global_limit'.
-- The advisory lock makes one user's parallel calls wait for each other, so they cannot all pass
-- the check before any row is written.
create function public.reserve_ai_request(p_user uuid, p_kind text)
returns table (request_id bigint, outcome text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  if (select count(*) from public.analyze_requests r
      where r.user_id = p_user and r.created_at > now() - interval '1 hour') >= 30 then
    return query select null::bigint, 'user_limit'::text;
    return;
  end if;
  -- Protects the shared free Gemini quota from many accounts at once.
  if (select count(*) from public.analyze_requests r
      where r.created_at > now() - interval '1 hour') >= 600 then
    return query select null::bigint, 'global_limit'::text;
    return;
  end if;
  insert into public.analyze_requests (user_id, kind) values (p_user, p_kind)
    returning id into v_id;
  return query select v_id, 'ok'::text;
end;
$$;

revoke execute on function public.reserve_ai_request(uuid, text) from public, anon, authenticated;

-- 4. Family Guardian ------------------------------------------------------------------------

create table public.family_invite_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index family_invite_attempts_user_time_idx
  on public.family_invite_attempts (user_id, created_at desc);

alter table public.family_invite_attempts enable row level security;

-- Unbiased codes: pgcrypto random bytes (a UUID's version nibble skewed the 7th character).
create or replace function public.create_family_invite(p_protected_name text)
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_code text;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_protected_name, ''))) not between 1 and 40 then
    raise exception 'bad_name' using errcode = '22023';
  end if;
  if (select count(*) from public.family_links l where l.protected_id = v_uid) >= 5 then
    raise exception 'too_many_guardians' using errcode = 'P0001';
  end if;

  delete from public.family_invites i where i.expires_at < now();
  if (select count(*) from public.family_invites i where i.protected_id = v_uid) >= 3 then
    raise exception 'too_many_invites' using errcode = 'P0001';
  end if;

  loop
    -- 32 letters, so byte % 32 is unbiased.
    v_bytes := extensions.gen_random_bytes(8);
    v_code := '';
    for i in 0..7 loop
      v_code := v_code || substr(v_alphabet, get_byte(v_bytes, i) % 32 + 1, 1);
    end loop;
    exit when not exists (select 1 from public.family_invites i where i.code = v_code);
  end loop;

  insert into public.family_invites (code, protected_id, protected_name)
  values (v_code, v_uid, btrim(p_protected_name));

  return query
    select i.code, i.expires_at from public.family_invites i where i.code = v_code;
end;
$$;

-- Returns the protected person's name, or null for a wrong or expired code. Wrong codes are
-- recorded (returning null instead of raising keeps that row) and limited to 10 per hour.
create or replace function public.accept_family_invite(p_code text, p_guardian_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.family_invites;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_guardian_name, ''))) not between 1 and 40 then
    raise exception 'bad_name' using errcode = '22023';
  end if;
  if (select count(*) from public.family_invite_attempts a
      where a.user_id = v_uid and a.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too_many_attempts' using errcode = 'P0001';
  end if;

  select * into v_invite
    from public.family_invites i
   where i.code = upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'))
     and i.expires_at > now();
  if not found then
    insert into public.family_invite_attempts (user_id) values (v_uid);
    return null;
  end if;
  if v_invite.protected_id = v_uid then
    raise exception 'invite_own' using errcode = 'P0001';
  end if;
  if (select count(*) from public.family_links l where l.guardian_id = v_uid) >= 10 then
    raise exception 'too_many_protected' using errcode = 'P0001';
  end if;

  insert into public.family_links (guardian_id, protected_id, protected_name, guardian_name)
  values (v_uid, v_invite.protected_id, v_invite.protected_name, btrim(p_guardian_name))
  on conflict (guardian_id, protected_id)
  do update set protected_name = excluded.protected_name, guardian_name = excluded.guardian_name;

  delete from public.family_invites i where i.code = v_invite.code;
  return v_invite.protected_name;
end;
$$;

-- Guardians only see alerts sent after they were linked.
drop policy "read own or guarded alerts" on public.guardian_alerts;
create policy "read own or guarded alerts" on public.guardian_alerts
  for select to authenticated
  using (
    created_at > now() - interval '30 days'
    and (
      protected_id = (select auth.uid())
      or exists (
        select 1 from public.family_links l
        where l.guardian_id = (select auth.uid())
          and l.protected_id = guardian_alerts.protected_id
          and guardian_alerts.created_at >= l.created_at
      )
    )
  );
