-- Authoritative time-based scoring and immutable per-session question count.

alter table public.party_sessions
  add column if not exists question_count integer not null default 10;

alter table public.party_sessions
  add constraint party_sessions_question_count_check
  check (question_count between 1 and 10) not valid;

alter table public.party_sessions
  validate constraint party_sessions_question_count_check;

alter table public.question_responses
  add column if not exists points_awarded integer not null default 0,
  add column if not exists scoring_version text not null default 'time-v1';

-- Preserve historical interpretation: pre-migration correct-count rows remain
-- worth exactly one point and are never recomputed with the time-v1 algorithm.
update public.question_responses
set
  points_awarded = case when is_correct then 1 else 0 end,
  scoring_version = 'correct-count-v1';

alter table public.question_responses
  add constraint question_responses_points_awarded_check
  check (points_awarded between 0 and 2000) not valid;

alter table public.question_responses
  add constraint question_responses_scoring_version_check
  check (scoring_version in ('correct-count-v1', 'time-v1')) not valid;

alter table public.question_responses
  validate constraint question_responses_points_awarded_check;

alter table public.question_responses
  validate constraint question_responses_scoring_version_check;

drop function if exists public.create_party_session(text, text, text, boolean, text, text, boolean);

create or replace function public.create_party_session(
  p_party_key text,
  p_deployment_environment text,
  p_public_join_code text,
  p_is_test boolean,
  p_idempotency_key text,
  p_question_count integer,
  p_session_label text default null,
  p_archive_existing boolean default false
)
returns public.party_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_session public.party_sessions;
  new_session public.party_sessions;
begin
  if p_party_key is null or p_party_key !~ '^[a-z0-9][a-z0-9-]{1,80}$' then
    raise exception 'invalid_party_key' using errcode = '22023';
  end if;

  if p_deployment_environment not in ('development', 'preview', 'production') then
    raise exception 'invalid_deployment_environment' using errcode = '22023';
  end if;

  if nullif(trim(p_public_join_code), '') is null then
    raise exception 'invalid_public_join_code' using errcode = '22023';
  end if;

  if nullif(trim(p_idempotency_key), '') is null or char_length(p_idempotency_key) > 160 then
    raise exception 'invalid_idempotency_key' using errcode = '22023';
  end if;

  if p_question_count is null or p_question_count < 1 or p_question_count > 10 then
    raise exception 'invalid_question_count' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_party_key || ':' || p_deployment_environment));

  select *
  into existing_session
  from public.party_sessions
  where party_key = p_party_key
    and deployment_environment = p_deployment_environment
    and create_idempotency_key = p_idempotency_key
  limit 1;

  if found then
    if existing_session.question_count <> p_question_count then
      raise exception 'idempotency_conflict' using errcode = '22023';
    end if;
    return existing_session;
  end if;

  select *
  into existing_session
  from public.party_sessions
  where party_key = p_party_key
    and deployment_environment = p_deployment_environment
    and is_current = true
  limit 1;

  if found and not p_archive_existing then
    raise exception 'active_session_exists' using errcode = '23505';
  end if;

  if found and p_archive_existing then
    update public.party_sessions
    set
      is_current = false,
      status = 'archived',
      archived_at = now(),
      updated_at = now()
    where id = existing_session.id;
  end if;

  insert into public.party_sessions (
    public_join_code,
    party_key,
    deployment_environment,
    status,
    phase,
    display_locale,
    is_test,
    is_current,
    session_label,
    create_idempotency_key,
    question_count,
    revision
  )
  values (
    trim(p_public_join_code),
    p_party_key,
    p_deployment_environment,
    'active',
    'lobby',
    'en',
    p_is_test,
    true,
    nullif(trim(p_session_label), ''),
    p_idempotency_key,
    p_question_count,
    0
  )
  returning * into new_session;

  return new_session;
end;
$$;

revoke all on function public.create_party_session(text, text, text, boolean, text, integer, text, boolean) from public;
revoke all on function public.create_party_session(text, text, text, boolean, text, integer, text, boolean) from anon;
grant execute on function public.create_party_session(text, text, text, boolean, text, integer, text, boolean) to service_role;

grant select (question_count) on public.party_sessions to anon;

create or replace function public.prevent_party_session_question_count_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.question_count is distinct from new.question_count then
    raise exception 'question_count_is_immutable' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists party_sessions_question_count_immutable on public.party_sessions;
create trigger party_sessions_question_count_immutable
before update of question_count on public.party_sessions
for each row execute function public.prevent_party_session_question_count_change();
