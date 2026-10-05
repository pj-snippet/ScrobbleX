create table public.scrobbles (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id text not null,
  track_id text not null,
  artist_id text not null,
  album_id text,
  track_name text not null,
  artist_name text not null,
  album_name text,
  track_mbid text,
  artist_mbid text,
  album_mbid text,
  played_at bigint not null,
  duration_sec integer,
  loved boolean,
  artwork_url text,
  source text not null default 'lastfm',
  created_at timestamptz not null default now(),
  primary key (user_id, event_id),
  constraint scrobbles_event_id_sha256 check (event_id ~ '^[0-9a-f]{64}$'),
  constraint scrobbles_played_at_nonnegative check (played_at >= 0),
  constraint scrobbles_duration_nonnegative check (duration_sec is null or duration_sec >= 0)
);

create index scrobbles_user_played_at_idx
  on public.scrobbles (user_id, played_at desc, event_id);

create index scrobbles_user_artist_played_at_idx
  on public.scrobbles (user_id, artist_mbid, played_at desc)
  where artist_mbid is not null;

create index scrobbles_user_album_played_at_idx
  on public.scrobbles (user_id, album_id, played_at desc)
  where album_id is not null;

create index scrobbles_user_track_played_at_idx
  on public.scrobbles (user_id, track_mbid, played_at desc)
  where track_mbid is not null;

create index scrobbles_user_track_name_played_at_idx
  on public.scrobbles (user_id, track_name, played_at desc);

create index scrobbles_user_artist_name_played_at_idx
  on public.scrobbles (user_id, artist_name, played_at desc);

create index scrobbles_user_album_name_played_at_idx
  on public.scrobbles (user_id, album_name, played_at desc)
  where album_name is not null;

create index scrobbles_user_track_id_played_at_idx
  on public.scrobbles (user_id, track_id, played_at desc);

create index scrobbles_user_artist_id_played_at_idx
  on public.scrobbles (user_id, artist_id, played_at desc);

create table public.scrobble_sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'idle'
    check (status in ('idle', 'running', 'complete', 'failed')),
  mode text
    check (mode is null or mode in ('initial', 'incremental')),
  current_page integer not null default 0 check (current_page >= 0),
  total_pages integer not null default 0 check (total_pages >= 0),
  total_available integer not null default 0 check (total_available >= 0),
  oldest_imported_at bigint,
  newest_imported_at bigint,
  pending_page_oldest_at bigint,
  pending_page_newest_at bigint,
  last_sync_at timestamptz,
  imported_count bigint not null default 0 check (imported_count >= 0),
  duplicate_count bigint not null default 0 check (duplicate_count >= 0),
  range_from bigint,
  range_to bigint,
  last_error text,
  updated_at timestamptz not null default now()
);

create index scrobble_sync_state_status_idx
  on public.scrobble_sync_state (status, updated_at);

alter table public.scrobbles enable row level security;
alter table public.scrobble_sync_state enable row level security;

revoke all on table public.scrobbles from anon, authenticated;
revoke all on table public.scrobble_sync_state from anon, authenticated;
grant all on table public.scrobbles to service_role;
grant all on table public.scrobble_sync_state to service_role;
grant select, insert, update, delete on table public.scrobbles to authenticated;

create policy "Users can read their own scrobbles"
on public.scrobbles
for select
using (user_id = auth.uid());

create policy "Users can manage their own scrobbles"
on public.scrobbles
for insert
with check (user_id = auth.uid());

create policy "Users can update their own scrobbles"
on public.scrobbles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own scrobbles"
on public.scrobbles
for delete
using (user_id = auth.uid());

create policy "Users can manage their own sync state"
on public.scrobble_sync_state
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger scrobble_sync_state_set_updated_at
before update on public.scrobble_sync_state
for each row execute function public.set_updated_at();
