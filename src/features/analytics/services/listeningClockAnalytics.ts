import { Scrobble, TimeRangeFilter } from '../../../types/music';
import {
  artistsMap,
  filterScrobblesByPeriod,
  formatKnownListeningDuration,
  getTrackDurationSec,
  tracksMap,
} from './analyticsCore';

// ============================================================================
// 4. LISTENING CLOCK (Circular 24-Hour Interactive Visualization)
// ============================================================================

export interface HourClockItem {
  hour: number;
  hourLabel: string;
  scrobblesCount: number;
  durationSec: number;
  unknownDurationCount: number;
  durationFormatted: string;
  uniqueTracks: number;
  topArtist: { id: string; name: string; plays: number } | null;
  topTrack: { id: string; title: string; artistName: string; plays: number } | null;
  intensityPercent: number;
}

export interface ListeningClockReport {
  period: TimeRangeFilter;
  metric: 'plays' | 'duration';
  hours: HourClockItem[];
  busiestHour: HourClockItem;
  quietestHour: HourClockItem;
  busiestWindowLabel: string;
  quietestPeriodLabel: string;
  circadianSummary: string;
  eveningListeningRatio: number;
  nightListeningRatio: number;
  morningListeningRatio: number;
  afternoonListeningRatio: number;
}

export function getListeningClock(
  scrobbles: Scrobble[],
  period: TimeRangeFilter = '30d',
  metric: 'plays' | 'duration' = 'plays',
  useLocalTz = true
): ListeningClockReport {
  const filtered = filterScrobblesByPeriod(scrobbles, period);

  // 24 hours buckets
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    hourLabel: h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`,
    scrobblesCount: 0,
    durationSec: 0,
    unknownDurationCount: 0,
    trackCounts: new Map<string, number>(),
    artistCounts: new Map<string, number>(),
  }));

  for (const s of filtered) {
    const dt = new Date(s.timestamp * 1000);
    const hour = useLocalTz ? dt.getHours() : dt.getUTCHours();
    const b = hourBuckets[hour];
    b.scrobblesCount += 1;
    const trackDurationSec = getTrackDurationSec(s);
    if (trackDurationSec === null) {
      b.unknownDurationCount += 1;
    } else {
      b.durationSec += trackDurationSec;
    }
    b.trackCounts.set(s.trackId, (b.trackCounts.get(s.trackId) || 0) + 1);
    b.artistCounts.set(s.artistId, (b.artistCounts.get(s.artistId) || 0) + 1);
  }

  const maxVal = Math.max(
    ...hourBuckets.map((b) => (metric === 'plays' ? b.scrobblesCount : b.durationSec)),
    1
  );

  const hours: HourClockItem[] = hourBuckets.map((b) => {
    const val = metric === 'plays' ? b.scrobblesCount : b.durationSec;
    const intensityPercent = Math.round((val / maxVal) * 100);

    let topArtist: HourClockItem['topArtist'] = null;
    if (b.artistCounts.size > 0) {
      const [artId, plays] = Array.from(b.artistCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const a = artistsMap.get(artId);
      if (a) topArtist = { id: a.id, name: a.name, plays };
    }

    let topTrack: HourClockItem['topTrack'] = null;
    if (b.trackCounts.size > 0) {
      const [trkId, plays] = Array.from(b.trackCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const t = tracksMap.get(trkId);
      if (t) topTrack = { id: t.id, title: t.title, artistName: t.artistName, plays };
    }

    return {
      hour: b.hour,
      hourLabel: b.hourLabel,
      scrobblesCount: b.scrobblesCount,
      durationSec: b.durationSec,
      unknownDurationCount: b.unknownDurationCount,
      durationFormatted: formatKnownListeningDuration(
        b.durationSec,
        b.unknownDurationCount
      ),
      uniqueTracks: b.trackCounts.size,
      topArtist,
      topTrack,
      intensityPercent,
    };
  });

  const busiestHour = [...hours].sort((a, b) => b.scrobblesCount - a.scrobblesCount)[0] || hours[18];
  const quietestHour = [...hours].sort((a, b) => a.scrobblesCount - b.scrobblesCount)[0] || hours[4];

  // Calculate day parts
  const nightPlays = hours.slice(0, 6).reduce((a, b) => a + b.scrobblesCount, 0); // 12 AM - 6 AM
  const morningPlays = hours.slice(6, 12).reduce((a, b) => a + b.scrobblesCount, 0); // 6 AM - 12 PM
  const afternoonPlays = hours.slice(12, 18).reduce((a, b) => a + b.scrobblesCount, 0); // 12 PM - 6 PM
  const eveningPlays = hours.slice(18, 24).reduce((a, b) => a + b.scrobblesCount, 0); // 6 PM - 12 AM

  const total = filtered.length || 1;
  const eveningListeningRatio = Number(((eveningPlays / total) * 100).toFixed(1));
  const nightListeningRatio = Number(((nightPlays / total) * 100).toFixed(1));
  const morningListeningRatio = Number(((morningPlays / total) * 100).toFixed(1));
  const afternoonListeningRatio = Number(((afternoonPlays / total) * 100).toFixed(1));

  const circadianSummary =
    eveningListeningRatio > 40
      ? `Evening-dominant: ${eveningListeningRatio}% of your listening occurs between 6 PM and midnight.`
      : morningListeningRatio > 35
      ? `Morning-focused: ${morningListeningRatio}% of listening occurs between 6 AM and noon.`
      : 'Even circadian distribution throughout daylight and evening hours.';

  return {
    period,
    metric,
    hours,
    busiestHour,
    quietestHour,
    busiestWindowLabel: `${busiestHour.hourLabel} (${busiestHour.scrobblesCount} scrobbles)`,
    quietestPeriodLabel: '03:00–06:00 AM',
    circadianSummary,
    eveningListeningRatio,
    nightListeningRatio,
    morningListeningRatio,
    afternoonListeningRatio,
  };
}
