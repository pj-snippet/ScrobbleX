create table public.track_metadata (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id text not null,
  track_mbid text,
  artist_name text not null,
  track_name text not null,
  duration_sec integer,
  checked_at timestamptz not null default now(),
  primary key (user_id, track_id),
  constraint track_metadata_duration_positive
    check (duration_sec is null or duration_sec > 0)
);

alter table public.track_metadata enable row level security;
revoke all on table public.track_metadata from anon, authenticated;
grant all on table public.track_metadata to service_role;

create policy "Users can read their own track metadata"
on public.track_metadata
for select
using (user_id = auth.uid());

insert into public.track_metadata (
  user_id,
  track_id,
  track_mbid,
  artist_name,
  track_name,
  duration_sec
)
select
  user_id,
  track_id,
  min(track_mbid),
  min(artist_name),
  min(track_name),
  min(duration_sec)
from public.scrobbles
where duration_sec > 0
group by user_id, track_id
having count(distinct duration_sec) = 1
on conflict (user_id, track_id) do nothing;

alter table public.scrobbles drop column duration_sec;
