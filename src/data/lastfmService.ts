import { Album, Artist, Scrobble, Track, UserProfile } from '../types/music';
import { dbSaveBatch } from './indexedDb';
import { registerEntities } from '../domain/analyticsEngine';

export interface SyncProgressInfo {
  page: number;
  totalPages: number;
  importedCount: number;
  currentTrackName?: string;
  statusText: string;
}

export async function getLastFmAuthUrl(callbackUrl?: string): Promise<string> {
  const cb = callbackUrl || `${window.location.origin}/?lastfm_callback=1`;
  const res = await fetch(`/api/lastfm/auth-url?callback=${encodeURIComponent(cb)}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve Last.fm authorization link.');
  }
  const data = await res.json();
  return data.authUrl;
}

export async function exchangeSessionToken(token: string): Promise<{
  username: string;
  userProfile: UserProfile;
}> {
  const res = await fetch('/api/lastfm/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Last.fm authorization failed.');
  }

  return {
    username: data.session.username,
    userProfile: data.userProfile,
  };
}

export async function connectLastFmUsername(username: string): Promise<UserProfile> {
  const res = await fetch('/api/lastfm/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim() }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to connect Last.fm user "${username}".`);
  }

  return data.userProfile;
}

export async function syncLastFmScrobbles(
  username: string,
  options: {
    fromTimestamp?: number;
    maxPages?: number;
    onProgress?: (info: SyncProgressInfo) => void;
  } = {}
): Promise<{
  importedCount: number;
  latestTimestamp: number | null;
  earliestTimestamp: number | null;
}> {
  const { fromTimestamp, maxPages = 50, onProgress } = options;
  let currentPage = 1;
  let totalPages = 1;
  let totalImported = 0;
  let latestTimestamp: number | null = null;
  let earliestTimestamp: number | null = null;

  while (currentPage <= totalPages && currentPage <= maxPages) {
    const params = new URLSearchParams({
      username,
      page: currentPage.toString(),
      limit: '200',
    });

    if (fromTimestamp && fromTimestamp > 0) {
      params.set('from', (fromTimestamp + 1).toString());
    }

    onProgress?.({
      page: currentPage,
      totalPages: Math.max(totalPages, 1),
      importedCount: totalImported,
      statusText: `Fetching page ${currentPage} of ${totalPages || '...' }`,
    });

    const res = await fetch(`/api/lastfm/recent-tracks?${params.toString()}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed fetching scrobbles on page ${currentPage}`);
    }

    const data: {
      scrobbles: Scrobble[];
      artists: Artist[];
      albums: Album[];
      tracks: Track[];
      pagination: { page: number; totalPages: number; total: number; perPage: number };
    } = await res.json();

    totalPages = data.pagination.totalPages;

    if (data.scrobbles && data.scrobbles.length > 0) {
      // Register entities in memory
      registerEntities({
        artists: data.artists,
        albums: data.albums,
        tracks: data.tracks,
      });

      // Save batch to IndexedDB
      await dbSaveBatch(data.scrobbles, data.artists, data.albums, data.tracks);

      totalImported += data.scrobbles.length;

      // Track latest and earliest timestamps
      for (const scrobble of data.scrobbles) {
        if (!latestTimestamp || scrobble.timestamp > latestTimestamp) {
          latestTimestamp = scrobble.timestamp;
        }
        if (!earliestTimestamp || scrobble.timestamp < earliestTimestamp) {
          earliestTimestamp = scrobble.timestamp;
        }
      }

      onProgress?.({
        page: currentPage,
        totalPages,
        importedCount: totalImported,
        currentTrackName: data.tracks[0]?.title,
        statusText: `Imported ${totalImported.toLocaleString()} scrobbles...`,
      });
    } else {
      // No more scrobbles found
      break;
    }

    currentPage++;

    // Polite 100ms pause between page fetches to comply with rate limits
    if (currentPage <= totalPages) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    importedCount: totalImported,
    latestTimestamp,
    earliestTimestamp,
  };
}

export async function syncLovedTracks(username: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/lastfm/loved-tracks?username=${encodeURIComponent(username)}&limit=100`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.lovedTrackIds || [];
  } catch (err) {
    console.warn('Could not sync loved tracks:', err);
    return [];
  }
}
