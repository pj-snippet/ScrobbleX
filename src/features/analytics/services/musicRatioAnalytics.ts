import { Scrobble, TimeRangeFilter } from '../../../types/music';
import { filterScrobblesByPeriod, REFERENCE_NOW_EPOCH } from './analyticsCore';

// ============================================================================
// 1. MUSIC RATIO (Tracks, Albums, Artists diversity & period comparison)
// ============================================================================

export interface MusicRatioMetric {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
}

export interface MusicRatioReport {
  period: TimeRangeFilter;
  periodLabel: string;
  previousPeriodLabel: string;
  tracks: MusicRatioMetric;
  albums: MusicRatioMetric;
  artists: MusicRatioMetric;
  tracksPerArtist: number;
  albumsPerArtist: number;
  tracksPerAlbum: number;
  diversityIndex: number;
  summaryStatement: string;
}

export function getMusicRatio(
  scrobbles: Scrobble[],
  period: TimeRangeFilter = '30d'
): MusicRatioReport {
  const currentScrobbles = filterScrobblesByPeriod(scrobbles, period);

  // Determine equivalent previous period
  const daysMap: Record<Exclude<TimeRangeFilter, 'all'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '6m': 182,
    '12m': 365,
  };

  let prevScrobbles: Scrobble[] = [];
  let periodLabel = 'Last 30 Days';
  let previousPeriodLabel = 'Prior 30 Days';

  if (period === 'all') {
    periodLabel = 'All-Time';
    previousPeriodLabel = 'First Half of History';
    const half = Math.floor(scrobbles.length / 2);
    prevScrobbles = scrobbles.slice(half);
  } else {
    const days = daysMap[period];
    const curCutoff = REFERENCE_NOW_EPOCH - days * 86400;
    const prevCutoff = REFERENCE_NOW_EPOCH - days * 2 * 86400;
    prevScrobbles = scrobbles.filter((s) => s.timestamp >= prevCutoff && s.timestamp < curCutoff);

    const labels: Record<string, { cur: string; prev: string }> = {
      '7d': { cur: 'Last 7 Days', prev: 'Prior 7 Days' },
      '30d': { cur: 'Last 30 Days', prev: 'Prior 30 Days' },
      '90d': { cur: 'Last 90 Days', prev: 'Prior 90 Days' },
      '6m': { cur: 'Last 6 Months', prev: 'Prior 6 Months' },
      '12m': { cur: 'Last 12 Months', prev: 'Prior Year' },
    };
    periodLabel = labels[period].cur;
    previousPeriodLabel = labels[period].prev;
  }

  // Count uniques
  const curTrackSet = new Set(currentScrobbles.map((s) => s.trackId));
  const curAlbumSet = new Set(currentScrobbles.map((s) => s.albumId));
  const curArtistSet = new Set(currentScrobbles.map((s) => s.artistId));

  const prevTrackSet = new Set(prevScrobbles.map((s) => s.trackId));
  const prevAlbumSet = new Set(prevScrobbles.map((s) => s.albumId));
  const prevArtistSet = new Set(prevScrobbles.map((s) => s.artistId));

  const buildMetric = (cur: number, prev: number): MusicRatioMetric => {
    const delta = cur - prev;
    const deltaPercent = prev > 0 ? Number(((delta / prev) * 100).toFixed(1)) : 0;
    return { current: cur, previous: prev, delta, deltaPercent };
  };

  const tracksMetric = buildMetric(curTrackSet.size, prevTrackSet.size);
  const albumsMetric = buildMetric(curAlbumSet.size, prevAlbumSet.size);
  const artistsMetric = buildMetric(curArtistSet.size, prevArtistSet.size);

  const tracksPerArtist = curArtistSet.size > 0 ? Number((curTrackSet.size / curArtistSet.size).toFixed(2)) : 0;
  const albumsPerArtist = curArtistSet.size > 0 ? Number((curAlbumSet.size / curArtistSet.size).toFixed(2)) : 0;
  const tracksPerAlbum = curAlbumSet.size > 0 ? Number((curTrackSet.size / curAlbumSet.size).toFixed(2)) : 0;

  // Diversity index: balance between artists, albums, tracks
  const diversityRatio = curArtistSet.size > 0 ? curTrackSet.size / (curArtistSet.size * 3) : 0;
  const diversityIndex = Math.max(10, Math.min(99, Math.round(100 / (1 + Math.abs(diversityRatio - 1)))));

  let summaryStatement = 'Balanced catalog exploration across tracks and artists.';
  if (tracksPerArtist > 2.5) {
    summaryStatement = 'Deep artist loyalty: you explore extensive album catalogues per artist.';
  } else if (tracksPerArtist < 1.3) {
    summaryStatement = 'High artist breadth: you explore single tracks across many distinct creators.';
  }

  return {
    period,
    periodLabel,
    previousPeriodLabel,
    tracks: tracksMetric,
    albums: albumsMetric,
    artists: artistsMetric,
    tracksPerArtist,
    albumsPerArtist,
    tracksPerAlbum,
    diversityIndex,
    summaryStatement,
  };
}
