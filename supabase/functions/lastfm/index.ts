import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

// TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
interface EdgePerformanceDetails {
  page?: number;
  records?: number;
  httpStatus?: number;
}

function logEdgePerformance(
  phase: string,
  startedAt: number,
  success: boolean,
  details: EdgePerformanceDetails = {}
): void {
  console.info('[TEMP PERF]', {
    phase,
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    success,
    ...details,
  });
}

async function measureEdge<T>(
  phase: string,
  operation: () => Promise<T>,
  details: EdgePerformanceDetails = {}
): Promise<T> {
  const startedAt = performance.now();
  let success = false;
  try {
    const result = await operation();
    success = true;
    return result;
  } finally {
    logEdgePerformance(phase, startedAt, success, details);
  }
}

interface LastFmResponse {
  error?: number;
  message?: string;
  token?: string;
  session?: {
    name?: string;
    key?: string;
  };
  user?: {
    name?: string;
    realname?: string;
    url?: string;
  };
  track?: {
    duration?: string;
  };
  recenttracks?: {
    track?: LastFmRecentTrack | LastFmRecentTrack[];
    '@attr'?: {
      page?: string;
      totalPages?: string;
      total?: string;
      perPage?: string;
    };
  };
}

interface NormalizedNowPlayingTrack {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  artworkUrl: string;
}

interface LastFmRecentTrack {
  name?: string;
  mbid?: string;
  '@attr'?: { nowplaying?: string };
  artist?: string | { '#text'?: string; name?: string; mbid?: string };
  album?: string | { '#text'?: string; mbid?: string };
  date?: { uts?: string };
  loved?: string;
  image?: Array<{ '#text'?: string; size?: string }>;
}

interface NormalizedScrobble {
  user_id: string;
  event_id: string;
  track_id: string;
  artist_id: string;
  album_id: string | null;
  track_name: string;
  artist_name: string;
  album_name: string | null;
  track_mbid: string | null;
  artist_mbid: string | null;
  album_mbid: string | null;
  played_at: number;
  loved: boolean | null;
  artwork_url: string | null;
  source: 'lastfm';
}

interface SyncState {
  user_id: string;
  status: 'idle' | 'running' | 'complete' | 'failed';
  mode: 'initial' | 'incremental' | null;
  current_page: number;
  total_pages: number;
  total_available: number;
  oldest_imported_at: number | null;
  newest_imported_at: number | null;
  pending_page_oldest_at: number | null;
  pending_page_newest_at: number | null;
  last_sync_at: string | null;
  imported_count: number;
  duplicate_count: number;
  range_from: number | null;
  range_to: number | null;
  last_error: string | null;
}

interface TrackDurationRequest {
  track_id: string;
  track_mbid?: string | null;
  artist_name: string;
  track_name: string;
}

interface StoredTrackDuration {
  user_id: string;
  track_id: string;
  track_mbid: string | null;
  artist_name: string;
  track_name: string;
  duration_sec: number | null;
  checked_at: string;
}

