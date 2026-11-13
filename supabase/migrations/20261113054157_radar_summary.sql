-- Phase 4: Scam Radar. A read-only, aggregate view of community reports for every app user.
--
-- Only totals and confirmed scam links are returned: never who reported, never phone hashes,
-- never unconfirmed links (one person must not be able to put a real business on the radar).
-- Days are counted in Sri Lanka time.

create index reports_created_idx on public.reports (created_at desc);

create function public.radar_summary()
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

revoke execute on function public.radar_summary() from public, anon;
grant execute on function public.radar_summary() to authenticated;
