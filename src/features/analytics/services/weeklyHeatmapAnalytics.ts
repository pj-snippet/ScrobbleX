import { HeatmapGranularity, HeatmapMetric, Scrobble, TimeRangeFilter, WeeklyHeatmapCell } from '../../../types/music';
import {
  artistsMap,
  filterScrobblesByPeriod,
  formatDateHuman,
  getTrackDurationSec,
  REFERENCE_NOW_EPOCH,
  tracksMap,
} from './analyticsCore';

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface WeeklyHeatmapResult {
  cells: WeeklyHeatmapCell[];
  granularity: HeatmapGranularity;
  metric: HeatmapMetric;
  busiestDay: string;
  busiestWindowLabel: string;
  quietestWindowLabel: string;
  eveningSharePercent: number;
  weekendVsWeekdayRatio: number;
  dateRangeLabel: string;
}

export function getWeeklyListeningHeatmap(
  scrobbles: Scrobble[],
  period: TimeRangeFilter,
  granularity: HeatmapGranularity,
  metric: HeatmapMetric
): WeeklyHeatmapResult {
  const filtered = filterScrobblesByPeriod(scrobbles, period);
  const bucketsPerDay = 24 / granularity;
  const cells: WeeklyHeatmapCell[] = [];

  const bucketScrobbles = new Map<string, Scrobble[]>();
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  let eveningPlays = 0;

  let minTs = filtered.length > 0 ? filtered[0].timestamp : REFERENCE_NOW_EPOCH;
  let maxTs = filtered.length > 0 ? filtered[0].timestamp : REFERENCE_NOW_EPOCH;

  for (const s of filtered) {
    const bIdx = Math.floor(s.hourOfDay / granularity);
    const key = `${s.dayOfWeek}_${bIdx}`;
    const list = bucketScrobbles.get(key) || [];
    list.push(s);
    bucketScrobbles.set(key, list);
    dayTotals[s.dayOfWeek] += 1;
    if (s.hourOfDay >= 19 && s.hourOfDay < 22) {
      eveningPlays += 1;
    }
    if (s.timestamp < minTs) minTs = s.timestamp;
    if (s.timestamp > maxTs) maxTs = s.timestamp;
  }

  let maxCellMetric = 1;
  let busiestCell: WeeklyHeatmapCell | null = null;
  let quietestCell: WeeklyHeatmapCell | null = null;

  for (let dow = 0; dow < 7; dow++) {
    for (let b = 0; b < bucketsPerDay; b++) {
      const startHour = b * granularity;
      const endHour = startHour + granularity;
      const key = `${dow}_${b}`;
      const list = bucketScrobbles.get(key) || [];

      let durationSec = 0;
      let unknownDurationCount = 0;
      const trackCounts = new Map<string, number>();
      const artistCounts = new Map<string, number>();

      for (const s of list) {
        const trackDurationSec = getTrackDurationSec(s);
        if (trackDurationSec === null) {
          unknownDurationCount += 1;
        } else {
          durationSec += trackDurationSec;
        }
        trackCounts.set(s.trackId, (trackCounts.get(s.trackId) || 0) + 1);
        artistCounts.set(s.artistId, (artistCounts.get(s.artistId) || 0) + 1);
      }

      const topArtists = Array.from(artistCounts.entries())
        .sort((x, y) => y[1] - x[1])
        .slice(0, 3)
        .map(([id, plays]) => ({ id, name: artistsMap.get(id)?.name || id, plays }));

      const topTracks = Array.from(trackCounts.entries())
        .sort((x, y) => y[1] - x[1])
        .slice(0, 3)
        .map(([id, plays]) => {
          const t = tracksMap.get(id);
          return {
            id,
            title: t?.title || id,
            artistName: t?.artistName || '',
            plays,
          };
        });

      const cell: WeeklyHeatmapCell = {
        dayOfWeek: dow,
        dayName: DAY_NAMES[dow],
        startHour,
        endHour,
        label: `${String(startHour).padStart(2, '0')}:00–${String(endHour).padStart(2, '0')}:00`,
        plays: list.length,
        durationSec,
        unknownDurationCount,
        uniqueTracks: trackCounts.size,
        intensity: 0,
        topArtists,
        topTracks,
      };

      const val =
        metric === 'plays'
          ? cell.plays
          : metric === 'duration'
          ? cell.durationSec
          : cell.uniqueTracks;

      if (val > maxCellMetric) maxCellMetric = val;
      if (!busiestCell || val > (metric === 'plays' ? busiestCell.plays : metric === 'duration' ? busiestCell.durationSec : busiestCell.uniqueTracks)) {
        busiestCell = cell;
      }
      if (!quietestCell || (val > 0 && val < (metric === 'plays' ? quietestCell.plays : metric === 'duration' ? quietestCell.durationSec : quietestCell.uniqueTracks))) {
        quietestCell = cell;
      }

      cells.push(cell);
    }
  }

  for (const c of cells) {
    const val =
      metric === 'plays'
        ? c.plays
        : metric === 'duration'
        ? c.durationSec
        : c.uniqueTracks;
    c.intensity = val === 0 ? 0 : Math.max(0.12, Number((val / maxCellMetric).toFixed(2)));
  }

  let busiestDow = 0;
  for (let i = 1; i < 7; i++) {
    if (dayTotals[i] > dayTotals[busiestDow]) busiestDow = i;
  }

  const weekdayAvg = (dayTotals[0] + dayTotals[1] + dayTotals[2] + dayTotals[3] + dayTotals[4]) / 5;
  const weekendAvg = (dayTotals[5] + dayTotals[6]) / 2;
  const weekendVsWeekdayRatio = weekdayAvg > 0 ? Number((weekendAvg / weekdayAvg).toFixed(2)) : 1;

  const dateRangeLabel =
    filtered.length > 0
      ? `${formatDateHuman(new Date(minTs * 1000).toISOString())} – ${formatDateHuman(new Date(maxTs * 1000).toISOString())}`
      : 'No data in range';

  return {
    cells,
    granularity,
    metric,
    busiestDay: DAY_NAMES[busiestDow],
    busiestWindowLabel: busiestCell ? `${busiestCell.dayName} ${busiestCell.label}` : '—',
    quietestWindowLabel: quietestCell ? `${quietestCell.dayName} ${quietestCell.label}` : '03:00–06:00',
    eveningSharePercent:
      filtered.length > 0 ? Number(((eveningPlays / filtered.length) * 100).toFixed(1)) : 0,
    weekendVsWeekdayRatio,
    dateRangeLabel,
  };
}
