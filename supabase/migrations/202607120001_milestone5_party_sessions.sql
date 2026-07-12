create extension if not exists pgcrypto;

create table if not exists public.party_sessions (
  id uuid primary key default gen_random_uuid(),
  public_join_code text not null unique,
  status text not null default 'active',
  phase text not null default 'lobby',
  current_question_index integer,
  current_question_id text,
  question_opened_at timestamptz,
  question_deadline_at timestamptz,
  question_locked_at timestamptz,
  answer_revealed_at timestamptz,
  display_locale text not null default 'en',
  is_test boolean not null default false,
  revision integer not null default 0,
  last_command_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint party_sessions_status_check check (status in ('draft', 'active', 'finished', 'archived')),
  constraint party_sessions_phase_check check (
    phase in (
      'lobby',
      'question_ready',
      'question_active',
      'question_locked',
      'answer_reveal',
      'leaderboard',
      'waiting_for_host',
      'finished'
    )
  ),
  constraint party_sessions_locale_check check (display_locale in ('en', 'vi')),
  constraint party_sessions_question_index_check check (current_question_index is null or current_question_index >= 0),
  constraint party_sessions_revision_check check (revision >= 0)
);

create unique index if not exists party_sessions_one_active_production_idx
  on public.party_sessions ((status = 'active'))
  where status = 'active' and is_test = false;

create index if not exists party_sessions_active_lookup_idx
  on public.party_sessions (is_test, status, updated_at desc);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  party_session_id uuid not null references public.party_sessions(id) on delete cascade,
  display_name text not null,
  locale text not null default 'en',
  resume_token_hash text not null unique,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_test boolean not null default false,
  constraint participants_display_name_length_check check (char_length(display_name) between 1 and 40),
  constraint participants_locale_check check (locale in ('en', 'vi'))
);

create index if not exists participants_party_session_joined_idx
  on public.participants (party_session_id, joined_at);

create index if not exists participants_party_session_test_idx
  on public.participants (party_session_id, is_test);

create table if not exists public.question_responses (
  id uuid primary key default gen_random_uuid(),
  party_session_id uuid not null references public.party_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  question_id text not null,
  selected_option_id text,
  status text not null,
  submitted_at timestamptz not null default now(),
  locked_at timestamptz not null default now(),
  response_duration_ms integer,
  is_correct boolean not null default false,
  submission_id text not null,
  is_test boolean not null default false,
  constraint question_responses_status_check check (status in ('locked_answer', 'locked_timeout')),
  constraint question_responses_timeout_option_check check (
    (status = 'locked_timeout' and selected_option_id is null)
    or (status = 'locked_answer' and selected_option_id is not null)
  ),
  constraint question_responses_duration_check check (response_duration_ms is null or response_duration_ms >= 0),
  constraint question_responses_one_per_question_unique unique (party_session_id, participant_id, question_id)
);

create unique index if not exists question_responses_submission_unique_idx
  on public.question_responses (party_session_id, participant_id, submission_id);

create index if not exists question_responses_question_idx
  on public.question_responses (party_session_id, question_id, status);

create index if not exists question_responses_leaderboard_idx
  on public.question_responses (party_session_id, participant_id, is_correct);

create table if not exists public.host_command_log (
  id uuid primary key default gen_random_uuid(),
  party_session_id uuid not null references public.party_sessions(id) on delete cascade,
  command_id text not null,
  command_type text not null,
  expected_revision integer not null,
  accepted_revision integer,
  status text not null,
  error_code text,
  created_at timestamptz not null default now(),
  is_test boolean not null default false,
  constraint host_command_log_status_check check (status in ('accepted', 'duplicate', 'rejected'))
);

create unique index if not exists host_command_log_command_unique_idx
  on public.host_command_log (party_session_id, command_id);

create or replace function public.touch_party_session_response(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_revision integer;
begin
  update public.party_sessions
  set
    revision = revision + 1,
    updated_at = now()
  where id = p_session_id
  returning revision into next_revision;

  return next_revision;
end;
$$;

revoke all on function public.touch_party_session_response(uuid) from public;
revoke all on function public.touch_party_session_response(uuid) from anon;

alter table public.party_sessions enable row level security;
alter table public.participants enable row level security;
alter table public.question_responses enable row level security;
alter table public.host_command_log enable row level security;

drop policy if exists "Public can read active party session shell" on public.party_sessions;
create policy "Public can read active party session shell"
  on public.party_sessions
  for select
  to anon
  using (status in ('active', 'finished') and is_test = false);

drop policy if exists "Public can read production participant names" on public.participants;
create policy "Public can read production participant names"
  on public.participants
  for select
  to anon
  using (is_test = false);

drop policy if exists "No anonymous response reads" on public.question_responses;
create policy "No anonymous response reads"
  on public.question_responses
  for select
  to anon
  using (false);

drop policy if exists "No anonymous host command log reads" on public.host_command_log;
create policy "No anonymous host command log reads"
  on public.host_command_log
  for select
  to anon
  using (false);

drop policy if exists "No anonymous party session writes" on public.party_sessions;
create policy "No anonymous party session writes"
  on public.party_sessions
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "No anonymous participant writes" on public.participants;
create policy "No anonymous participant writes"
  on public.participants
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "No anonymous response writes" on public.question_responses;
create policy "No anonymous response writes"
  on public.question_responses
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "No anonymous host command writes" on public.host_command_log;
create policy "No anonymous host command writes"
  on public.host_command_log
  for all
  to anon
  using (false)
  with check (false);
