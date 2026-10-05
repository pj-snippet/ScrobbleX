import { RankedEntityItem, RediscoverCandidate, Scrobble } from '../../../types/music';
import { DAY_NAMES, getListeningSessions } from './activityAnalytics';
import {
  filterScrobblesByPeriod,
  formatDateHuman,
  formatKnownListeningDuration,
  tracksMap,
} from './analyticsCore';
import { FingerprintDimension, getListeningClock, getListeningFingerprint } from './chartAnalytics';
import { getOverviewSummary, getTopAlbums, getTopArtists, getTopTracks } from './listeningSummary';
import { getRediscoverCandidates } from './rediscoverAnalytics';

// ============================================================================
// 5. MY LISTENING STORY (Cinematic 10-Card Data-Backed Recap Engine)
// ============================================================================

export interface StoryCardIntro {
  periodLabel: string;
  totalScrobbles: number;
  totalDurationFormatted: string;
  totalArtists: number;
  totalAlbums: number;
  totalTracks: number;
  dailyAverage: number;
}

export interface StoryCardMusic {
  topArtist: RankedEntityItem;
  topTrack: RankedEntityItem;
  topAlbum: RankedEntityItem;
  mostPlayedArtist: RankedEntityItem;
  mostPlayedTrack: RankedEntityItem;
}

export interface StoryCardActivity {
  totalHours: string;
  dailyAverage: number;
  mostActiveMonth: string;
  longestStreakDays: number;
  busiestDayFormatted: string;
  busiestDayPlays: number;
  busiestHourLabel: string;
}

export interface StoryCardFingerprint {
  archetype: string;
  description: string;
  dimensions: FingerprintDimension[];
}

export interface StoryCardClock {
  busiestHourLabel: string;
  busiestHourPlays: number;
  clockStatement: string;
  quietestPeriodLabel: string;
}

export interface StoryCardRediscover {
  headlineTrack: RediscoverCandidate | null;
  candidates: RediscoverCandidate[];
}

export interface StoryCardHabits {
  longestSessionMin: number;
  longestSessionDurationFormatted: string;
  avgSessionDurationMin: number;
  avgSessionDurationFormatted: string;
  avgTracksPerSession: number;
  longestGapFormatted: string;
  mostRepeatedTrack: { title: string; artistName: string; plays: number } | null;
  mostConsistentDay: string;
}

export interface StoryCardClosing {
  totalScrobbles: number;
  totalArtists: number;
  totalTracks: number;
  totalDaysOfListening: number;
  closingStatement: string;
}

export interface ListeningStoryData {
  periodPreset: '2026' | '2025' | '12m' | '6m' | 'all';
  periodLabel: string;
  hasEnoughData: boolean;
  intro: StoryCardIntro;
  music: StoryCardMusic | null;
  activity: StoryCardActivity;
  fingerprint: StoryCardFingerprint;
  clock: StoryCardClock;
  rediscover: StoryCardRediscover;
  habits: StoryCardHabits;
  closing: StoryCardClosing;
}

function getLongestGapFormatted(scrobbles: Scrobble[]): string {
  if (scrobbles.length < 2) return '—';
  const chronological = [...scrobbles].sort((a, b) => a.timestamp - b.timestamp);
  let longestGapSeconds = 0;
  for (let index = 1; index < chronological.length; index += 1) {
    longestGapSeconds = Math.max(
      longestGapSeconds,
      chronological[index].timestamp - chronological[index - 1].timestamp
    );
  }
  return `${(longestGapSeconds / 86400).toFixed(1)} days`;
}

function getMostConsistentDay(scrobbles: Scrobble[]): string {
  if (scrobbles.length === 0) return '—';
  const counts = new Array(DAY_NAMES.length).fill(0);
  for (const scrobble of scrobbles) {
    if (scrobble.dayOfWeek >= 0 && scrobble.dayOfWeek < counts.length) {
      counts[scrobble.dayOfWeek] += 1;
    }
  }
  const mostFrequentDay = counts.indexOf(Math.max(...counts));
  return mostFrequentDay >= 0 ? DAY_NAMES[mostFrequentDay] : '—';
}