interface StoredConnection {
  lastfm_username: string;
  encrypted_session_key: string;
  session_key_iv: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly lastFmCode?: number
  ) {
    super(message);
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function getRequiredSecret(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new ApiError(`Server secret ${name} is not configured.`, 503);
  return value;
}

function getSupabaseConfig() {
  return {
    url: getRequiredSecret('SUPABASE_URL').replace(/\/+$/, ''),
    anonKey: getRequiredSecret('SUPABASE_ANON_KEY'),
    serviceRoleKey: getRequiredSecret('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

function getServiceHeaders() {
  const { serviceRoleKey } = getSupabaseConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

async function readSyncState(userId: string): Promise<SyncState | null> {
  return measureEdge('sync_state_read', () => readSyncStateUnmeasured(userId));
}

async function readSyncStateUnmeasured(userId: string): Promise<SyncState | null> {
  const { url } = getSupabaseConfig();
  const query = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    limit: '1',
  });
  const response = await fetch(`${url}/rest/v1/scrobble_sync_state?${query}`, {
    headers: getServiceHeaders(),
  });
  if (!response.ok) throw new ApiError('Could not read sync progress.', 500);
  const rows = (await response.json()) as SyncState[];
  return rows[0] || null;
}

async function saveSyncState(state: SyncState): Promise<void> {
  return measureEdge('checkpoint_state_write', () => saveSyncStateUnmeasured(state), {
    page: state.current_page || state.total_pages || undefined,
  });
}

async function saveSyncStateUnmeasured(state: SyncState): Promise<void> {
  const { url } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/scrobble_sync_state?on_conflict=user_id`,
    {
      method: 'POST',
      headers: {
        ...getServiceHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ ...state, updated_at: new Date().toISOString() }),
    }
  );
  if (!response.ok) throw new ApiError('Could not save sync progress.', 500);
}

function parseNumber(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getPageTimestampBounds(rows: NormalizedScrobble[]) {
  if (rows.length === 0) {
    return { oldest: null, newest: null };
  }
  const timestamps = rows.map((row) => row.played_at);
  return {
    oldest: Math.min(...timestamps),
    newest: Math.max(...timestamps),
  };
}

function readLastFmText(
  value: string | { '#text'?: string; name?: string } | undefined
): string {
  if (typeof value === 'string') return value.trim();
  return (value?.name || value?.['#text'] || '').trim();
}

async function stableEntityId(prefix: string, value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value.trim()    .toLowerCase())
  );
  const suffix = Array.from(new Uint8Array(digest).slice(0, 16))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${suffix}`;
}

async function normalizeRecentTracks(
  userId: string,
  tracks: LastFmRecentTrack[],
  page?: number
): Promise<NormalizedScrobble[]> {
  return measureEdge(
    'recent_tracks_normalization',
    () => normalizeRecentTracksUnmeasured(userId, tracks),
    { page, records: tracks.length }
  );
}

async function normalizeRecentTracksUnmeasured(
  userId: string,
  tracks: LastFmRecentTrack[]
): Promise<NormalizedScrobble[]> {
  const rows: NormalizedScrobble[] = [];
  for (const track of tracks) {
    const timestamp = Number(track.date?.uts);
    const artistName = readLastFmText(track.artist);
    const trackName = track.name?.trim() || '';
    if (
      !Number.isSafeInteger(timestamp) ||
      timestamp <= 0 ||
      !artistName ||
      !trackName ||
      track['@attr']?.nowplaying === 'true'
    ) {
      continue;
    }

    const albumName = readLastFmText(track.album) || null;
    const artistMbid =
      typeof track.artist === 'object' ? track.artist.mbid?.trim() || null : null;
    const albumMbid =
      typeof track.album === 'object' ? track.album.mbid?.trim() || null : null;
    const artistIdentity = artistMbid || artistName;
    const trackIdentity = track.mbid?.trim() || `${artistIdentity}\u001f${trackName}`;
    const albumIdentity = albumMbid || `${artistIdentity}\u001f${albumName || ''}`;
    const [artistId, trackId, albumId] = await Promise.all([
      stableEntityId('art', artistIdentity),
      stableEntityId('trk', trackIdentity),
      albumName ? stableEntityId('alb', albumIdentity) : Promise.resolve(null),
    ]);
    const identity = [
      timestamp,
      (track.mbid || '').trim().toLowerCase(),
      artistId,
      trackId,
      albumMbid?.toLowerCase() || (albumName || '').toLowerCase(),
    ].join('\u001f');
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(identity)
    );
    const eventId = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    rows.push({
      user_id: userId,
      event_id: eventId,
      track_id: trackId,
      artist_id: artistId,
      album_id: albumId,
      track_name: trackName,
      artist_name: artistName,
      album_name: albumName,
      track_mbid: track.mbid?.trim() || null,
      artist_mbid: artistMbid,
      album_mbid: albumMbid,
      played_at: timestamp,
      loved:
        track.loved === '1'
          ? true
          : track.loved === '0'
            ? false
            : null,
      artwork_url:
        track.image?.find((image) => image.size === 'extralarge')?.['#text'] ||
        track.image?.find((image) => image.size === 'large')?.['#text'] ||
        null,
      source: 'lastfm',
    });
  }
  return rows;
}

async function fetchRecentTracksPage(
  username: string,
  sessionKey: string,
  page: number,
  rangeFrom: number | null,
  rangeTo: number
) {
  const params: Record<string, string> = {
    limit: '200',
    page: String(page),
    sk: sessionKey,
    user: username,
  };
  if (rangeFrom !== null) params.from = String(rangeFrom);
  if (rangeTo > 0) params.to = String(rangeTo);

  const response = await callLastFm('user.getRecentTracks', params);
  const recent = response.recenttracks;
  if (!recent) throw new ApiError('Last.fm returned no recent-track data.', 502);
  const tracks = recent.track
    ? Array.isArray(recent.track)
      ? recent.track
      : [recent.track]
    : [];
  const attributes = recent['@attr'];
  return {
    tracks,
    page: parseNumber(attributes?.page) || page,
    totalPages: parseNumber(attributes?.totalPages),
    totalAvailable: parseNumber(attributes?.total),
  };
}

async function getNowPlaying(userId: string): Promise<{ track: NormalizedNowPlayingTrack | null }> {
  const connection = await readConnection(userId);
  const sessionKey = await decryptSessionKey(connection);
  const response = await callLastFm('user.getRecentTracks', {
    limit: '1',
    sk: sessionKey,
    user: connection.lastfm_username,
  });
  const recentTracks = response.recenttracks?.track;
  const tracks = Array.isArray(recentTracks)
    ? recentTracks
    : recentTracks
      ? [recentTracks]
      : [];
  const current = tracks.find((track) => track['@attr']?.nowplaying === 'true');
  if (!current) return { track: null };

  const artistName = readLastFmText(current.artist);
  const title = current.name?.trim() || '';
  if (!artistName || !title) {
    throw new ApiError('Last.fm returned incomplete now-playing track data.', 502);
  }
  const albumTitle = readLastFmText(current.album);
  const artistMbid =
    typeof current.artist === 'object' ? current.artist.mbid?.trim() || null : null;
  const albumMbid =
    typeof current.album === 'object' ? current.album.mbid?.trim() || null : null;
  const artistIdentity = artistMbid || artistName;
  const trackIdentity = current.mbid?.trim() || `${artistIdentity}\u001f${title}`;
  const albumIdentity = albumMbid || `${artistIdentity}\u001f${albumTitle}`;
  const [artistId, id, albumId] = await Promise.all([
    stableEntityId('art', artistIdentity),
    stableEntityId('trk', trackIdentity),
    albumTitle ? stableEntityId('alb', albumIdentity) : Promise.resolve(''),
  ]);

  return {
    track: {
      id,
      title,
      artistId,
      artistName,
      albumId,
      albumTitle,
      artworkUrl:
        current.image?.find((image) => image.size === 'extralarge')?.['#text'] ||
        current.image?.find((image) => image.size === 'large')?.['#text'] ||
        '',
    },
  };
}

async function getTrackDurationMetadata(
  userId: string,
  requests: TrackDurationRequest[]
): Promise<{ tracks: Array<Omit<StoredTrackDuration, 'user_id' | 'checked_at'> & { checked_at: number }> }> {
  const { url } = getSupabaseConfig();
  const ids = requests.map((track) => track.track_id);
  const query = new URLSearchParams({
    select: 'track_id,track_mbid,artist_name,track_name,duration_sec,checked_at',
    user_id: `eq.${userId}`,
    track_id: `in.(${ids.join(',')})`,
  });
  const existingResponse = await fetch(`${url}/rest/v1/track_metadata?${query}`, {
    headers: getServiceHeaders(),
  });
  if (!existingResponse.ok) {
    throw new ApiError('Could not read cached track duration metadata.', 500);
  }
  const existingRows = (await existingResponse.json()) as StoredTrackDuration[];
  const existingById = new Map(existingRows.map((row) => [row.track_id, row]));
  const retryBefore = Date.now() - 30 * 86400 * 1000;
  const resultById = new Map<string, StoredTrackDuration>();

  for (const row of existingRows) {
    const checkedAt = new Date(row.checked_at).getTime();
    if (
      (row.duration_sec !== null && row.duration_sec > 0) ||
      (Number.isFinite(checkedAt) && checkedAt >= retryBefore)
    ) {
      resultById.set(row.track_id, row);
    }
  }

  const tracksToFetch = requests.filter((track) => !resultById.has(track.track_id));
  for (const track of tracksToFetch) {
    const params: Record<string, string> = track.track_mbid
      ? { mbid: track.track_mbid }
      : { artist: track.artist_name, track: track.track_name };
    let durationSec: number | null = null;
    try {
      const response = await callLastFm('track.getInfo', params);
      const durationMs = Number(response.track?.duration);
      durationSec =
        Number.isSafeInteger(durationMs) && durationMs >= 1000
          ? Math.round(durationMs / 1000)
          : null;
    } catch (error) {
      if (!(error instanceof ApiError) || error.lastFmCode !== 6) throw error;
    }
    const row: StoredTrackDuration = {
      user_id: userId,
      track_id: track.track_id,
      track_mbid: track.track_mbid || null,
      artist_name: track.artist_name,
      track_name: track.track_name,
      duration_sec: durationSec,
      checked_at: new Date().toISOString(),
    };
    existingById.set(track.track_id, row);
    resultById.set(track.track_id, row);
  }

  const changedRows = tracksToFetch.map((track) => existingById.get(track.track_id)!);
  if (changedRows.length > 0) {
    const saveResponse = await fetch(
      `${url}/rest/v1/track_metadata?on_conflict=user_id,track_id`,
      {
        method: 'POST',
        headers: {
          ...getServiceHeaders(),
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(changedRows),
      }
    );
    if (!saveResponse.ok) {
      throw new ApiError('Could not persist track duration metadata.', 500);
    }
  }

  return {
    tracks: requests.map((request) => {
      const row = resultById.get(request.track_id);
      if (!row) throw new ApiError('Track duration metadata is incomplete.', 500);
      return {
        track_id: row.track_id,
        track_mbid: row.track_mbid,
        artist_name: row.artist_name,
        track_name: row.track_name,
        duration_sec: row.duration_sec,
        checked_at: new Date(row.checked_at).getTime(),
      };
    }),
  };
}

async function insertScrobbles(rows: NormalizedScrobble[], page?: number): Promise<number> {
  const startedAt = performance.now();
  let success = false;
  let httpStatus: number | undefined;
  if (rows.length === 0) {
    logEdgePerformance('scrobble_bulk_insert', startedAt, true, {
      page,
      records: 0,
    });
    return 0;
  }
  try {
    const inserted = await insertScrobblesUnmeasured(rows, (status) => {
      httpStatus = status;
    });
    success = true;
    logEdgePerformance('scrobble_bulk_insert', startedAt, success, {
      page,
      records: inserted,
      httpStatus,
    });
    return inserted;
  } finally {
    if (!success) {
      logEdgePerformance('scrobble_bulk_insert', startedAt, success, {
        page,
        records: rows.length,
        httpStatus,
      });
    }
  }
}

async function insertScrobblesUnmeasured(
  rows: NormalizedScrobble[],
  onHttpStatus: (status: number) => void
): Promise<number> {
  const { url } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/scrobbles?on_conflict=user_id,event_id`,
    {
      method: 'POST',
      headers: {
        ...getServiceHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=representation',
      },
      body: JSON.stringify(rows),
    }
  );
  onHttpStatus(response.status);
  if (!response.ok) throw new ApiError('Could not store the imported scrobbles.', 500);
  const inserted = (await response.json()) as Array<{ event_id: string }>;
  return inserted.length;
}

async function startOrResumeSync(
  userId: string,
  initialState: SyncState | null
) {
  let state = initialState;
  if (state?.status === 'running' || state?.status === 'failed') {
    state.status = 'running';
    state.last_error = null;
    await saveSyncState(state);
    const connection = await readConnection(userId);
    const sessionKey = await decryptSessionKey(connection);
    const requestedPage = Math.max(1, state.current_page);
    const page = await fetchRecentTracksPage(
      connection.lastfm_username,
      sessionKey,
      requestedPage,
      state.range_from,
      state.range_to || Math.floor(Date.now() / 1000)
    );
    const rows = await normalizeRecentTracks(userId, page.tracks, requestedPage);
    const pageBounds = getPageTimestampBounds(rows);
    const insertedCount = await insertScrobbles(rows, requestedPage);
    state = {
      ...state,
      status: 'running',
      total_pages: page.totalPages || state.total_pages,
      total_available: page.totalAvailable || state.total_available,
      pending_page_oldest_at: pageBounds.oldest,
      pending_page_newest_at: pageBounds.newest,
      duplicate_count: state.duplicate_count + rows.length - insertedCount,
      last_error: null,
    };
    await saveSyncState(state);
    return {
      state,
      items: rows,
      page: requestedPage,
      hasMore: requestedPage < state.total_pages,
      checkpointRequired: true,
    };
  }

  const connection = await readConnection(userId);
  const sessionKey = await decryptSessionKey(connection);
  const now = Math.floor(Date.now() / 1000);
  const mode: 'initial' | 'incremental' =
    state?.newest_imported_at == null ? 'initial' : 'incremental';
  const rangeFrom =
    mode === 'incremental'
      ? Math.max(0, state!.newest_imported_at! - 120)
      : null;
  const firstPage = await fetchRecentTracksPage(
    connection.lastfm_username,
    sessionKey,
    1,
    rangeFrom,
    now
  );
  const pageRows = await normalizeRecentTracks(userId, firstPage.tracks, firstPage.page);
  const pageBounds = getPageTimestampBounds(pageRows);
  state = {
    user_id: userId,
    status: 'running',
    mode,
    current_page: 1,
    total_pages: firstPage.totalPages,
    total_available: firstPage.totalAvailable,
    oldest_imported_at: state?.oldest_imported_at ?? null,
    newest_imported_at: state?.newest_imported_at ?? null,
    pending_page_oldest_at: pageBounds.oldest,
    pending_page_newest_at: pageBounds.newest,
    last_sync_at: state?.last_sync_at ?? null,
    imported_count: state?.imported_count ?? 0,
    duplicate_count: state?.duplicate_count ?? 0,
    range_from: rangeFrom,
    range_to: now,
    last_error: null,
  };
  await saveSyncState(state);
  const insertedCount = await insertScrobbles(pageRows, firstPage.page);
  state.imported_count += insertedCount;
  state.duplicate_count += pageRows.length - insertedCount;
  await saveSyncState(state);
  return {
    state,
    items: pageRows,
    page: firstPage.page,
    hasMore: firstPage.totalPages > 1,
    checkpointRequired: true,
  };
}

async function syncOnePage(userId: string, acknowledgedPage?: number) {
  let state = await readSyncState(userId);
  if (acknowledgedPage !== undefined) {
    state = await acknowledgeSyncPage(userId, acknowledgedPage, state);
    if (state.status === 'complete') {
      return {
        state,
        items: [],
        page: acknowledgedPage,
        hasMore: false,
        checkpointRequired: false,
      };
    }
  }
  if (!state || state.status === 'idle' || state.status === 'complete') {
    return startOrResumeSync(userId, state);
  }
  const connection = await readConnection(userId);
  const sessionKey = await decryptSessionKey(connection);
  const requestedPage = state.current_page || 1;
  const page = await fetchRecentTracksPage(
    connection.lastfm_username,
    sessionKey,
    requestedPage,
    state.range_from,
    state.range_to || Math.floor(Date.now() / 1000)
  );
  const rows = await normalizeRecentTracks(userId, page.tracks, requestedPage);
  const pageBounds = getPageTimestampBounds(rows);
  const insertedCount = await insertScrobbles(rows, requestedPage);
  state = {
    ...state,
    status: 'running',
    total_pages: page.totalPages || state.total_pages,
    total_available: page.totalAvailable || state.total_available,
    pending_page_oldest_at: pageBounds.oldest,
    pending_page_newest_at: pageBounds.newest,
    duplicate_count: state.duplicate_count + rows.length - insertedCount,
    last_error: null,
  };
  await saveSyncState(state);
  return {
    state,
    items: rows,
    page: requestedPage,
    hasMore: requestedPage < state.total_pages,
    checkpointRequired: true,
  };
}

async function acknowledgeSyncPage(
  userId: string,
  page: number,
  knownState?: SyncState | null
) {
  const state =
    knownState === undefined ? await readSyncState(userId) : knownState;
  if (
    state?.status === 'complete' &&
    state.current_page === 0 &&
    page === state.total_pages
  ) {
    return state;
  }
  if (!state || state.status !== 'running') {
    throw new ApiError('There is no active sync page to acknowledge.', 409);
  }
  if (page < state.current_page) return state;
  if (page !== state.current_page) {
    throw new ApiError('The sync page does not match the saved checkpoint.', 409);
  }

  if (state.pending_page_oldest_at !== null && state.pending_page_newest_at !== null) {
    state.oldest_imported_at =
      state.oldest_imported_at === null
        ? state.pending_page_oldest_at
        : Math.min(state.oldest_imported_at, state.pending_page_oldest_at);
    state.newest_imported_at =
      state.newest_imported_at === null
        ? state.pending_page_newest_at
        : Math.max(state.newest_imported_at, state.pending_page_newest_at);
  }
  state.pending_page_oldest_at = null;
  state.pending_page_newest_at = null;
  const done = page >= state.total_pages;
  state.status = done ? 'complete' : 'running';
  state.current_page = done ? 0 : page + 1;
  if (done) {
    state.last_sync_at = new Date().toISOString();
    state.mode = null;
  }
  await saveSyncState(state);
  return state;
}

async function authenticateUser(request: Request): Promise<string> {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError('A Supabase Auth session is required.', 401);
  }
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: authorization,
    },
  });
  if (!response.ok) throw new ApiError('The Supabase Auth session is invalid.', 401);
  const user = (await response.json()) as { id?: string };
  if (!user.id) throw new ApiError('The Supabase Auth session is invalid.', 401);
  return user.id;
}

function getLastFmCredentials() {
  return {
    apiKey: getRequiredSecret('LASTFM_API_KEY'),
    sharedSecret: getRequiredSecret('LASTFM_SHARED_SECRET'),
  };
}

function signLastFmParams(params: Record<string, string>, sharedSecret: string): string {
  const value =
    Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join('') + sharedSecret;
  return createHash('md5').update(value, 'utf8').digest('hex');
}

async function callLastFm(
  method: string,
  params: Record<string, string>
): Promise<LastFmResponse> {
  const startedAt = performance.now();
  let success = false;
  let httpStatus: number | undefined;
  let records: number | undefined;
  const page = method === 'user.getRecentTracks' ? parseNumber(params.page) || undefined : undefined;
  try {
    const result = await callLastFmUnmeasured(method, params, (status) => {
      httpStatus = status;
    });
    success = true;
    if (method === 'user.getRecentTracks') {
      const trackData = result.recenttracks?.track;
      records = Array.isArray(trackData) ? trackData.length : trackData ? 1 : 0;
    }
    return result;
  } finally {
    logEdgePerformance('lastfm_call', startedAt, success, {
      page,
      records,
      httpStatus,
    });
  }
}

async function callLastFmUnmeasured(
  method: string,
  params: Record<string, string>,
  onHttpStatus: (status: number) => void
): Promise<LastFmResponse> {
  const { apiKey, sharedSecret } = getLastFmCredentials();
  const signedParams = { ...params, api_key: apiKey, method };
  const body = new URLSearchParams({
    ...signedParams,
    api_sig: signLastFmParams(signedParams, sharedSecret),
    format: 'json',
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(LASTFM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      if (attempt === 2) throw new ApiError('Could not reach the Last.fm API after retries.', 502);
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      continue;
    }
    onHttpStatus(response.status);

    if (response.status === 429 || response.status >= 500) {
      if (attempt === 2) {
        const rateLimited = response.status === 429;
        throw new ApiError(
          rateLimited
            ? 'Last.fm rate limit reached. Try syncing again shortly.'
            : 'Last.fm is temporarily unavailable. Try syncing again.',
          rateLimited ? 429 : 503
        );
      }
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delayMs =
        response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 10000)
          : 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    let payload: LastFmResponse;
    try {
      payload = (await response.json()) as LastFmResponse;
    } catch {
      throw new ApiError('Last.fm returned an invalid response.', 502);
    }

    const rateLimited = payload.error === 29;
    const transient = payload.error === 11 || payload.error === 16;
    if (rateLimited || transient) {
      if (attempt === 2) {
        throw new ApiError(
          rateLimited
            ? 'Last.fm rate limit reached. Try syncing again shortly.'
            : 'Last.fm is temporarily unavailable. Try syncing again.',
          rateLimited ? 429 : 503
        );
      }
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delayMs =
        rateLimited && Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 10000)
          : 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    if (payload.error) {
      const authenticationFailure = [4, 9, 14, 15].includes(payload.error);
      throw new ApiError(
        payload.message || `Last.fm rejected the request (${payload.error}).`,
        authenticationFailure ? 401 : 502,
        payload.error
      );
    }
    if (!response.ok) throw new ApiError('Last.fm request failed.', 502);
    return payload;
  }
  throw new ApiError('Last.fm request could not be completed.', 502);
}

function decodeEncryptionKey(): Uint8Array {
  const value = getRequiredSecret('LASTFM_SESSION_ENCRYPTION_KEY');
  if (!/^[\da-f]{64}$/i.test(value)) {
    throw new ApiError('The session encryption key must be 64 hexadecimal characters.', 503);
  }
  return Uint8Array.from(value.match(/.{2}/g)!, (byte) => Number.parseInt(byte, 16));
}

function encodeBase64(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function encryptSessionKey(sessionKey: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    decodeEncryptionKey(),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(sessionKey)
  );
  return {
    encryptedSessionKey: encodeBase64(new Uint8Array(encrypted)),
    iv: encodeBase64(iv),
  };
}

async function decryptSessionKey(connection: StoredConnection): Promise<string> {
  return measureEdge('lastfm_session_decryption', () =>
    decryptSessionKeyUnmeasured(connection)
  );
}

async function decryptSessionKeyUnmeasured(connection: StoredConnection): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    decodeEncryptionKey(),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(connection.session_key_iv) },
    key,
    decodeBase64(connection.encrypted_session_key)
  );
  return new TextDecoder().decode(decrypted);
}

async function persistConnection(
  userId: string,
  username: string,
  sessionKey: string
): Promise<void> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const encrypted = await encryptSessionKey(sessionKey);
  const response = await fetch(
    `${url}/rest/v1/lastfm_connections?on_conflict=user_id`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        lastfm_username: username,
        encrypted_session_key: encrypted.encryptedSessionKey,
        session_key_iv: encrypted.iv,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  if (!response.ok) throw new ApiError('Could not securely save the Last.fm connection.', 500);
}

async function readConnection(userId: string): Promise<StoredConnection> {
  return measureEdge('lastfm_connection_read', () => readConnectionUnmeasured(userId));
}

async function readConnectionUnmeasured(userId: string): Promise<StoredConnection> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const query = new URLSearchParams({
    select: 'lastfm_username,encrypted_session_key,session_key_iv',
    user_id: `eq.${userId}`,
    limit: '1',
  });
  const response = await fetch(`${url}/rest/v1/lastfm_connections?${query}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!response.ok) throw new ApiError('Could not load the Last.fm connection.', 500);
  const rows = (await response.json()) as StoredConnection[];
  if (!rows[0]) throw new ApiError('Connect a Last.fm account first.', 409);
  return rows[0];
}

async function deleteConnection(userId: string): Promise<void> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const query = new URLSearchParams({ user_id: `eq.${userId}` });
  const response = await fetch(`${url}/rest/v1/lastfm_connections?${query}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!response.ok) throw new ApiError('Could not disconnect the Last.fm account.', 500);
}

async function hashAuthState(state: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(state));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function deleteExpiredAuthRequests(): Promise<void> {
  const { url } = getSupabaseConfig();
  const query = new URLSearchParams({
    expires_at: `lt.${new Date().toISOString()}`,
  });
  const response = await fetch(`${url}/rest/v1/lastfm_auth_requests?${query}`, {
    method: 'DELETE',
    headers: getServiceHeaders(),
  });
  if (!response.ok) throw new ApiError('Could not prepare Last.fm authorization.', 500);
}

async function createAuthRequest(userId: string, lastFmToken: string): Promise<string> {
  await deleteExpiredAuthRequests();
  const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/lastfm_auth_requests`, {
    method: 'POST',
    headers: {
      ...getServiceHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      state_hash: await hashAuthState(state),
      user_id: userId,
      lastfm_token: lastFmToken,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }),
  });
  if (!response.ok) throw new ApiError('Could not safely prepare Last.fm sign-in.', 500);
  return state;
}

