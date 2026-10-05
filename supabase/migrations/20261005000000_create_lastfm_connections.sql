create table public.lastfm_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  lastfm_username text not null,
  encrypted_session_key text not null,
  session_key_iv text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lastfm_connections_username_not_empty check (length(trim(lastfm_username)) > 0)
);

alter table public.lastfm_connections enable row level security;

revoke all on table public.lastfm_connections from anon, authenticated;
grant all on table public.lastfm_connections to service_role;

create policy "Users can manage their own Last.fm connection"
on public.lastfm_connections
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table public.lastfm_auth_requests (
  state_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lastfm_token text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index lastfm_auth_requests_expires_at_idx
  on public.lastfm_auth_requests (expires_at);

create index lastfm_auth_requests_user_expires_at_idx
  on public.lastfm_auth_requests (user_id, expires_at desc);

alter table public.lastfm_auth_requests enable row level security;
revoke all on table public.lastfm_auth_requests from anon, authenticated;
grant all on table public.lastfm_auth_requests to service_role;

create policy "Users can manage their own auth request state"
on public.lastfm_auth_requests
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

create trigger lastfm_connections_set_updated_at
before update on public.lastfm_connections
for each row execute function public.set_updated_at();
