import { useMemo, useState } from 'react';
import type { Scrobble, TimeRangeFilter } from '../../../types/music';
import {
  getOverviewSummary,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
} from '../../../features/analytics/services/analyticsEngine';
import { getLatestScrobble } from '../../../features/telemetry/utils/telemetrySelectors';
import { measureTempSync } from '../../../utils/tempPerformance';

export type HomeRankingTab = 'artists' | 'tracks' | 'albums';

export function useHomeData(scrobbles: Scrobble[]) {
  const [period, setPeriod] = useState<TimeRangeFilter>('30d');
  const [topTab, setTopTab] = useState<HomeRankingTab>('artists');

  const { scrobble: mostRecent, track: recentTrack } = getLatestScrobble(scrobbles);

  // TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
  const summary = useMemo(
    () =>
      measureTempSync(
        'analytics.home.overview_summary',
        () => getOverviewSummary(scrobbles, period),
        { records: scrobbles.length }
      ),
    [scrobbles, period]
  );
  const topArtists = useMemo(
    () =>
      measureTempSync(
        'analytics.home.top_artists',
        () => getTopArtists(scrobbles, period, 5),
        { records: scrobbles.length }
      ),
    [scrobbles, period]
  );
  const topTracks = useMemo(
    () =>
      measureTempSync(
        'analytics.home.top_tracks',
        () => getTopTracks(scrobbles, period, 5),
        { records: scrobbles.length }
      ),
    [scrobbles, period]
  );
  const topAlbums = useMemo(
    () =>
      measureTempSync(
        'analytics.home.top_albums',
        () => getTopAlbums(scrobbles, period, 5),
        { records: scrobbles.length }
      ),
    [scrobbles, period]
  );
  const activeTopList =
    topTab === 'artists' ? topArtists : topTab === 'tracks' ? topTracks : topAlbums;

  return {
    activeTopList,
    mostRecent,
    period,
    recentTrack,
    setPeriod,
    setTopTab,
    summary,
    topTab,
  };
}