async function readAuthRequest(
  state: string,
  userId?: string
): Promise<{ lastfm_token: string; user_id: string } | null> {
  const { url } = getSupabaseConfig();
  const query = new URLSearchParams({
    select: 'lastfm_token,user_id',
    state_hash: `eq.${await hashAuthState(state)}`,
    expires_at: `gt.${new Date().toISOString()}`,
    limit: '1',
  });
  if (userId) query.set('user_id', `eq.${userId}`);
  const response = await fetch(`${url}/rest/v1/lastfm_auth_requests?${query}`, {
    headers: getServiceHeaders(),
  });
  if (!response.ok) throw new ApiError('Could not validate Last.fm authorization state.', 500);
  const rows = (await response.json()) as Array<{
    lastfm_token: string;
    user_id: string;
  }>;
  return rows[0] || null;
}

async function deleteAuthRequest(state: string): Promise<void> {
  const { url } = getSupabaseConfig();
  const query = new URLSearchParams({
    state_hash: `eq.${await hashAuthState(state)}`,
  });
  const response = await fetch(`${url}/rest/v1/lastfm_auth_requests?${query}`, {
    method: 'DELETE',
    headers: getServiceHeaders(),
  });
  if (!response.ok) throw new ApiError('Could not finish Last.fm authorization.', 500);
}

