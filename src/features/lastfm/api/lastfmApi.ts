import type {
  ImportedScrobble,
  TrackDurationMetadata,
} from '../../../data/local/scrobbleRepository';

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
  };
}

interface SupabaseError {
  message?: string;
  msg?: string;
}

const SESSION_STORAGE_KEY = 'scrobblex_supabase_session';
let anonymousSessionInFlight: Promise<SupabaseSession> | null = null;
let refreshInFlight: Promise<SupabaseSession> | null = null;

function getSupabaseConfig(): { url: string; anonKey: string } {
  const urlValue = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!urlValue || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild.'
    );
  }

  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be an absolute URL.');
  }
  if (url.protocol !== 'https:') {
    throw new Error('Supabase must use HTTPS and cannot point to localhost.');
  }
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Supabase must not point to localhost in the Android app.');
  }
  return { url: urlValue.replace(/\/+$/, ''), anonKey };
}

function readStoredSession(): SupabaseSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SupabaseSession;
    if (
      typeof parsed.access_token === 'string' &&
      typeof parsed.refresh_token === 'string' &&
      typeof parsed.expires_at === 'number' &&
      typeof parsed.user?.id === 'string'
    ) {
      return parsed;
    }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return null;
}

function saveSession(session: SupabaseSession): SupabaseSession {
  const normalized = {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: T | SupabaseError;
  try {
    payload = (await response.json()) as T | SupabaseError;
  } catch {
    throw new Error('Supabase returned an invalid response.');
  }
  if (!response.ok) {
    const error = payload as SupabaseError;
    throw new Error(error.message || error.msg || `Supabase request failed (${response.status}).`);
  }
  return payload as T;
}

async function createAnonymousSession(): Promise<SupabaseSession> {
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: { app: 'ScrobbleX' } }),
  });
  const session = await parseResponse<SupabaseSession>(response);
  if (!session.access_token || !session.refresh_token || !session.user?.id) {
    throw new Error(
      'Supabase did not create an app session. Enable anonymous sign-ins in Supabase Auth.'
    );
  }
  return saveSession(session);
}

async function refreshSession(session: SupabaseSession): Promise<SupabaseSession> {
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const refreshed = await parseResponse<SupabaseSession>(response);
  if (!refreshed.access_token || !refreshed.refresh_token || !refreshed.user?.id) {
    throw new Error('Supabase could not refresh the app session. Please try again.');
  }
  return saveSession(refreshed);
}

async function getAccessToken(): Promise<string> {
  const session = readStoredSession();
  if (!session) {
    if (!anonymousSessionInFlight) {
      anonymousSessionInFlight = createAnonymousSession().finally(() => {
        anonymousSessionInFlight = null;
      });
    }
    return (await anonymousSessionInFlight).access_token;
  }
  if (session.expires_at! > Math.floor(Date.now() / 1000) + 60) {
    return session.access_token;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshSession(session).finally(() => {
      refreshInFlight = null;
    });
  }
  return (await refreshInFlight).access_token;
}

