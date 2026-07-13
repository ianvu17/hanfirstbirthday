-- Party session current-pointer architecture.
--
-- This migration is additive relative to the Milestone 5 schema. It keeps
-- historical rows, removes join-code-as-identity uniqueness, and makes the
-- current game run explicit per party/deployment context.

alter table public.party_sessions
  add column if not exists party_key text not null default 'han-first-birthday',
  add column if not exists deployment_environment text not null default 'production',
  add column if not exists is_current boolean not null default false,
  add column if not exists session_label text,
  add column if not exists create_idempotency_key text,
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.party_sessions
  add constraint party_sessions_party_key_check
  check (party_key ~ '^[a-z0-9][a-z0-9-]{1,80}$') not valid;

alter table public.party_sessions
  add constraint party_sessions_deployment_environment_check
  check (deployment_environment in ('development', 'preview', 'production')) not valid;

alter table public.party_sessions
  add constraint party_sessions_current_not_finished_check
  check (is_current = false or status in ('draft', 'active')) not valid;

alter table public.party_sessions
  add constraint party_sessions_archived_timestamp_check
  check ((status = 'archived') = (archived_at is not null)) not valid;

update public.party_sessions
set
  party_key = coalesce(nullif(party_key, ''), 'han-first-birthday'),
  deployment_environment = coalesce(nullif(deployment_environment, ''), 'production'),
  is_current = case
    when status in ('draft', 'active') and phase <> 'finished' then true
    else false
  end,
  finished_at = case
    when (status = 'finished' or phase = 'finished') and finished_at is null then updated_at
    else finished_at
  end
where party_key is distinct from coalesce(nullif(party_key, ''), 'han-first-birthday')
   or deployment_environment is distinct from coalesce(nullif(deployment_environment, ''), 'production')
   or is_current is distinct from case
      when status in ('draft', 'active') and phase <> 'finished' then true
      else false
    end
   or ((status = 'finished' or phase = 'finished') and finished_at is null);

drop index if exists party_sessions_join_code_mode_unique_idx;
drop index if exists party_sessions_one_active_production_idx;

create unique index if not exists party_sessions_one_current_context_idx
  on public.party_sessions (party_key, deployment_environment)
  where is_current;

create unique index if not exists party_sessions_create_idempotency_unique_idx
  on public.party_sessions (party_key, deployment_environment, create_idempotency_key)
  where create_idempotency_key is not null;

create index if not exists party_sessions_current_lookup_idx
  on public.party_sessions (party_key, deployment_environment, is_current, updated_at desc);

create index if not exists party_sessions_history_idx
  on public.party_sessions (party_key, deployment_environment, created_at desc);

create or replace function public.create_party_session(
  p_party_key text,
  p_deployment_environment text,
  p_public_join_code text,
  p_is_test boolean,
  p_idempotency_key text,
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

  perform pg_advisory_xact_lock(hashtext(p_party_key || ':' || p_deployment_environment));

  select *
  into existing_session
  from public.party_sessions
  where party_key = p_party_key
    and deployment_environment = p_deployment_environment
    and create_idempotency_key = p_idempotency_key
  limit 1;

  if found then
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
    0
  )
  returning * into new_session;

  return new_session;
end;
$$;

create or replace function public.archive_party_session(
  p_session_id uuid,
  p_party_key text,
  p_deployment_environment text
)
returns public.party_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  archived_session public.party_sessions;
begin
  perform pg_advisory_xact_lock(hashtext(p_party_key || ':' || p_deployment_environment));

  update public.party_sessions
  set
    is_current = false,
    status = 'archived',
    archived_at = coalesce(archived_at, now()),
    updated_at = now()
  where id = p_session_id
    and party_key = p_party_key
    and deployment_environment = p_deployment_environment
  returning * into archived_session;

  if not found then
    raise exception 'session_not_found' using errcode = '02000';
  end if;

  return archived_session;
end;
$$;

revoke all on function public.create_party_session(text, text, text, boolean, text, text, boolean) from public;
revoke all on function public.create_party_session(text, text, text, boolean, text, text, boolean) from anon;
grant execute on function public.create_party_session(text, text, text, boolean, text, text, boolean) to service_role;

revoke all on function public.archive_party_session(uuid, text, text) from public;
revoke all on function public.archive_party_session(uuid, text, text) from anon;
grant execute on function public.archive_party_session(uuid, text, text) to service_role;

grant select (
  id,
  public_join_code,
  party_key,
  deployment_environment,
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
  is_current,
  revision,
  updated_at
) on public.party_sessions to anon;
