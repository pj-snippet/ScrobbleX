import React from 'react';
import type { AccentColor, Scrobble, Track, UserProfile } from '../../types/music';
import type { SelectedEntity } from '../../components/common/EntityDetailSheet';
import { useHomeData } from './hooks/useHomeData';
import { ListeningStoryBanner } from './components/ListeningStoryBanner';
import { LiveTelemetryCard } from '../../features/telemetry/components/LiveTelemetryCard';
import { OverviewStats } from './components/OverviewStats';
import { QuickNavigation } from './components/QuickNavigation';
import { RecentScrobblesPreview } from './components/RecentScrobblesPreview';
import { TopRankings } from './components/TopRankings';

interface HomeScreenProps {
  scrobbles: Scrobble[];
  nowPlayingTrack: Track | null;
  userProfile: UserProfile;
  lovedTrackIds: Set<string>;
  onSelectEntity: (entity: SelectedEntity) => void;
  onNavigateTab: (tabId: string) => void;
  accentColor: AccentColor;
  onToggleLoved: (trackId: string) => void;
  onLaunchStory?: (preset?: '2026' | '2025' | '12m' | '6m' | 'all') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  scrobbles,
  nowPlayingTrack,
  lovedTrackIds,
  onSelectEntity,
  onNavigateTab,
  accentColor,
  onToggleLoved,
  onLaunchStory,
}) => {
  const {
    activeTopList,
    mostRecent,
    period,
    recentTrack,
    setPeriod,
    setTopTab,
    summary,
    topTab,
  } = useHomeData(scrobbles);

  return (
    <div className="space-y-5 pb-6">
      {onLaunchStory && (
        <ListeningStoryBanner
          accentColor={accentColor}
          onLaunchStory={() => onLaunchStory('2026')}
        />
      )}

      {(nowPlayingTrack || (mostRecent && recentTrack)) && (
        <LiveTelemetryCard
          scrobble={mostRecent}
          track={nowPlayingTrack || recentTrack!}
          isNowPlaying={nowPlayingTrack !== null}
          lovedTrackIds={lovedTrackIds}
          accentColor={accentColor}
          onSelectEntity={onSelectEntity}
          onToggleLoved={onToggleLoved}
        />
      )}

      <QuickNavigation onNavigateTab={onNavigateTab} />
      <OverviewStats
        summary={summary}
        period={period}
        accentColor={accentColor}
        onPeriodChange={setPeriod}
      />
      <TopRankings
        items={activeTopList}
        tab={topTab}
        accentColor={accentColor}
        onTabChange={setTopTab}
        onSelectEntity={onSelectEntity}
      />
      <RecentScrobblesPreview
        scrobbles={scrobbles}
        onSelectEntity={onSelectEntity}
        onViewAll={() => onNavigateTab('history')}
      />
    </div>
  );
};