export function getStoryData(
  scrobbles: Scrobble[],
  periodPreset: '2026' | '2025' | '12m' | '6m' | 'all' = '2026'
): ListeningStoryData {
  let periodScrobbles = scrobbles;
  let periodLabel = '2026';

  if (periodPreset === '2026') {
    periodScrobbles = scrobbles.filter((s) => s.year === 2026);
    periodLabel = 'Year 2026';
  } else if (periodPreset === '2025') {
    periodScrobbles = scrobbles.filter((s) => s.year === 2025);
    periodLabel = 'Year 2025';
  } else if (periodPreset === '12m') {
    periodScrobbles = filterScrobblesByPeriod(scrobbles, '12m');
    periodLabel = 'Last 12 Months';
  } else if (periodPreset === '6m') {
    periodScrobbles = filterScrobblesByPeriod(scrobbles, '6m');
    periodLabel = 'Last 6 Months';
  } else {
    periodLabel = 'All-Time Story';
  }

  const hasEnoughData = periodScrobbles.length >= 25;

  // Overview summary
  const summary = getOverviewSummary(periodScrobbles, 'all');

  // Music rankings
  const topArtists = getTopArtists(periodScrobbles, 'all', 5);
  const topTracks = getTopTracks(periodScrobbles, 'all', 5);
  const topAlbums = getTopAlbums(periodScrobbles, 'all', 5);

  const musicCard: StoryCardMusic | null =
    topArtists.length > 0 && topTracks.length > 0 && topAlbums.length > 0
      ? {
          topArtist: topArtists[0],
          topTrack: topTracks[0],
          topAlbum: topAlbums[0],
          mostPlayedArtist: topArtists[0],
          mostPlayedTrack: topTracks[0],
        }
      : null;

  // Calendar & Activity
  const clockData = getListeningClock(periodScrobbles, 'all', 'plays', true);
  const dailyPlays = new Map<string, number>();
  for (const scrobble of periodScrobbles) {
    dailyPlays.set(scrobble.dateKey, (dailyPlays.get(scrobble.dateKey) || 0) + 1);
  }
  const busiestDay = Array.from(dailyPlays.entries()).sort((a, b) => b[1] - a[1])[0];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mCounts = new Array(12).fill(0);
  for (const s of periodScrobbles) {
    mCounts[s.month]++;
  }
  let maxMonthIdx = -1;
  let maxMonthPlays = 0;
  mCounts.forEach((cnt, idx) => {
    if (cnt > maxMonthPlays) {
      maxMonthPlays = cnt;
      maxMonthIdx = idx;
    }
  });

  const activityCard: StoryCardActivity = {
    totalHours: summary.listeningTimeFormatted,
    dailyAverage: summary.dailyAverage,
    mostActiveMonth: maxMonthIdx >= 0 ? monthNames[maxMonthIdx] : '—',
    longestStreakDays: summary.longestStreakDays,
    busiestDayFormatted: busiestDay ? formatDateHuman(busiestDay[0]) : '—',
    busiestDayPlays: busiestDay?.[1] || 0,
    busiestHourLabel: clockData.busiestHour.hourLabel,
  };

  // Fingerprint
  const fp = getListeningFingerprint(periodScrobbles, 'all');
  const fingerprintCard: StoryCardFingerprint = {
    archetype: fp.overallArchetype,
    description: fp.archetypeDescription,
    dimensions: fp.dimensions,
  };

  // Clock
  const clockCard: StoryCardClock = {
    busiestHourLabel: clockData.busiestHour.hourLabel,
    busiestHourPlays: clockData.busiestHour.scrobblesCount,
    clockStatement: `You listen most around ${clockData.busiestHour.hourLabel}, accounting for ${clockData.busiestHour.scrobblesCount} scrobbles.`,
    quietestPeriodLabel: clockData.quietestPeriodLabel,
  };

  // Rediscover
  const rediscoverAll = getRediscoverCandidates(periodScrobbles, { minHistoricalPlays: 15, minDormantDays: 45 });
  const rediscoverCard: StoryCardRediscover = {
    headlineTrack: rediscoverAll[0] || null,
    candidates: rediscoverAll.slice(0, 4),
  };

  // Habits
  const sessions = getListeningSessions(periodScrobbles, 25);
  const trackPlaysMap = new Map<string, number>();
  for (const s of periodScrobbles) {
    trackPlaysMap.set(s.trackId, (trackPlaysMap.get(s.trackId) || 0) + 1);
  }
  let mostRepeatedTrack: StoryCardHabits['mostRepeatedTrack'] = null;
  if (trackPlaysMap.size > 0) {
    const [topTrkId, plays] = Array.from(trackPlaysMap.entries()).sort((a, b) => b[1] - a[1])[0];
    const t = tracksMap.get(topTrkId);
    if (t) mostRepeatedTrack = { title: t.title, artistName: t.artistName, plays };
  }

  const habitsCard: StoryCardHabits = {
    longestSessionMin: sessions.longestSessionMin,
    longestSessionDurationFormatted:
      sessions.totalSessions === 0
        ? '—'
        : formatKnownListeningDuration(
            sessions.longestSessionDurationSec,
            sessions.longestSessionUnknownDurationCount
          ),
    avgSessionDurationMin: sessions.avgSessionDurationMin,
    avgSessionDurationFormatted:
      sessions.totalSessions === 0
        ? '—'
        : formatKnownListeningDuration(
            sessions.avgSessionDurationSec,
            sessions.avgSessionUnknownDurationCount
          ),
    avgTracksPerSession: sessions.avgTracksPerSession,
    longestGapFormatted: getLongestGapFormatted(periodScrobbles),
    mostRepeatedTrack,
    mostConsistentDay: getMostConsistentDay(periodScrobbles),
  };

  // Closing
  const closingCard: StoryCardClosing = {
    totalScrobbles: summary.totalScrobbles,
    totalArtists: summary.totalArtists,
    totalTracks: summary.totalTracks,
    totalDaysOfListening: dailyPlays.size,
    closingStatement: 'That’s your personal music story.',
  };

  return {
    periodPreset,
    periodLabel,
    hasEnoughData,
    intro: {
      periodLabel,
      totalScrobbles: summary.totalScrobbles,
      totalDurationFormatted: summary.listeningTimeFormatted,
      totalArtists: summary.totalArtists,
      totalAlbums: summary.totalAlbums,
      totalTracks: summary.totalTracks,
      dailyAverage: summary.dailyAverage,
    },
    music: musicCard,
    activity: activityCard,
    fingerprint: fingerprintCard,
    clock: clockCard,
    rediscover: rediscoverCard,
    habits: habitsCard,
    closing: closingCard,
  };
}
