import { Scrobble, TimelineComparisonItem } from '../../../types/music';
import { albumsMap, artistsMap, tracksMap } from './analyticsCore';

export type TimelinePeriodPreset = 'q1_vs_q3_2026' | 'q2_vs_q3_2026' | 'aug_vs_sep_2026';

export interface TimelineComparisonReport {
  preset: TimelinePeriodPreset;
  periodALabel: string;
  periodBLabel: string;
  entityType: 'artists' | 'tracks' | 'albums';
  periodATotalPlays: number;
  periodBTotalPlays: number;
  rose: TimelineComparisonItem[];
  fell: TimelineComparisonItem[];
  newEntries: TimelineComparisonItem[];
  droppedEntries: TimelineComparisonItem[];
  allItems: TimelineComparisonItem[];
}

export function getTimelineComparison(
  scrobbles: Scrobble[],
  preset: TimelinePeriodPreset,
  entityType: 'artists' | 'tracks' | 'albums'
): TimelineComparisonReport {
  const utcSec = (y: number, m: number, d: number, h = 0) =>
    Math.floor(Date.UTC(y, m - 1, d, h, 0, 0) / 1000);

  let aStart = utcSec(2026, 1, 1);
  let aEnd = utcSec(2026, 3, 31, 23);
  let bStart = utcSec(2026, 7, 1);
  let bEnd = utcSec(2026, 9, 30, 23);
  let periodALabel = 'January–March 2026';
  let periodBLabel = 'July–September 2026';

  if (preset === 'q2_vs_q3_2026') {
    aStart = utcSec(2026, 4, 1);
    aEnd = utcSec(2026, 6, 30, 23);
    bStart = utcSec(2026, 7, 1);
    bEnd = utcSec(2026, 9, 30, 23);
    periodALabel = 'April–June 2026';
    periodBLabel = 'July–September 2026';
  } else if (preset === 'aug_vs_sep_2026') {
    aStart = utcSec(2026, 8, 1);
    aEnd = utcSec(2026, 8, 31, 23);
    bStart = utcSec(2026, 9, 1);
    bEnd = utcSec(2026, 9, 30, 23);
    periodALabel = 'August 2026';
    periodBLabel = 'September 2026';
  }

  const countsA = new Map<string, number>();
  const countsB = new Map<string, number>();
  let periodATotalPlays = 0;
  let periodBTotalPlays = 0;

  const getKey = (s: Scrobble) =>
    entityType === 'artists' ? s.artistId : entityType === 'tracks' ? s.trackId : s.albumId;

  for (const s of scrobbles) {
    const k = getKey(s);
    if (s.timestamp >= aStart && s.timestamp <= aEnd) {
      countsA.set(k, (countsA.get(k) || 0) + 1);
      periodATotalPlays++;
    } else if (s.timestamp >= bStart && s.timestamp <= bEnd) {
      countsB.set(k, (countsB.get(k) || 0) + 1);
      periodBTotalPlays++;
    }
  }

  const ranksA = new Map<string, number>();
  Array.from(countsA.entries())
    .sort((x, y) => y[1] - x[1])
    .forEach(([id], idx) => ranksA.set(id, idx + 1));

  const ranksB = new Map<string, number>();
  Array.from(countsB.entries())
    .sort((x, y) => y[1] - x[1])
    .forEach(([id], idx) => ranksB.set(id, idx + 1));

  const allIds = new Set<string>([...countsA.keys(), ...countsB.keys()]);
  const allItems: TimelineComparisonItem[] = [];

  for (const id of allIds) {
    const pA = countsA.get(id) || 0;
    const pB = countsB.get(id) || 0;
    const rA = ranksA.get(id) ?? null;
    const rB = ranksB.get(id) ?? null;

    let name = id;
    let subtitle = '';
    let artworkUrl = '';

    if (entityType === 'artists') {
      const art = artistsMap.get(id);
      name = art?.name || id;
      subtitle = art?.primaryGenre || 'Artist';
      artworkUrl = art?.artworkUrl || '';
    } else if (entityType === 'tracks') {
      const trk = tracksMap.get(id);
      name = trk?.title || id;
      subtitle = trk?.artistName || '';
      artworkUrl = trk?.artworkUrl || '';
    } else {
      const alb = albumsMap.get(id);
      name = alb?.title || id;
      subtitle = alb?.artistName || '';
      artworkUrl = alb?.artworkUrl || '';
    }

    let status: TimelineComparisonItem['status'] = 'steady';
    let rankDelta: number | null = null;

    if (rA !== null && rB !== null) {
      rankDelta = rA - rB;
      if (rankDelta > 0) status = 'rose';
      else if (rankDelta < 0) status = 'fell';
      else status = 'steady';
    } else if (rA === null && rB !== null && pB >= 8) {
      status = 'new';
    } else if (rA !== null && rB === null && pA >= 8) {
      status = 'dropped';
    } else {
      continue;
    }

    allItems.push({
      id,
      name,
      subtitle,
      artworkUrl,
      periodARank: rA,
      periodBRank: rB,
      periodAPlays: pA,
      periodBPlays: pB,
      rankDelta,
      playDelta: pB - pA,
      status,
    });
  }

  const rose = allItems
    .filter((i) => i.status === 'rose')
    .sort((a, b) => (b.rankDelta || 0) - (a.rankDelta || 0));
  const fell = allItems
    .filter((i) => i.status === 'fell')
    .sort((a, b) => (a.rankDelta || 0) - (b.rankDelta || 0));
  const newEntries = allItems
    .filter((i) => i.status === 'new')
    .sort((a, b) => b.periodBPlays - a.periodBPlays);
  const droppedEntries = allItems
    .filter((i) => i.status === 'dropped')
    .sort((a, b) => b.periodAPlays - a.periodAPlays);

  return {
    preset,
    periodALabel,
    periodBLabel,
    entityType,
    periodATotalPlays,
    periodBTotalPlays,
    rose,
    fell,
    newEntries,
    droppedEntries,
    allItems,
  };
}
