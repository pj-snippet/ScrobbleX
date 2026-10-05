import { RankedEntityItem, Scrobble } from '../../../types/music';
import {
  formatDateLong,
  formatKnownListeningDuration,
  getKnownListeningDuration,
} from './analyticsCore';
import { getTopAlbums, getTopArtists, getTopTracks } from './listeningSummary';

export interface YearInReviewData {
  year: number;
  totalPlays: number;
  totalHours: string;
  uniqueArtists: number;
  uniqueTracks: number;
  topArtist: RankedEntityItem | null;
  topTrack: RankedEntityItem | null;
  topAlbum: RankedEntityItem | null;
  monthlyPlays: { monthName: string; plays: number }[];
  peakDay: { dateFormatted: string; plays: number } | null;
  quarterShifts: { quarter: string; topArtistName: string; plays: number }[];
}

export function getYearInReview(
  scrobbles: Scrobble[],
  year = new Date().getUTCFullYear()
): YearInReviewData {
  const yearScrobbles = scrobbles.filter((s) => s.year === year);
  const duration = getKnownListeningDuration(yearScrobbles);
  const artistSet = new Set(yearScrobbles.map((s) => s.artistId));
  const trackSet = new Set(yearScrobbles.map((s) => s.trackId));

  const topArtist = getTopArtists(yearScrobbles, 'all', 1)[0] || null;
  const topTrack = getTopTracks(yearScrobbles, 'all', 1)[0] || null;
  const topAlbum = getTopAlbums(yearScrobbles, 'all', 1)[0] || null;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthCounts = new Array(12).fill(0);
  const dayCounts = new Map<string, number>();

  for (const s of yearScrobbles) {
    monthCounts[s.month] += 1;
    dayCounts.set(s.dateKey, (dayCounts.get(s.dateKey) || 0) + 1);
  }

  let peakDateKey = '';
  let peakPlays = 0;
  dayCounts.forEach((cnt, dk) => {
    if (cnt > peakPlays) {
      peakPlays = cnt;
      peakDateKey = dk;
    }
  });

  const qDefs = [
    { label: 'Q1 (Jan–Mar)', months: [0, 1, 2] },
    { label: 'Q2 (Apr–Jun)', months: [3, 4, 5] },
    { label: 'Q3 (Jul–Sep)', months: [6, 7, 8] },
    { label: 'Q4 (Oct–Dec)', months: [9, 10, 11] },
  ];

  const quarterShifts = qDefs.map((q) => {
    const qScr = yearScrobbles.filter((s) => q.months.includes(s.month));
    const topA = getTopArtists(qScr, 'all', 1)[0];
    return {
      quarter: q.label,
      topArtistName: topA?.name || '—',
      plays: qScr.length,
    };
  });

  return {
    year,
    totalPlays: yearScrobbles.length,
    totalHours: formatKnownListeningDuration(
      duration.seconds,
      duration.unknownScrobbles
    ),
    uniqueArtists: artistSet.size,
    uniqueTracks: trackSet.size,
    topArtist,
    topTrack,
    topAlbum,
    monthlyPlays: monthNames
      .slice(0, year === new Date().getUTCFullYear() ? new Date().getUTCMonth() + 1 : 12)
      .map((m, i) => ({
      monthName: m,
      plays: monthCounts[i],
      })),
    peakDay: peakDateKey ? { dateFormatted: formatDateLong(peakDateKey), plays: peakPlays } : null,
    quarterShifts,
  };
}
