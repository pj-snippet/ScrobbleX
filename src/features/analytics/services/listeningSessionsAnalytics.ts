import { DerivedInsight, Scrobble, SessionAnalyticsSummary, TimeRangeFilter } from '../../../types/music';
import {
  artistsMap,
  filterScrobblesByPeriod,
  formatDateHuman,
  formatDateLong,
  formatKnownListeningDuration,
  getTrackDurationSec,
} from './analyticsCore';
import { getWeeklyListeningHeatmap } from './weeklyHeatmapAnalytics';

export function getListeningSessions(
  scrobbles: Scrobble[],
  inactivityThresholdMinutes = 25
): SessionAnalyticsSummary {
  if (scrobbles.length === 0) {
    return {
      inactivityThresholdMinutes,
      totalSessions: 0,
      avgSessionDurationMin: 0,
      avgSessionDurationSec: 0,
      avgSessionUnknownDurationCount: 0,
      longestSessionMin: 0,
      longestSessionDurationSec: 0,
      longestSessionUnknownDurationCount: 0,
      longestSessionDate: '—',
      longestSessionTracks: 0,
      avgTracksPerSession: 0,
      busiestSessionWindow: '—',
    };
  }

  const asc = [...scrobbles].sort((a, b) => a.timestamp - b.timestamp);
  const gapSec = inactivityThresholdMinutes * 60;

  interface RawSession {
    startTs: number;
    durationSec: number;
    unknownDurationCount: number;
    tracks: number;
    dateKey: string;
  }

  const sessions: RawSession[] = [];
  let curStart = asc[0].timestamp;
  let curDuration = getTrackDurationSec(asc[0]) ?? 0;
  let curUnknownDurationCount = getTrackDurationSec(asc[0]) === null ? 1 : 0;
  let curTracks = 1;
  let curDate = asc[0].dateKey;

  for (let i = 1; i < asc.length; i++) {
    const s = asc[i];
    if (s.timestamp - asc[i - 1].timestamp <= gapSec) {
      const trackDurationSec = getTrackDurationSec(s);
      if (trackDurationSec === null) curUnknownDurationCount += 1;
      else curDuration += trackDurationSec;
      curTracks += 1;
    } else {
      sessions.push({
        startTs: curStart,
        durationSec: curDuration,
        unknownDurationCount: curUnknownDurationCount,
        tracks: curTracks,
        dateKey: curDate,
      });
      curStart = s.timestamp;
      curDuration = getTrackDurationSec(s) ?? 0;
      curUnknownDurationCount = getTrackDurationSec(s) === null ? 1 : 0;
      curTracks = 1;
      curDate = s.dateKey;
    }
  }
  sessions.push({
    startTs: curStart,
    durationSec: curDuration,
    unknownDurationCount: curUnknownDurationCount,
    tracks: curTracks,
    dateKey: curDate,
  });

  let totalSec = 0;
  let totalUnknownDurationCount = 0;
  let totalTracks = 0;
  let longest = sessions[0];
  const sessionsByStartHour = new Array<number>(24).fill(0);

  for (const sess of sessions) {
    totalSec += sess.durationSec;
    totalUnknownDurationCount += sess.unknownDurationCount;
    totalTracks += sess.tracks;
    sessionsByStartHour[new Date(sess.startTs * 1000).getUTCHours()] += 1;
    if (sess.durationSec > longest.durationSec) {
      longest = sess;
    }
  }

  const avgSessionDurationSec = Math.round(totalSec / sessions.length);
  const avgSessionDurationMin = Math.round(avgSessionDurationSec / 60);
  const longestSessionMin = Math.round(longest.durationSec / 60);
  const avgTracksPerSession = Number((totalTracks / sessions.length).toFixed(1));
  const busiestHour = sessionsByStartHour.indexOf(Math.max(...sessionsByStartHour));
  const busiestSessionWindow = `${String(busiestHour).padStart(2, '0')}:00–${String(
    (busiestHour + 1) % 24
  ).padStart(2, '0')}:00`;

  return {
    inactivityThresholdMinutes,
    totalSessions: sessions.length,
    avgSessionDurationMin,
    avgSessionDurationSec,
    avgSessionUnknownDurationCount: totalUnknownDurationCount,
    longestSessionMin,
    longestSessionDurationSec: longest.durationSec,
    longestSessionUnknownDurationCount: longest.unknownDurationCount,
    longestSessionDate: formatDateHuman(longest.dateKey),
    longestSessionTracks: longest.tracks,
    avgTracksPerSession,
    busiestSessionWindow,
  };
}

