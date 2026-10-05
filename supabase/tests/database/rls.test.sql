begin;

select plan(8);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_anonymous
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'scrobblex-rls-a@example.invalid',
    '',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'scrobblex-rls-b@example.invalid',
    '',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    true
  );

insert into public.scrobbles (
  user_id,
  event_id,
  track_id,
  artist_id,
  track_name,
  artist_name,
  played_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    repeat('a', 64),
    'track-a',
    'artist-a',
    'Track A',
    'Artist A',
    1700000000
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    repeat('b', 64),
    'track-b',
    'artist-b',
    'Track B',
    'Artist B',
    1700000001
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.scrobbles),
  1,
  'User A can read only their own scrobbles'
);

select throws_ok(
  $$insert into public.scrobbles (
      user_id, event_id, track_id, artist_id, track_name, artist_name, played_at
    ) values (
      '20000000-0000-4000-8000-000000000002',
      repeat('c', 64), 'track-c', 'artist-c', 'Track C', 'Artist C', 1700000002
    )$$,
  '42501',
  null,
  'User A cannot insert a scrobble for User B'
);

select is(
  (with changed as (
    update public.scrobbles
    set track_name = 'Tampered'
    where user_id = '20000000-0000-4000-8000-000000000002'
    returning 1
  )
  select count(*)::integer from changed),
  0,
  'User A cannot update User B scrobbles'
);

select is(
  (with changed as (
    delete from public.scrobbles
    where user_id = '20000000-0000-4000-8000-000000000002'
    returning 1
  )
  select count(*)::integer from changed),
  0,
  'User A cannot delete User B scrobbles'
);

select ok(
  not has_table_privilege('authenticated', 'public.lastfm_connections', 'select')
  and not has_table_privilege('authenticated', 'public.lastfm_auth_requests', 'select')
  and not has_table_privilege('authenticated', 'public.scrobble_sync_state', 'select'),
  'Sensitive connection, authorization, and sync-state tables are inaccessible to app roles'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.scrobbles),
  1,
  'User B can read only their own scrobbles'
);

select is(
  (select track_name from public.scrobbles),
  'Track B',
  'User B cannot observe User A listening data'
);

select ok(
  not has_table_privilege('anon', 'public.scrobbles', 'select')
  and not has_table_privilege('anon', 'public.scrobbles', 'insert'),
  'Anonymous role cannot access scrobbles'
);

select * from finish();
rollback;
