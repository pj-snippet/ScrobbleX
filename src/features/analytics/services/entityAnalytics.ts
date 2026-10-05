import { Album, Artist, RankedEntityItem, Scrobble, Track } from '../../../types/music';
import {
  albumsMap,
  artistsMap,
  formatDateHuman,
  formatKnownListeningDuration,
  getKnownListeningDuration,
  REFERENCE_NOW_EPOCH,
  tracksMap,
} from './analyticsCore';
import { getTopAlbums, getTopTracks } from './listeningSummary';
import { buildLast12MonthsTimeline, MonthlyBucket } from './monthlyAnalytics';

export interface TrackDetailStats {
  track: Track;
  totalPlays: number;
  totalDurationFormatted: string;
  firstPlayedDate: string;
  lastPlayedDate: string;
  daysSinceLastPlay: number;
  peakMonthLabel: string;
  shareOfArtistPlaysPercent: number;
  monthlyTimeline: MonthlyBucket[];
  recentPlays: Scrobble[];
}

export function getTrackStatistics(scrobbles: Scrobble[], trackId: string): TrackDetailStats | null {
  const track = tracksMap.get(trackId);
  if (!track) return null;

  const trackScrobbles = scrobbles.filter((s) => s.trackId === trackId);
  const trackDuration = getKnownListeningDuration(trackScrobbles);
  const artistScrobblesCount = scrobbles.filter((s) => s.artistId === track.artistId).length;

  const monthlyTimeline = buildLast12MonthsTimeline(trackScrobbles);
  let peakMonthLabel = '—';
  let maxM = 0;
  for (const m of monthlyTimeline) {
    if (m.plays > maxM) {
      maxM = m.plays;
      peakMonthLabel = m.label;
    }
  }

  if (trackScrobbles.length === 0) {
    return {
      track,
      totalPlays: 0,
      totalDurationFormatted: '0m',
      firstPlayedDate: 'Never',
      lastPlayedDate: 'Never',
      daysSinceLastPlay: 0,
      peakMonthLabel: '—',
      shareOfArtistPlaysPercent: 0,
      monthlyTimeline,
      recentPlays: [],
    };
  }

  const sortedDesc = [...trackScrobbles].sort((a, b) => b.timestamp - a.timestamp);
  const firstTs = sortedDesc[sortedDesc.length - 1].timestamp;
  const lastTs = sortedDesc[0].timestamp;

  return {
    track,
    totalPlays: trackScrobbles.length,
    totalDurationFormatted: formatKnownListeningDuration(
      trackDuration.seconds,
      trackDuration.unknownScrobbles
    ),
    firstPlayedDate: formatDateHuman(new Date(firstTs * 1000).toISOString()),
    lastPlayedDate: formatDateHuman(new Date(lastTs * 1000).toISOString()),
    daysSinceLastPlay: Math.max(0, Math.floor((REFERENCE_NOW_EPOCH - lastTs) / 86400)),
    peakMonthLabel,
    shareOfArtistPlaysPercent:
      artistScrobblesCount > 0
        ? Number(((trackScrobbles.length / artistScrobblesCount) * 100).toFixed(1))
        : 100,
    monthlyTimeline,
    recentPlays: sortedDesc.slice(0, 12),
  };
}

export interface ArtistDetailStats {
  artist: Artist;
  totalPlays: number;
  totalDurationFormatted: string;
  firstListenedDate: string;
  lastListenedDate: string;
  peakMonthLabel: string;
  topTracks: RankedEntityItem[];
  topAlbums: RankedEntityItem[];
  monthlyTimeline: MonthlyBucket[];
  recentPlays: Scrobble[];
}

export function getArtistStatistics(scrobbles: Scrobble[], artistId: string): ArtistDetailStats | null {
  const artist = artistsMap.get(artistId);
  if (!artist) return null;

  const artScrobbles = scrobbles.filter((s) => s.artistId === artistId);
  const monthlyTimeline = buildLast12MonthsTimeline(artScrobbles);

  let peakMonthLabel = '—';
  let maxM = 0;
  for (const m of monthlyTimeline) {
    if (m.plays > maxM) {
      maxM = m.plays;
      peakMonthLabel = m.label;
    }
  }

  const sortedDesc = [...artScrobbles].sort((a, b) => b.timestamp - a.timestamp);
  const firstTs = sortedDesc.length > 0 ? sortedDesc[sortedDesc.length - 1].timestamp : 0;
  const lastTs = sortedDesc.length > 0 ? sortedDesc[0].timestamp : 0;
  const artDuration = getKnownListeningDuration(artScrobbles);

  return {
    artist,
    totalPlays: artScrobbles.length,
    totalDurationFormatted: formatKnownListeningDuration(
      artDuration.seconds,
      artDuration.unknownScrobbles
    ),
    firstListenedDate: firstTs ? formatDateHuman(new Date(firstTs * 1000).toISOString()) : 'Never',
    lastListenedDate: lastTs ? formatDateHuman(new Date(lastTs * 1000).toISOString()) : 'Never',
    peakMonthLabel,
    topTracks: getTopTracks(artScrobbles, 'all', 8),
    topAlbums: getTopAlbums(artScrobbles, 'all', 5),
    monthlyTimeline,
    recentPlays: sortedDesc.slice(0, 10),
  };
}

