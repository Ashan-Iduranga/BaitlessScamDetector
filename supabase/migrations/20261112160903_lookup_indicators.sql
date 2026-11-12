-- Phase 2: returns the confirmed community indicators among the given values.
-- Called only by the analyze Edge Function (service role).

create function public.lookup_indicators(
  p_domains text[],
  p_urls text[],
  p_phone_hashes text[]
)
returns table (kind text, value text, report_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.kind, i.value, i.report_count
  from public.indicators i
  where i.confirmed
    and (
      (i.kind = 'domain' and i.value = any (p_domains))
      or (i.kind = 'url' and i.value = any (p_urls))
      or (i.kind = 'phone' and i.value = any (p_phone_hashes))
    );
$$;

revoke execute on function public.lookup_indicators(text[], text[], text[])
  from public, anon, authenticated;
