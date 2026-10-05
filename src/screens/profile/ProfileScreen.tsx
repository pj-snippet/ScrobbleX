import React, { useMemo } from 'react';
import {
  User2,
  Calendar,
  Flame,
  Pin,
  Settings,
  ShieldCheck,
  Heart,
  ChevronRight,
  ExternalLink,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AccentColor, Scrobble, UserProfile } from '../../types/music';
import {
  formatDuration,
  getOverviewSummary,
  getTrackById,
} from '../../features/analytics/services/analyticsEngine';
import { ACCENT_THEMES } from '../../features/themes/themeRegistry';
import { ArtworkThumb } from '../../components/ui/MobilePrimitives';
import { SelectedEntity } from '../../components/common/EntityDetailSheet';
import { measureTempSync } from '../../utils/tempPerformance';

interface ProfileScreenProps {
  userProfile: UserProfile;
  scrobbles: Scrobble[];
  lovedTrackIds: Set<string>;
  onSelectEntity: (entity: SelectedEntity) => void;
  onNavigateTab: (tabId: string) => void;
  accentColor: AccentColor;
  onLaunchStory?: (preset?: '2026' | '2025' | '12m' | '6m' | 'all') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  scrobbles,
  lovedTrackIds,
  onSelectEntity,
  onNavigateTab,
  accentColor,
  onLaunchStory,
}) => {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;
  // TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
  const summary = useMemo(
    () =>
      measureTempSync(
        'analytics.profile.overview_summary',
        () => getOverviewSummary(scrobbles, 'all'),
        { records: scrobbles.length }
      ),
    [scrobbles]
  );

  const obsessionTrack = getTrackById(userProfile.currentObsessionTrackId);
  const pinnedTrack = getTrackById(userProfile.pinnedTrackId);

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-4">
          <ArtworkThumb
            src={userProfile.avatarUrl}
            alt={userProfile.displayName}
            sizeClass="w-16 h-16"
            roundedClass="rounded-full"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate font-display">
              {userProfile.displayName}
            </h3>
            <p className="text-xs text-slate-400 font-mono">@{userProfile.username}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Scrobbling since {userProfile.memberSince}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('settings')}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Lifetime Telemetry Matrix */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950/50">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Scrobbles</span>
            <p className="text-sm font-bold font-mono text-white mt-0.5">
              {summary.totalScrobbles.toLocaleString()}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Artists</span>
            <p className="text-sm font-bold font-mono text-white mt-0.5">
              {summary.totalArtists}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Listening</span>
            <p className="text-sm font-bold font-mono text-white mt-0.5">
              {summary.listeningTimeFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* Current Obsession & Pinned Track */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
          Curated Showcase
        </h4>

        {obsessionTrack && (
          <div
            onClick={() => onSelectEntity({ type: 'track', id: obsessionTrack.id })}
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Flame className="w-3 h-3 fill-current" />
                <span>CURRENT OBSESSION</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </div>

            <div className="flex items-center gap-3">
              <ArtworkThumb src={obsessionTrack.artworkUrl} alt={obsessionTrack.title} sizeClass="w-11 h-11" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate font-display">
                  {obsessionTrack.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {obsessionTrack.artistName} · {obsessionTrack.albumTitle}
                </p>
              </div>
            </div>
          </div>
        )}

        {pinnedTrack && (
          <div
            onClick={() => onSelectEntity({ type: 'track', id: pinnedTrack.id })}
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${theme.subtleBg} ${theme.primaryText} border ${theme.borderClass}`}>
                <Pin className="w-3 h-3" />
                <span>PINNED FOREVER FAVORITE</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </div>

            <div className="flex items-center gap-3">
              <ArtworkThumb src={pinnedTrack.artworkUrl} alt={pinnedTrack.title} sizeClass="w-11 h-11" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate font-display">
                  {pinnedTrack.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {pinnedTrack.artistName} · {pinnedTrack.albumTitle}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* My Listening Story Tile */}
      {onLaunchStory && (
        <div
          onClick={() => onLaunchStory('2026')}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/70 to-blue-950/70 border border-purple-500/30 flex items-center justify-between cursor-pointer group hover:border-purple-400"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-display">My Listening Story</p>
              <p className="text-[10px] text-slate-300">Play your 2026 cinematic recap</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigateTab('charts')}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
        >
          <TrendingUp className="w-4 h-4 text-cyan-400 mb-2" />
          <p className="text-xs font-bold text-white">Advanced Charts</p>
          <p className="text-[10px] text-slate-400">Ratios & 24h clock</p>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-blue-400 mb-2" />
          <p className="text-xs font-bold text-white">Theme & Settings</p>
          <p className="text-[10px] text-slate-400">Colors, sync & export</p>
        </button>
      </div>
    </div>
  );
};