async function invokeLastFm<T>(body: Record<string, unknown>): Promise<T> {
  const { url, anonKey } = getSupabaseConfig();
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Could not reach Supabase. Check your internet connection.');
    }
    throw error;
  }

  // TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
  const measureSyncPage = body.action === 'sync-page';
  const requestStartedAt = measureSyncPage ? performance.now() : 0;
  let requestDurationMs: number | undefined;
  let httpStatus: number | undefined;
  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/lastfm`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    if (measureSyncPage) {
      requestDurationMs = performance.now() - requestStartedAt;
      console.info('[TEMP PERF]', {
        phase: 'client.lastfm_edge_function_wait',
        durationMs: Number(requestDurationMs.toFixed(2)),
        success: false,
        mode: 'unknown',
      });
    }
    throw new Error('Could not reach Supabase. Check your internet connection.');
  }
  if (measureSyncPage) {
    requestDurationMs = performance.now() - requestStartedAt;
    httpStatus = response.status;
  }
  try {
    const result = await parseResponse<T>(response);
    if (measureSyncPage) {
      const page = result as LastFmSyncPage;
      console.info('[TEMP PERF]', {
        phase: 'client.lastfm_edge_function_wait',
        durationMs: Number((requestDurationMs ?? 0).toFixed(2)),
        success: true,
        httpStatus,
        page: page.page,
        records: page.items.length,
        mode: page.state.mode || 'unknown',
      });
    }
    return result;
  } catch (error) {
    if (measureSyncPage) {
      console.info('[TEMP PERF]', {
        phase: 'client.lastfm_edge_function_wait',
        durationMs: Number((requestDurationMs ?? 0).toFixed(2)),
        success: false,
        httpStatus,
        mode: 'unknown',
      });
    }
    throw error;
  }
}

export interface LastFmAuthStart {
  token: string;
  authorizationUrl: string;
}

export interface LastFmConnection {
  username: string;
}

export interface LastFmAccount {
  username: string;
  displayName: string;
  profileUrl?: string;
}

export interface LastFmNowPlayingTrack {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  artworkUrl: string;
}

export interface LastFmTrackDurationRequest {
  track_id: string;
  track_mbid: string | null;
  artist_name: string;
  track_name: string;
}

interface LastFmTrackDurationRecord {
  track_id: string;
  track_mbid: string | null;
  artist_name: string;
  track_name: string;
  duration_sec: number | null;
  checked_at: number;
}

export interface RemoteSyncState {
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
  last_error: string | null;
}

export interface LastFmSyncPage {
  state: RemoteSyncState;
  items: ImportedScrobble[];
  page: number;
  hasMore: boolean;
  checkpointRequired: boolean;
}

export interface CloudHistoryPage {
  items: ImportedScrobble[];
  nextCursor: { playedAt: number; eventId: string } | null;
}

export async function getSupabaseUserId(): Promise<string> {
  const session = readStoredSession();
  if (session?.user?.id) return session.user.id;
  await getAccessToken();
  const created = readStoredSession();
  if (!created?.user?.id) {
    throw new Error('Could not restore the ScrobbleX installation identity.');
  }
  return created.user.id;
}

export function requestLastFmAuthorization(): Promise<LastFmAuthStart> {
  return invokeLastFm<LastFmAuthStart>({ action: 'start' });
}

export function completeLastFmAuthorization(token: string): Promise<LastFmConnection> {
  return invokeLastFm<LastFmConnection>({ action: 'complete', token });
}

export function disconnectLastFm(): Promise<{ disconnected: true }> {
  return invokeLastFm<{ disconnected: true }>({ action: 'disconnect' });
}

export function getLastFmAccount(): Promise<LastFmAccount> {
  return invokeLastFm<LastFmAccount>({ action: 'account' });
}

export async function requestLastFmNowPlaying(): Promise<LastFmNowPlayingTrack | null> {
  const result = await invokeLastFm<{ track: LastFmNowPlayingTrack | null }>({
    action: 'now-playing',
  });
  return result.track;
}

export async function requestLastFmTrackDurations(
  tracks: LastFmTrackDurationRequest[]
): Promise<TrackDurationMetadata[]> {
  const result = await invokeLastFm<{ tracks: LastFmTrackDurationRecord[] }>({
    action: 'track-durations',
    tracks,
  });
  return result.tracks.map((track) => ({
    trackId: track.track_id,
    trackMbid: track.track_mbid,
    artistName: track.artist_name,
    trackName: track.track_name,
    durationSec: track.duration_sec,
    checkedAt: track.checked_at,
  }));
}

export async function getLastFmSyncState(): Promise<RemoteSyncState | null> {
  const result = await invokeLastFm<{ state: RemoteSyncState | null }>({
    action: 'sync-state',
  });
  return result.state;
}

export function requestLastFmSyncPage(acknowledgedPage?: number): Promise<LastFmSyncPage> {
  return invokeLastFm<LastFmSyncPage>({
    action: 'sync-page',
    acknowledgedPage,
  });
}

export function requestCloudHistoryPage(
  cursor?: { playedAt: number; eventId: string }
): Promise<CloudHistoryPage> {
  return invokeLastFm<CloudHistoryPage>({
    action: 'cloud-page',
    beforePlayedAt: cursor?.playedAt,
    beforeEventId: cursor?.eventId,
  });
}

export function acknowledgeLastFmSyncPage(
  page: number
): Promise<{ state: RemoteSyncState }> {
  return invokeLastFm<{ state: RemoteSyncState }>({
    action: 'sync-ack',
    page,
  });
}
