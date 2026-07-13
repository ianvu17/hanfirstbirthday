-- Milestone 5 security hardening for hosted validation.
--
-- This migration is intentionally additive so it can run safely after the
-- original Milestone 5 migration if that file has already reached a hosted
-- Supabase project.

alter table public.party_sessions
  drop constraint if exists party_sessions_public_join_code_key;

create unique index if not exists party_sessions_join_code_mode_unique_idx
  on public.party_sessions (public_join_code, is_test);

drop policy if exists "Public can read active party session shell" on public.party_sessions;
drop policy if exists "Public can read production participant names" on public.participants;

create policy "Public can read active party session wakeups"
  on public.party_sessions
  for select
  to anon
  using (status in ('active', 'finished'));

create policy "Public can read active participant wakeups"
  on public.participants
  for select
  to anon
  using (
    exists (
      select 1
      from public.party_sessions
      where party_sessions.id = participants.party_session_id
        and party_sessions.status in ('active', 'finished')
    )
  );

revoke all on table public.party_sessions from anon;
revoke all on table public.participants from anon;
revoke all on table public.question_responses from anon;
revoke all on table public.host_command_log from anon;

grant select (
  id,
  public_join_code,
  status,
  phase,
  current_question_index,
  current_question_id,
  question_opened_at,
  question_deadline_at,
  question_locked_at,
  answer_revealed_at,
  display_locale,
  is_test,
  revision,
  updated_at
) on public.party_sessions to anon;

grant select (
  id,
  party_session_id,
  display_name,
  locale,
  joined_at,
  is_test
) on public.participants to anon;

grant execute on function public.touch_party_session_response(uuid) to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'party_sessions'
    ) then
      alter publication supabase_realtime add table public.party_sessions;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'participants'
    ) then
      alter publication supabase_realtime add table public.participants;
    end if;
  end if;
end
$$;
