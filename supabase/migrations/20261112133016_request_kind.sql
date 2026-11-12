-- Phase 1: screenshots can be read on the server (Gemini vision) for Sinhala/Tamil text.
-- Both kinds of call share one per-user hourly limit, so tag each row with what it was.

alter table public.analyze_requests
  add column kind text not null default 'analyze'
  constraint analyze_requests_kind_check check (kind in ('analyze', 'read_image'));
