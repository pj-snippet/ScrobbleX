import React from 'react';
import { Disc3 } from 'lucide-react';
import type {
  AccentColor,
  BaseTheme,
  Scrobble,
  SyncState,
  Track,
  UserProfile,
} from '../../types/music';
import type { SelectedEntity } from '../../components/common/EntityDetailSheet';
import type { LastFmConnection } from '../../features/lastfm/api/lastfmApi';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { ActivityScreen } from '../../screens/activity/ActivityScreen';
import { ChartsScreen } from '../../screens/charts/ChartsScreen';
import { TimelineScreen } from '../../screens/timeline/TimelineScreen';
import { RediscoverScreen } from '../../screens/rediscover/RediscoverScreen';
import { HistoryAndSearchScreen } from '../../screens/history/HistoryAndSearchScreen';
import { LovedAndTrustScreen } from '../../screens/loved/LovedAndTrustScreen';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import type { AppTab } from '../navigation/appTabs';

interface AppScreenRouterProps {
  isLoadingLocalHistory: boolean;
  scrobbles: Scrobble[];
  nowPlayingTrack: Track | null;
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
  accentHex: string;
  userProfile: UserProfile;
  lovedTrackIds: Set<string>;
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor: AccentColor;
  onToggleLoved: (trackId: string) => void;
  onLaunchStory: (preset?: '2026' | '2025' | '12m' | '6m' | 'all') => void;
  onCleanupDuplicates: () => void;
  syncState: SyncState;
  lastFmUsername: string | null;
  activeBaseTheme: BaseTheme;
  customHexColor: string;
  onLastFmConnected: (connection: LastFmConnection) => void;
  onLastFmDisconnected: () => void;
  onUpdateAccentColor: (color: AccentColor, customHex?: string) => void;
  onUpdateBaseTheme: (theme: BaseTheme) => void;
  onTriggerSync: () => void;
  onResetDatabase: () => void;
  onExportData: () => void;
}

export const AppScreenRouter: React.FC<AppScreenRouterProps> = ({
  isLoadingLocalHistory,
  scrobbles,
  nowPlayingTrack,
  activeTab,
  onNavigateTab,
  accentHex,
  userProfile,
  lovedTrackIds,
  onSelectEntity,
  accentColor,
  onToggleLoved,
  onLaunchStory,
  onCleanupDuplicates,
  syncState,
  lastFmUsername,
  activeBaseTheme,
  customHexColor,
  onLastFmConnected,
  onLastFmDisconnected,
  onUpdateAccentColor,
  onUpdateBaseTheme,
  onTriggerSync,
  onResetDatabase,
  onExportData,
}) => (
  <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 no-scrollbar overscroll-contain">
    {isLoadingLocalHistory && (
      <div className="flex min-h-52 items-center justify-center text-sm text-slate-400">
        Loading local listening history…
      </div>
    )}

    {!isLoadingLocalHistory &&
      scrobbles.length === 0 &&
      !nowPlayingTrack &&
      activeTab !== 'settings' && (
      <div className="mx-auto mt-16 max-w-sm rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center">
        <Disc3 className="mx-auto mb-3 h-8 w-8 text-slate-500" />
        <h2 className="text-base font-bold text-white">No listening history yet.</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Connect Last.fm and sync your listening history.
        </p>
        <button
          onClick={() => onNavigateTab('settings')}
          className="mt-4 rounded-xl px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: accentHex }}
        >
          Connect Last.fm
        </button>
      </div>
    )}

    {!isLoadingLocalHistory &&
      (scrobbles.length > 0 || nowPlayingTrack) &&
      activeTab === 'home' && (
      <HomeScreen
        scrobbles={scrobbles}
        nowPlayingTrack={nowPlayingTrack}
        userProfile={userProfile}
        lovedTrackIds={lovedTrackIds}
        onSelectEntity={onSelectEntity}
        onNavigateTab={(tab) => onNavigateTab(tab as AppTab)}
        accentColor={accentColor}
        onToggleLoved={onToggleLoved}
        onLaunchStory={() => onLaunchStory('2026')}
      />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'activity' && (
      <ActivityScreen
        scrobbles={scrobbles}
        onSelectEntity={onSelectEntity}
        accentColor={accentColor}
        onNavigateTab={(tab) => onNavigateTab(tab as AppTab)}
      />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'charts' && (
      <ChartsScreen
        scrobbles={scrobbles}
        onLaunchStory={onLaunchStory}
        accentColor={accentColor}
      />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'timeline' && (
      <TimelineScreen scrobbles={scrobbles} accentColor={accentColor} />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'profile' && (
      <ProfileScreen
        userProfile={userProfile}
        scrobbles={scrobbles}
        lovedTrackIds={lovedTrackIds}
        onSelectEntity={onSelectEntity}
        onNavigateTab={(tab) => onNavigateTab(tab as AppTab)}
        accentColor={accentColor}
        onLaunchStory={onLaunchStory}
      />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'rediscover' && (
      <RediscoverScreen
        scrobbles={scrobbles}
        lovedTrackIds={lovedTrackIds}
        onToggleLoved={onToggleLoved}
        onSelectEntity={onSelectEntity}
        accentColor={accentColor}
      />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'history' && (
      <HistoryAndSearchScreen onSelectEntity={onSelectEntity} accentColor={accentColor} />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'loved' && (
      <LovedAndTrustScreen
        scrobbles={scrobbles}
        lovedTrackIds={lovedTrackIds}
        onToggleLoved={onToggleLoved}
        onSelectEntity={onSelectEntity}
        onCleanupDuplicates={onCleanupDuplicates}
        accentColor={accentColor}
        initialTab="loved"
      />
    )}

    {!isLoadingLocalHistory && scrobbles.length > 0 && activeTab === 'integrity' && (
      <LovedAndTrustScreen
        scrobbles={scrobbles}
        lovedTrackIds={lovedTrackIds}
        onToggleLoved={onToggleLoved}
        onSelectEntity={onSelectEntity}
        onCleanupDuplicates={onCleanupDuplicates}
        accentColor={accentColor}
        initialTab="trust"
      />
    )}

    {activeTab === 'settings' && (
      <SettingsScreen
        syncState={syncState}
        lastFmUsername={lastFmUsername}
        activeAccentColor={accentColor}
        activeBaseTheme={activeBaseTheme}
        customHexColor={customHexColor}
        onLastFmConnected={onLastFmConnected}
        onLastFmDisconnected={onLastFmDisconnected}
        onUpdateAccentColor={onUpdateAccentColor}
        onUpdateBaseTheme={onUpdateBaseTheme}
        onTriggerSync={onTriggerSync}
        onResetDatabase={onResetDatabase}
        onExportData={onExportData}
      />
    )}
  </main>
);