export function getActivityInsights(
  scrobbles: Scrobble[],
  period: TimeRangeFilter,
  sessionGapMin = 25
): DerivedInsight[] {
  const filtered = filterScrobblesByPeriod(scrobbles, period);
  if (filtered.length < 30) {
    return [];
  }

  const heatmap = getWeeklyListeningHeatmap(scrobbles, period, 3, 'plays');
  const sessions = getListeningSessions(filtered, sessionGapMin);
  const dailyGroups = new Map<string, Scrobble[]>();
  for (const scrobble of filtered) {
    const dayScrobbles = dailyGroups.get(scrobble.dateKey) || [];
    dayScrobbles.push(scrobble);
    dailyGroups.set(scrobble.dateKey, dayScrobbles);
  }
  const peakDay = Array.from(dailyGroups.entries()).sort(
    (left, right) => right[1].length - left[1].length
  )[0];

  const insights: DerivedInsight[] = [
    {
      id: 'ins_busiest_window',
      category: 'rhythm',
      statement: `Your busiest listening period is ${heatmap.busiestWindowLabel}.`,
      supportingDetail: `Peak concentration occurs during ${heatmap.busiestWindowLabel} across the selected window.`,
      metricBadge: heatmap.busiestWindowLabel,
    },
    {
      id: 'ins_evening_share',
      category: 'concentration',
      statement: `${heatmap.eveningSharePercent}% of your weekly listening happens between 7 PM and 10 PM.`,
      supportingDetail: 'Calculated directly from hourly timestamp distributions in your local database.',
      metricBadge: `${heatmap.eveningSharePercent}% share`,
    },
    {
      id: 'ins_session_avg',
      category: 'session',
      statement: `Your average session has ${formatKnownListeningDuration(
        sessions.avgSessionDurationSec,
        sessions.avgSessionUnknownDurationCount
      )} of verified track duration.`,
      supportingDetail: `Sessions are grouped using a ${sessionGapMin}-minute timestamp gap; listening time sums verified track durations across ${sessions.totalSessions.toLocaleString()} sessions.`,
      metricBadge: `${sessions.totalSessions.toLocaleString()} sessions`,
    },
  ];

  if (peakDay) {
    const [dateKey, dayScrobbles] = peakDay;
    const artistCounts = new Map<string, number>();
    let durationSec = 0;
    let unknownDurationCount = 0;
    for (const scrobble of dayScrobbles) {
      artistCounts.set(
        scrobble.artistId,
        (artistCounts.get(scrobble.artistId) || 0) + 1
      );
      const trackDurationSec = getTrackDurationSec(scrobble);
      if (trackDurationSec === null) {
        unknownDurationCount += 1;
      } else {
        durationSec += trackDurationSec;
      }
    }
    const topArtistId = Array.from(artistCounts.entries()).sort(
      (left, right) => right[1] - left[1]
    )[0]?.[0];
    const topArtist = topArtistId ? artistsMap.get(topArtistId)?.name || topArtistId : '';
    insights.push({
      id: 'ins_peak_day',
      category: 'peak',
      statement: `Your most active listening day was ${formatDateLong(dateKey)}.`,
      supportingDetail: `Recorded ${dayScrobbles.length} plays (${formatKnownListeningDuration(durationSec, unknownDurationCount)}) across ${artistCounts.size} artists${topArtist ? `, led by ${topArtist}` : ''}.`,
      metricBadge: `${dayScrobbles.length} plays`,
    });
  }

  return insights;
}
