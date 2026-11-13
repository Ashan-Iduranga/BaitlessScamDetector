-- Reports always get the server's time. Clients could otherwise backdate reports to get around
-- the 10-per-hour limit and to skew Scam Radar's daily counts.

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
    if char_length(v) not between 3 and 300 or v ~ '\s' then
      raise exception 'bad_url' using errcode = '22023';
    end if;
  end loop;
  return new;
end;
$$;
