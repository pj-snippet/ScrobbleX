import { ALBUMS_CATALOG, ARTISTS_CATALOG, TRACKS_CATALOG } from '../../../data/catalog/musicCatalog';
import { Album, Artist, Scrobble, TimeRangeFilter, Track } from '../../../types/music';

export const artistsMap = new Map<string, Artist>(ARTISTS_CATALOG.map((a) => [a.id, a]));
export const albumsMap = new Map<string, Album>(ALBUMS_CATALOG.map((a) => [a.id, a]));
export const tracksMap = new Map<string, Track>(TRACKS_CATALOG.map((t) => [t.id, t]));

export const REFERENCE_NOW_EPOCH = Math.floor(Date.now() / 1000);

export function registerScrobbleMetadata(scrobbles: Scrobble[]): void {
  for (const scrobble of scrobbles) {
    if (!scrobble.artistName || !scrobble.trackName) continue;
    artistsMap.set(scrobble.artistId, {
      id: scrobble.artistId,
      name: scrobble.artistName,
      artworkUrl: scrobble.artworkUrl || '',
      primaryGenre: '',
    });
    const knownTrack = tracksMap.get(scrobble.trackId);
    tracksMap.set(scrobble.trackId, {
      id: scrobble.trackId,
      title: scrobble.trackName,
      artistId: scrobble.artistId,
      artistName: scrobble.artistName,
      albumId: scrobble.albumId,
      albumTitle: scrobble.albumName || '',
      artworkUrl: scrobble.artworkUrl || '',
      durationSec: knownTrack?.durationSec ?? scrobble.durationSec ?? null,
      loved: scrobble.loved,
    });
    if (scrobble.albumId && scrobble.albumName) {
      albumsMap.set(scrobble.albumId, {
        id: scrobble.albumId,
        title: scrobble.albumName,
        artistId: scrobble.artistId,
        artistName: scrobble.artistName,
        artworkUrl: scrobble.artworkUrl || '',
        releaseYear: 0,
      });
    }

  }
}

export function registerTrackMetadata(track: Track): void {
  const existing = tracksMap.get(track.id);
  tracksMap.set(track.id, {
    ...track,
    durationSec: track.durationSec ?? existing?.durationSec ?? null,
  });
  if (!artistsMap.has(track.artistId)) {
    artistsMap.set(track.artistId, {
      id: track.artistId,
      name: track.artistName,
      artworkUrl: track.artworkUrl,
      primaryGenre: '',
    });
  }
  if (track.albumId && !albumsMap.has(track.albumId)) {
    albumsMap.set(track.albumId, {
      id: track.albumId,
      title: track.albumTitle,
      artistId: track.artistId,
      artistName: track.artistName,
      artworkUrl: track.artworkUrl,
      releaseYear: 0,
    });
  }
}

export function getArtistById(id: string): Artist | undefined {
  return artistsMap.get(id);
}

export function getAllArtists(): Artist[] {
  return Array.from(artistsMap.values());
}

export function getAlbumById(id: string): Album | undefined {
  return albumsMap.get(id);
}

export function getAllAlbums(): Album[] {
  return Array.from(albumsMap.values());
}

export function getTrackById(id: string): Track | undefined {
  return tracksMap.get(id);
}

export function getAllTracks(): Track[] {
  return Array.from(tracksMap.values());
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Unknown';
  if (seconds <= 0) return '0m';
  if (seconds < 60) return '<1m';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  return `${hours.toLocaleString()}h ${mins}m`;
}

export function getTrackDurationSec(scrobble: Scrobble): number | null {
  const canonicalDuration = tracksMap.get(scrobble.trackId)?.durationSec;
  if (canonicalDuration !== undefined && canonicalDuration !== null && canonicalDuration > 0) {
    return canonicalDuration;
  }
  return scrobble.durationSec !== null && scrobble.durationSec > 0
    ? scrobble.durationSec
    : null;
}

export function getKnownListeningDuration(scrobbles: Scrobble[]): {
  seconds: number;
  knownScrobbles: number;
  unknownScrobbles: number;
} {
  let seconds = 0;
  let knownScrobbles = 0;
  let unknownScrobbles = 0;
  for (const scrobble of scrobbles) {
    const durationSec = getTrackDurationSec(scrobble);
    if (durationSec === null) {
      unknownScrobbles += 1;
    } else {
      seconds += durationSec;
      knownScrobbles += 1;
    }
  }
  return { seconds, knownScrobbles, unknownScrobbles };
}

export function formatKnownListeningDuration(
  seconds: number,
  unknownScrobbles: number
): string {
  if (unknownScrobbles === 0) return formatDuration(seconds);
  const unknownLabel = `${unknownScrobbles.toLocaleString()} ${
    unknownScrobbles === 1 ? 'play' : 'plays'
  } unknown`;
  return seconds > 0
    ? `${formatDuration(seconds)} known · ${unknownLabel}`
    : `Unknown (${unknownLabel})`;
}

export function formatDateHuman(dateKeyOrIso: string): string {
  if (!dateKeyOrIso) return '—';
  const parts = dateKeyOrIso.slice(0, 10).split('-');
  if (parts.length !== 3) return dateKeyOrIso;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  const dt = new Date(Date.UTC(y, m, d));
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateLong(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const dt = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return dt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatTimeUTC(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

export function formatRelativeTime(epochSec: number): string {
  const diff = Math.max(0, REFERENCE_NOW_EPOCH - epochSec);
  if (diff < 120) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return formatDateHuman(new Date(epochSec * 1000).toISOString());
}

export function filterScrobblesByPeriod(
  scrobbles: Scrobble[],
  period: TimeRangeFilter
): Scrobble[] {
  if (period === 'all') return scrobbles;
  const daysMap: Record<Exclude<TimeRangeFilter, 'all'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '6m': 182,
    '12m': 365,
  };
  const cutoff = REFERENCE_NOW_EPOCH - daysMap[period] * 86400;
  return scrobbles.filter((s) => s.timestamp >= cutoff);
}
