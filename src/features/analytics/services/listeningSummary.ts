import { RankedEntityItem, Scrobble, TimeRangeFilter } from '../../../types/music';
import {
  albumsMap,
  artistsMap,
  filterScrobblesByPeriod,
  formatKnownListeningDuration,
  getKnownListeningDuration,
  getTrackDurationSec,
  tracksMap,
} from './analyticsCore';

export interface OverviewSummaryMetrics {
  totalScrobbles: number;
  dailyAverage: number;
  totalDurationSec: number;
  knownDurationScrobbles: number;
  unknownDurationScrobbles: number;
  listeningTimeFormatted: string;
  currentStreakDays: number;
  longestStreakDays: number;
  totalArtists: number;
  totalAlbums: number;
  totalTracks: number;
}

export function getOverviewSummary(
  scrobbles: Scrobble[],
  period: TimeRangeFilter = 'all'
): OverviewSummaryMetrics {
  const filtered = filterScrobblesByPeriod(scrobbles, period);
  if (filtered.length === 0) {
    return {
      totalScrobbles: 0,
      dailyAverage: 0,
      totalDurationSec: 0,
      knownDurationScrobbles: 0,
      unknownDurationScrobbles: 0,
      listeningTimeFormatted: '—',
      currentStreakDays: 0,
      longestStreakDays: 0,
      totalArtists: 0,
      totalAlbums: 0,
      totalTracks: 0,
    };
  }

  const artistSet = new Set<string>();
  const albumSet = new Set<string>();
  const trackSet = new Set<string>();
  let minTs = filtered[0].timestamp;
  let maxTs = filtered[0].timestamp;

  for (const s of filtered) {
    artistSet.add(s.artistId);
    albumSet.add(s.albumId);
    trackSet.add(s.trackId);
    if (s.timestamp < minTs) minTs = s.timestamp;
    if (s.timestamp > maxTs) maxTs = s.timestamp;
  }

  const spanDays = Math.max(1, Math.ceil((maxTs - minTs) / 86400));
  const dailyAverage = Math.round(filtered.length / spanDays);
  const durationSummary = getKnownListeningDuration(filtered);
  const totalDurationSec = durationSummary.seconds;

  const allDates = Array.from(new Set(scrobbles.map((s) => s.dateKey))).sort().reverse();
  let currentStreakDays = 0;
  let longestStreakDays = 0;

  if (allDates.length > 0) {
    let streak = 1;
    let maxStreak = 1;
    for (let i = 0; i < allDates.length - 1; i++) {
      const d1 = new Date(`${allDates[i]}T00:00:00Z`).getTime();
      const d2 = new Date(`${allDates[i + 1]}T00:00:00Z`).getTime();
      const diffDays = Math.round((d1 - d2) / 86400000);
      if (diffDays === 1) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        if (currentStreakDays === 0) currentStreakDays = streak;
        streak = 1;
      }
    }
    if (currentStreakDays === 0) currentStreakDays = streak;
    longestStreakDays = maxStreak;
  }

  return {
    totalScrobbles: filtered.length,
    dailyAverage,
    totalDurationSec,
    knownDurationScrobbles: durationSummary.knownScrobbles,
    unknownDurationScrobbles: durationSummary.unknownScrobbles,
    listeningTimeFormatted: formatKnownListeningDuration(
      durationSummary.seconds,
      durationSummary.unknownScrobbles
    ),
    currentStreakDays,
    longestStreakDays,
    totalArtists: artistSet.size,
    totalAlbums: albumSet.size,
    totalTracks: trackSet.size,
  };
}

export function getTopArtists(
  scrobbles: Scrobble[],
  period: TimeRangeFilter,
  limit = 10
): RankedEntityItem[] {
  const filtered = filterScrobblesByPeriod(scrobbles, period);
  if (filtered.length === 0) return [];

  const counts = new Map<string, { plays: number; durationSec: number }>();
  for (const s of filtered) {
    const cur = counts.get(s.artistId) || { plays: 0, durationSec: 0 };
    cur.plays += 1;
    cur.durationSec += getTrackDurationSec(s) ?? 0;
    counts.set(s.artistId, cur);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1].plays - a[1].plays);
  return sorted.slice(0, limit).map(([artistId, stats], idx) => {
    const artist = artistsMap.get(artistId);
    return {
      id: artistId,
      name: artist?.name || artistId,
      subtitle: artist?.primaryGenre || 'Artist',
      artworkUrl: artist?.artworkUrl || '',
      plays: stats.plays,
      durationSec: stats.durationSec,
      sharePercent: Number(((stats.plays / filtered.length) * 100).toFixed(1)),
      rank: idx + 1,
    };
  });
}

export function getTopTracks(
  scrobbles: Scrobble[],
  period: TimeRangeFilter,
  limit = 10
): RankedEntityItem[] {
  const filtered = filterScrobblesByPeriod(scrobbles, period);
  if (filtered.length === 0) return [];

  const counts = new Map<string, { plays: number; durationSec: number }>();
  for (const s of filtered) {
    const cur = counts.get(s.trackId) || { plays: 0, durationSec: 0 };
    cur.plays += 1;
    cur.durationSec += getTrackDurationSec(s) ?? 0;
    counts.set(s.trackId, cur);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1].plays - a[1].plays);
  return sorted.slice(0, limit).map(([trackId, stats], idx) => {
    const track = tracksMap.get(trackId);
    return {
      id: trackId,
      name: track?.title || trackId,
      subtitle: track?.artistName || '',
      artworkUrl: track?.artworkUrl || '',
      plays: stats.plays,
      durationSec: stats.durationSec,
      sharePercent: Number(((stats.plays / filtered.length) * 100).toFixed(1)),
      rank: idx + 1,
    };
  });
}

export function getTopAlbums(
  scrobbles: Scrobble[],
  period: TimeRangeFilter,
  limit = 10
): RankedEntityItem[] {
  const filtered = filterScrobblesByPeriod(scrobbles, period);
  if (filtered.length === 0) return [];

  const counts = new Map<string, { plays: number; durationSec: number }>();
  for (const s of filtered) {
    const cur = counts.get(s.albumId) || { plays: 0, durationSec: 0 };
    cur.plays += 1;
    cur.durationSec += getTrackDurationSec(s) ?? 0;
    counts.set(s.albumId, cur);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1].plays - a[1].plays);
  return sorted.slice(0, limit).map(([albumId, stats], idx) => {
    const album = albumsMap.get(albumId);
    return {
      id: albumId,
      name: album?.title || albumId,
      subtitle: album?.artistName || '',
      artworkUrl: album?.artworkUrl || '',
      plays: stats.plays,
      durationSec: stats.durationSec,
      sharePercent: Number(((stats.plays / filtered.length) * 100).toFixed(1)),
      rank: idx + 1,
    };
  });
}