export interface AlbumDetailStats {
  album: Album;
  totalPlays: number;
  totalDurationFormatted: string;
  firstListenedDate: string;
  lastListenedDate: string;
  mostPlayedTrack: RankedEntityItem | null;
  tracks: RankedEntityItem[];
  monthlyTimeline: MonthlyBucket[];
}

export function getAlbumStatistics(scrobbles: Scrobble[], albumId: string): AlbumDetailStats | null {
  const album = albumsMap.get(albumId);
  if (!album) return null;

  const albScrobbles = scrobbles.filter((s) => s.albumId === albumId);
  const monthlyTimeline = buildLast12MonthsTimeline(albScrobbles);
  const sortedDesc = [...albScrobbles].sort((a, b) => b.timestamp - a.timestamp);
  const firstTs = sortedDesc.length > 0 ? sortedDesc[sortedDesc.length - 1].timestamp : 0;
  const lastTs = sortedDesc.length > 0 ? sortedDesc[0].timestamp : 0;
  const albumDuration = getKnownListeningDuration(albScrobbles);
  const topTracks = getTopTracks(albScrobbles, 'all', 12);

  return {
    album,
    totalPlays: albScrobbles.length,
    totalDurationFormatted: formatKnownListeningDuration(
      albumDuration.seconds,
      albumDuration.unknownScrobbles
    ),
    firstListenedDate: firstTs ? formatDateHuman(new Date(firstTs * 1000).toISOString()) : 'Never',
    lastListenedDate: lastTs ? formatDateHuman(new Date(lastTs * 1000).toISOString()) : 'Never',
    mostPlayedTrack: topTracks[0] || null,
    tracks: topTracks,
    monthlyTimeline,
  };
}

export interface LovedTrackEnriched {
  track: Track;
  plays: number;
  lastPlayedEpoch: number;
  lastPlayedFormatted: string;
  daysSinceLastPlay: number;
  lovedAtFormatted: string;
}

export interface LovedTracksReport {
  totalLovedTracks: number;
  totalLovedPlays: number;
  recentlyLoved: LovedTrackEnriched[];
  mostPlayedLoved: LovedTrackEnriched[];
  dormantSixMonths: LovedTrackEnriched[];
}

export function getLovedTracksAnalysis(
  scrobbles: Scrobble[],
  lovedTrackIds: Set<string>
): LovedTracksReport {
  const statsByTrack = new Map<string, { plays: number; lastTs: number }>();
  for (const s of scrobbles) {
    if (!lovedTrackIds.has(s.trackId)) continue;
    const cur = statsByTrack.get(s.trackId) || { plays: 0, lastTs: 0 };
    cur.plays += 1;
    if (s.timestamp > cur.lastTs) cur.lastTs = s.timestamp;
    statsByTrack.set(s.trackId, cur);
  }

  const enriched: LovedTrackEnriched[] = [];
  let totalLovedPlays = 0;

  lovedTrackIds.forEach((tid) => {
    const trk = tracksMap.get(tid);
    if (!trk) return;
    const st = statsByTrack.get(tid) || { plays: 0, lastTs: 0 };
    totalLovedPlays += st.plays;
    const daysSince = st.lastTs > 0 ? Math.floor((REFERENCE_NOW_EPOCH - st.lastTs) / 86400) : 999;

    enriched.push({
      track: trk,
      plays: st.plays,
      lastPlayedEpoch: st.lastTs,
      lastPlayedFormatted: st.lastTs > 0 ? formatDateHuman(new Date(st.lastTs * 1000).toISOString()) : 'Never',
      daysSinceLastPlay: daysSince,
      lovedAtFormatted: trk.lovedAt
        ? formatDateHuman(new Date(trk.lovedAt * 1000).toISOString())
        : '2025',
    });
  });

  const recentlyLoved = [...enriched].sort((a, b) => (b.track.lovedAt || 0) - (a.track.lovedAt || 0));
  const mostPlayedLoved = [...enriched].sort((a, b) => b.plays - a.plays);
  const dormantSixMonths = enriched
    .filter((item) => item.daysSinceLastPlay >= 180)
    .sort((a, b) => b.daysSinceLastPlay - a.daysSinceLastPlay);

  return {
    totalLovedTracks: enriched.length,
    totalLovedPlays,
    recentlyLoved,
    mostPlayedLoved,
    dormantSixMonths,
  };
}
