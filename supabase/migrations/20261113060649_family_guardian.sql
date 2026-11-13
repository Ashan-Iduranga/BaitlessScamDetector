-- Phase 5: Family Guardian.
--
-- A protected person (for example a parent) creates an invite code and gives it to a guardian
-- (for example their son). Creating the code is the protected person's consent. When the
-- guardian enters it, the two accounts are linked. Either side can unlink at any time.
--
-- When the protected person's phone finds a likely scam, it adds a guardian_alert: the risk
-- level, scam type, where it came from (SMS or a manual check) and the scam link. Never the
-- message text. Guardians can read alerts only while they are linked, and only 30 days back.

create table public.family_invites (
  code text primary key,
  protected_id uuid not null references auth.users (id) on delete cascade,
  protected_name text not null check (char_length(btrim(protected_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create index family_invites_protected_idx on public.family_invites (protected_id);

create table public.family_links (
  id bigint generated always as identity primary key,
  guardian_id uuid not null references auth.users (id) on delete cascade,
  protected_id uuid not null references auth.users (id) on delete cascade,
  -- What the guardian calls the protected person ("Amma"), and what they see the guardian as.
  protected_name text not null check (char_length(btrim(protected_name)) between 1 and 40),
  guardian_name text not null check (char_length(btrim(guardian_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (guardian_id, protected_id),
  check (guardian_id <> protected_id)
);

create index family_links_protected_idx on public.family_links (protected_id);

create table public.guardian_alerts (
  id bigint generated always as identity primary key,
  protected_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  level text not null check (level in ('caution', 'danger')),
  category text not null check (
    category in ('bank', 'lottery_prize', 'courier', 'job', 'investment', 'telecom',
                 'government', 'romance', 'shopping', 'other', 'none')
  ),
  source text not null check (source in ('sms', 'check')),
  link text check (link is null or (char_length(link) between 3 and 300 and link !~ '\s')),
  created_at timestamptz not null default now()
);

create index guardian_alerts_protected_time_idx
  on public.guardian_alerts (protected_id, created_at desc);

alter table public.family_invites enable row level security;
alter table public.family_links enable row level security;
alter table public.guardian_alerts enable row level security;

-- family_invites: no policies. Only the two functions below touch it.

create policy "see own family links" on public.family_links
  for select to authenticated
  using ((select auth.uid()) in (guardian_id, protected_id));

create policy "either side can unlink" on public.family_links
  for delete to authenticated
  using ((select auth.uid()) in (guardian_id, protected_id));

create policy "send alerts to own guardians" on public.guardian_alerts
  for insert to authenticated
  with check (
    protected_id = (select auth.uid())
    and exists (select 1 from public.family_links l where l.protected_id = (select auth.uid()))
  );

create policy "read own or guarded alerts" on public.guardian_alerts
  for select to authenticated
  using (
    created_at > now() - interval '30 days'
    and (
      protected_id = (select auth.uid())
      or exists (
        select 1 from public.family_links l
        where l.guardian_id = (select auth.uid()) and l.protected_id = guardian_alerts.protected_id
      )
    )
  );

-- Server time, a rate limit, and 30-day retention for alerts.
create function public.guardian_alerts_before_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := now();
  if (select count(*) from public.guardian_alerts a
      where a.protected_id = new.protected_id
        and a.created_at > now() - interval '1 hour') >= 20 then
    raise exception 'guardian_alert_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger guardian_alerts_before_insert
  before insert on public.guardian_alerts
  for each row execute function public.guardian_alerts_before_insert();

create function public.guardian_alerts_prune()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.guardian_alerts
   where protected_id = new.protected_id and created_at < now() - interval '30 days';
  return null;
end;
$$;

create trigger guardian_alerts_prune
  after insert on public.guardian_alerts
  for each row execute function public.guardian_alerts_prune();

revoke execute on function public.guardian_alerts_prune() from public, anon, authenticated;

-- Creates an 8-character invite code (no 0/O/1/I), valid for 24 hours.
create function public.create_family_invite(p_protected_name text)
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
    v_bytes := uuid_send(gen_random_uuid());
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

-- The guardian enters the code. Returns the name the protected person chose.
create function public.accept_family_invite(p_code text, p_guardian_name text)
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

  select * into v_invite
    from public.family_invites i
   where i.code = upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'))
     and i.expires_at > now();
  if not found then
    raise exception 'invite_not_found' using errcode = 'P0001';
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

revoke execute on function public.create_family_invite(text) from public, anon;
revoke execute on function public.accept_family_invite(text, text) from public, anon;
grant execute on function public.create_family_invite(text) to authenticated;
grant execute on function public.accept_family_invite(text, text) to authenticated;

-- Guardians who have the app open get new alerts straight away (Realtime respects RLS).
alter publication supabase_realtime add table public.guardian_alerts;
