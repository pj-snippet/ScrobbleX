alter table public.lastfm_auth_requests
  add column if not exists created_at timestamptz not null default now();

alter table public.scrobble_sync_state
  add column if not exists pending_page_oldest_at bigint,
  add column if not exists pending_page_newest_at bigint;

create index if not exists lastfm_auth_requests_user_expires_at_idx
  on public.lastfm_auth_requests (user_id, expires_at desc);

create index if not exists scrobbles_user_album_played_at_idx
  on public.scrobbles (user_id, album_id, played_at desc)
  where album_id is not null;

create index if not exists scrobbles_user_track_name_played_at_idx
  on public.scrobbles (user_id, track_name, played_at desc);

create index if not exists scrobbles_user_artist_name_played_at_idx
  on public.scrobbles (user_id, artist_name, played_at desc);

create index if not exists scrobbles_user_album_name_played_at_idx
  on public.scrobbles (user_id, album_name, played_at desc)
  where album_name is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.scrobbles'::regclass
      and conname = 'scrobbles_event_id_sha256'
  ) then
    alter table public.scrobbles
      add constraint scrobbles_event_id_sha256
      check (event_id ~ '^[0-9a-f]{64}$');
  end if;
end;
$$;

alter table public.lastfm_connections enable row level security;
alter table public.lastfm_auth_requests enable row level security;
alter table public.scrobbles enable row level security;
alter table public.scrobble_sync_state enable row level security;

revoke all on table public.lastfm_connections from anon, authenticated;
revoke all on table public.lastfm_auth_requests from anon, authenticated;
revoke all on table public.scrobbles from anon, authenticated;
revoke all on table public.scrobble_sync_state from anon, authenticated;

grant all on table public.lastfm_connections to service_role;
grant all on table public.lastfm_auth_requests to service_role;
grant all on table public.scrobbles to service_role;
grant all on table public.scrobble_sync_state to service_role;
grant select, insert, update, delete on table public.scrobbles to authenticated;

drop policy if exists "Users can manage their own Last.fm connection"
  on public.lastfm_connections;
create policy "Users can manage their own Last.fm connection"
on public.lastfm_connections
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage their own auth request state"
  on public.lastfm_auth_requests;
create policy "Users can manage their own auth request state"
on public.lastfm_auth_requests
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their own scrobbles"
  on public.scrobbles;
create policy "Users can read their own scrobbles"
on public.scrobbles
for select
using (user_id = auth.uid());

drop policy if exists "Users can manage their own scrobbles"
  on public.scrobbles;
create policy "Users can manage their own scrobbles"
on public.scrobbles
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own scrobbles"
  on public.scrobbles;
create policy "Users can update their own scrobbles"
on public.scrobbles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own scrobbles"
  on public.scrobbles;
create policy "Users can delete their own scrobbles"
on public.scrobbles
for delete
using (user_id = auth.uid());

drop policy if exists "Users can manage their own sync state"
  on public.scrobble_sync_state;
create policy "Users can manage their own sync state"
on public.scrobble_sync_state
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lastfm_connections_set_updated_at
  on public.lastfm_connections;
create trigger lastfm_connections_set_updated_at
before update on public.lastfm_connections
for each row execute function public.set_updated_at();

drop trigger if exists scrobble_sync_state_set_updated_at
  on public.scrobble_sync_state;
create trigger scrobble_sync_state_set_updated_at
before update on public.scrobble_sync_state
for each row execute function public.set_updated_at();
