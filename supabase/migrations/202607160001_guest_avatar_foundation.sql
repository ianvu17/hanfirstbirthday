alter table public.participants
  add column if not exists avatar_type text,
  add column if not exists avatar_path text,
  add column if not exists avatar_preset_id text,
  add column if not exists avatar_updated_at timestamptz;

alter table public.participants
  drop constraint if exists participants_avatar_type_check,
  add constraint participants_avatar_type_check
    check (avatar_type is null or avatar_type in ('photo', 'preset'));

alter table public.participants
  drop constraint if exists participants_avatar_combination_check,
  add constraint participants_avatar_combination_check
    check (
      (
        avatar_type is null
        and avatar_path is null
        and avatar_preset_id is null
      )
      or (
        avatar_type = 'photo'
        and avatar_path is not null
        and avatar_preset_id is null
      )
      or (
        avatar_type = 'preset'
        and avatar_preset_id is not null
        and avatar_path is null
      )
    );

create index if not exists participants_avatar_updated_idx
  on public.participants (party_session_id, avatar_updated_at);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'party-avatars',
  'party-avatars',
  false,
  524288,
  array['image/webp', 'image/jpeg']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 524288,
  allowed_mime_types = array['image/webp', 'image/jpeg'];

drop policy if exists "No anonymous avatar object reads" on storage.objects;
create policy "No anonymous avatar object reads"
  on storage.objects
  for select
  to anon
  using (false);

drop policy if exists "No anonymous avatar object writes" on storage.objects;
create policy "No anonymous avatar object writes"
  on storage.objects
  for all
  to anon
  using (false)
  with check (false);