async function redirectToLastFmAuthorization(state: string): Promise<Response> {
  if (!/^[a-f\d]{64}$/i.test(state)) {
    return new Response('Invalid or expired authorization request.', { status: 400 });
  }
  const authRequest = await readAuthRequest(state);
  if (!authRequest) {
    return new Response('Invalid or expired authorization request.', { status: 400 });
  }
  const { apiKey } = getLastFmCredentials();
  const destination = new URL('https://www.last.fm/api/auth/');
  destination.searchParams.set('api_key', apiKey);
  destination.searchParams.set('token', authRequest.lastfm_token);
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: destination.toString(),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

async function readCloudScrobblePage(
  userId: string,
  before?: { playedAt: number; eventId: string }
) {
  const { url } = getSupabaseConfig();
  const query = new URLSearchParams({
    select:
      'user_id,event_id,track_id,artist_id,album_id,track_name,artist_name,album_name,track_mbid,artist_mbid,album_mbid,played_at,loved,artwork_url,source',
    user_id: `eq.${userId}`,
    order: 'played_at.desc,event_id.desc',
    limit: '200',
  });
  if (before) {
    query.set(
      'or',
      `(played_at.lt.${before.playedAt},and(played_at.eq.${before.playedAt},event_id.lt.${before.eventId}))`
    );
  }
  const response = await fetch(`${url}/rest/v1/scrobbles?${query}`, {
    headers: getServiceHeaders(),
  });
  if (!response.ok) throw new ApiError('Could not read cloud listening history.', 500);
  const items = (await response.json()) as NormalizedScrobble[];
  const last = items[items.length - 1];
  return {
    items,
    nextCursor:
      items.length === 200 && last
        ? { playedAt: last.played_at, eventId: last.event_id }
        : null,
  };
}

// TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
Deno.serve(async (request: Request) => {
  const startedAt = performance.now();
  let response: Response | undefined;
  let success = false;
  try {
    response = await handleLastFmRequest(request);
    success = response.status < 400;
    return response;
  } finally {
    logEdgePerformance('edge_request_total', startedAt, success, {
      httpStatus: response?.status,
    });
  }
});

async function handleLastFmRequest(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method === 'GET') {
    const state = new URL(request.url).searchParams.get('state') || '';
    try {
      return await redirectToLastFmAuthorization(state);
    } catch (error) {
      console.error('Last.fm authorization redirect failed:', error);
      return new Response('Could not start Last.fm authorization.', { status: 502 });
    }
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let userId: string | null = null;
  let body: {
    action?: string;
    token?: string;
    page?: number;
    acknowledgedPage?: number;
    beforePlayedAt?: number;
    beforeEventId?: string;
    tracks?: unknown;
  };
  try {
    const authStartedAt = performance.now();
    let authSucceeded = false;
    try {
      userId = await authenticateUser(request);
      authSucceeded = true;
    } finally {
      logEdgePerformance('auth_validation', authStartedAt, authSucceeded);
    }
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      throw new ApiError('A valid JSON request body is required.', 400);
    }
    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      throw new ApiError('A JSON object request body is required.', 400);
    }
    body = parsedBody as typeof body;

    if (typeof body.action !== 'string') {
      throw new ApiError('A request action is required.', 400);
    }

    if (body.action === 'start') {
      const result = await callLastFm('auth.getToken', {});
      if (!result.token) throw new ApiError('Last.fm did not return an authorization token.', 502);
      const state = await createAuthRequest(userId, result.token);
      const { url } = getSupabaseConfig();
      const authorizationUrl = new URL(`${url}/functions/v1/lastfm`);
      authorizationUrl.searchParams.set('state', state);
      return jsonResponse({ token: state, authorizationUrl: authorizationUrl.toString() });
    }

    if (body.action === 'complete') {
      if (typeof body.token !== 'string' || !/^[a-f\d]{64}$/i.test(body.token)) {
        throw new ApiError('A valid Last.fm authorization token is required.', 400);
      }
      const authRequest = await readAuthRequest(body.token, userId);
      if (!authRequest) {
        throw new ApiError('Last.fm authorization expired. Please start again.', 401);
      }
      const result = await callLastFm('auth.getSession', {
        token: authRequest.lastfm_token,
      });
      const username = result.session?.name;
      const sessionKey = result.session?.key;
      if (!username || !sessionKey) {
        throw new ApiError('Last.fm did not return a valid session.', 502);
      }
      await persistConnection(userId, username, sessionKey);
      await deleteAuthRequest(body.token);
      return jsonResponse({ username });
    }

    if (body.action === 'disconnect') {
      await deleteConnection(userId);
      return jsonResponse({ disconnected: true });
    }

    if (body.action === 'sync-state') {
      return jsonResponse({ state: await readSyncState(userId) });
    }

    if (body.action === 'now-playing') {
      return jsonResponse(await getNowPlaying(userId));
    }

    if (body.action === 'track-durations') {
      if (!Array.isArray(body.tracks) || body.tracks.length < 1 || body.tracks.length > 10) {
        throw new ApiError('A batch of 1 to 10 tracks is required.', 400);
      }
      const tracks = body.tracks as TrackDurationRequest[];
      const seenIds = new Set<string>();
      for (const track of tracks) {
        if (
          !track ||
          typeof track.track_id !== 'string' ||
          !/^[A-Za-z0-9_-]{1,128}$/.test(track.track_id) ||
          seenIds.has(track.track_id) ||
          typeof track.track_name !== 'string' ||
          !track.track_name.trim() ||
          track.track_name.length > 300 ||
          typeof track.artist_name !== 'string' ||
          !track.artist_name.trim() ||
          track.artist_name.length > 300 ||
          (track.track_mbid != null &&
            (typeof track.track_mbid !== 'string' || track.track_mbid.length > 64))
        ) {
          throw new ApiError('The track duration request contains invalid track metadata.', 400);
        }
        seenIds.add(track.track_id);
      }
      await readConnection(userId);
      return jsonResponse(await getTrackDurationMetadata(userId, tracks));
    }

    if (body.action === 'cloud-page') {
      if (
        (body.beforePlayedAt === undefined) !== (body.beforeEventId === undefined) ||
        (body.beforePlayedAt !== undefined &&
          (!Number.isSafeInteger(body.beforePlayedAt) ||
            typeof body.beforeEventId !== 'string' ||
            !/^[a-f\d]{64}$/i.test(body.beforeEventId)))
      ) {
        throw new ApiError('The cloud history cursor is invalid.', 400);
      }
      return jsonResponse(
        await readCloudScrobblePage(
          userId,
          body.beforePlayedAt === undefined
            ? undefined
            : {
                playedAt: body.beforePlayedAt,
                eventId: body.beforeEventId!,
              }
        )
      );
    }

    if (body.action === 'sync-page') {
      if (
        body.acknowledgedPage !== undefined &&
        (!Number.isSafeInteger(body.acknowledgedPage) || body.acknowledgedPage < 1)
      ) {
        throw new ApiError('A valid acknowledged sync page is required.', 400);
      }
      try {
        return jsonResponse(await syncOnePage(userId, body.acknowledgedPage));
      } catch (error) {
        if (error instanceof ApiError) {
          const state = await readSyncState(userId);
          if (state?.status === 'running') {
            state.status = 'failed';
            state.last_error = error.message;
            await saveSyncState(state);
          }
        }
        throw error;
      }
    }

    if (body.action === 'sync-ack') {
      if (!Number.isSafeInteger(body.page) || body.page! < 1) {
        throw new ApiError('A valid sync page is required.', 400);
      }
      const state = await acknowledgeSyncPage(userId, body.page!);
      return jsonResponse({ state });
    }

    if (body.action === 'account') {
      const connection = await readConnection(userId);
      const sessionKey = await decryptSessionKey(connection);
      const result = await callLastFm('user.getInfo', {
        sk: sessionKey,
        user: connection.lastfm_username,
      });
      if (!result.user?.name) {
        throw new ApiError('Last.fm did not return account information.', 502);
      }
      return jsonResponse({
        username: result.user.name,
        displayName: result.user.realname || result.user.name,
        profileUrl: result.user.url,
      });
    }

    throw new ApiError('Unsupported Last.fm action.', 400);
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    console.error('Unexpected Last.fm function error:', error);
    if (error instanceof TypeError) {
      console.error('Last.fm function network error:', error);
      return jsonResponse({ error: 'A required Supabase service could not be reached.' }, 502);
    }
    return jsonResponse({ error: 'The Last.fm request could not be completed.' }, 500);
  }
}
