import { CalendarMetric, DailyActivitySummary, Scrobble } from '../../../types/music';
import {
  artistsMap,
  formatTimeUTC,
  getTrackDurationSec,
  tracksMap,
} from './analyticsCore';

export interface CalendarAnalysisResult {
  year: number;
  metric: CalendarMetric;
  days: DailyActivitySummary[];
  thresholds: [number, number, number, number];
  activeDaysCount: number;
  peakDay: DailyActivitySummary | null;
}

export function getDailyActivityCalendar(
  scrobbles: Scrobble[],
  year: number,
  metric: CalendarMetric
): CalendarAnalysisResult {
  const byDate = new Map<string, Scrobble[]>();
  for (const s of scrobbles) {
    if (s.year === year) {
      const list = byDate.get(s.dateKey) || [];
      list.push(s);
      byDate.set(s.dateKey, list);
    }
  }

  const startDate = new Date(Date.UTC(year, 0, 1));
  const currentYear = new Date().getUTCFullYear();
  const endDate =
    year === currentYear
      ? new Date(Date.UTC(currentYear, new Date().getUTCMonth(), new Date().getUTCDate()))
      : new Date(Date.UTC(year, 11, 31));

  const rawSummaries: DailyActivitySummary[] = [];
  const nonZeroValues: number[] = [];

  for (
    let dt = new Date(startDate);
    dt <= endDate;
    dt = new Date(dt.getTime() + 86400000)
  ) {
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    const dayScrobbles = byDate.get(dateKey) || [];

    if (dayScrobbles.length === 0) {
      rawSummaries.push({
        dateKey,
        timestamp: Math.floor(dt.getTime() / 1000),
        plays: 0,
        durationSec: 0,
        unknownDurationCount: 0,
        uniqueArtists: 0,
        uniqueAlbums: 0,
        uniqueTracks: 0,
        topArtist: null,
        topTrack: null,
        firstPlayTime: null,
        lastPlayTime: null,
        intensityLevel: 0,
      });
      continue;
    }

    let durationSec = 0;
    let unknownDurationCount = 0;
    const artistCounts = new Map<string, number>();
    const albumSet = new Set<string>();
    const trackCounts = new Map<string, number>();
    let minTs = dayScrobbles[0].timestamp;
    let maxTs = dayScrobbles[0].timestamp;

    for (const s of dayScrobbles) {
      const trackDurationSec = getTrackDurationSec(s);
      if (trackDurationSec === null) {
        unknownDurationCount += 1;
      } else {
        durationSec += trackDurationSec;
      }
      artistCounts.set(s.artistId, (artistCounts.get(s.artistId) || 0) + 1);
      if (s.albumId) albumSet.add(s.albumId);
      trackCounts.set(s.trackId, (trackCounts.get(s.trackId) || 0) + 1);
      if (s.timestamp < minTs) minTs = s.timestamp;
      if (s.timestamp > maxTs) maxTs = s.timestamp;
    }

    let topArtistId = '';
    let topArtistPlays = 0;
    artistCounts.forEach((cnt, aid) => {
      if (cnt > topArtistPlays) {
        topArtistPlays = cnt;
        topArtistId = aid;
      }
    });

    let topTrackId = '';
    let topTrackPlays = 0;
    trackCounts.forEach((cnt, tid) => {
      if (cnt > topTrackPlays) {
        topTrackPlays = cnt;
        topTrackId = tid;
      }
    });

    const topArtObj = artistsMap.get(topArtistId);
    const topTrkObj = tracksMap.get(topTrackId);

    const summary: DailyActivitySummary = {
      dateKey,
      timestamp: Math.floor(dt.getTime() / 1000),
      plays: dayScrobbles.length,
      durationSec,
      unknownDurationCount,
      uniqueArtists: artistCounts.size,
      uniqueAlbums: albumSet.size,
      uniqueTracks: trackCounts.size,
      topArtist: topArtObj ? { id: topArtistId, name: topArtObj.name, plays: topArtistPlays } : null,
      topTrack: topTrkObj
        ? {
            id: topTrackId,
            title: topTrkObj.title,
            artistName: topTrkObj.artistName,
            plays: topTrackPlays,
            artworkUrl: topTrkObj.artworkUrl,
          }
        : null,
      firstPlayTime: formatTimeUTC(minTs),
      lastPlayTime: formatTimeUTC(maxTs),
      intensityLevel: 1,
    };

    const metricVal =
      metric === 'plays'
        ? summary.plays
        : metric === 'duration'
        ? Math.round(summary.durationSec / 60)
        : metric === 'uniqueArtists'
        ? summary.uniqueArtists
        : summary.uniqueTracks;

    if (metricVal > 0) nonZeroValues.push(metricVal);
    rawSummaries.push(summary);
  }

  nonZeroValues.sort((a, b) => a - b);
  const pct = (p: number) => {
    if (nonZeroValues.length === 0) return 1;
    const idx = Math.min(nonZeroValues.length - 1, Math.floor(nonZeroValues.length * p));
    return Math.max(1, nonZeroValues[idx]);
  };

  const t1 = pct(0.1);
  const t2 = pct(0.4);
  const t3 = pct(0.72);
  const t4 = pct(0.92);

  let peakDay: DailyActivitySummary | null = null;
  let maxMetricVal = -1;

  for (const s of rawSummaries) {
    const val =
      metric === 'plays'
        ? s.plays
        : metric === 'duration'
        ? Math.round(s.durationSec / 60)
        : metric === 'uniqueArtists'
        ? s.uniqueArtists
        : s.uniqueTracks;

    if (val === 0) {
      s.intensityLevel = 0;
    } else if (val < t2) {
      s.intensityLevel = 1;
    } else if (val < t3) {
      s.intensityLevel = 2;
    } else if (val < t4) {
      s.intensityLevel = 3;
    } else {
      s.intensityLevel = 4;
    }

    if (val > maxMetricVal && val > 0) {
      maxMetricVal = val;
      peakDay = s;
    }
  }

  return {
    year,
    metric,
    days: rawSummaries,
    thresholds: [t1, t2, t3, t4],
    activeDaysCount: nonZeroValues.length,
    peakDay,
  };
}
