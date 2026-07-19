alter table public.participants
  add column if not exists is_ready boolean not null default false,
  add column if not exists ready_at timestamptz;

alter table public.participants
  drop constraint if exists participants_ready_at_check,
  add constraint participants_ready_at_check check (
    (is_ready = true and ready_at is not null)
    or (is_ready = false and ready_at is null)
  );

create index if not exists participants_party_session_readiness_idx
  on public.participants (party_session_id, is_ready, joined_at);
