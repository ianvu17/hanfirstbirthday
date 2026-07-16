-- Keep the just-finished session readable as the current party result until the
-- host archives it or creates a replacement with archiveExisting enabled.

alter table public.party_sessions
  drop constraint if exists party_sessions_current_not_finished_check;

alter table public.party_sessions
  add constraint party_sessions_current_status_check
  check (is_current = false or status in ('draft', 'active', 'finished')) not valid;

alter table public.party_sessions
  validate constraint party_sessions_current_status_check;
