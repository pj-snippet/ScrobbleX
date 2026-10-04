import React, { useState, useMemo } from 'react';
import {
  Radio,
  Search,
  History,
  Heart,
  ShieldCheck,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AccentColor, Scrobble, TimeRangeFilter, UserProfile } from '../types/music';
import {
  formatDateHuman,
  formatDuration,
  formatRelativeTime,
  getArtistById,
  getOverviewSummary,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
  getTrackById,
} from '../domain/analyticsEngine';
import { ACCENT_THEMES } from '../domain/themeConfig';
import { ArtworkThumb, TimeRangeSelector } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';

interface HomeScreenProps {
  scrobbles: Scrobble[];
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
  userProfile,
  lovedTrackIds,
  onSelectEntity,
  onNavigateTab,
  accentColor,
  onToggleLoved,
  onLaunchStory,
}) => {
  const [period, setPeriod] = useState<TimeRangeFilter>('30d');
  const [topTab, setTopTab] = useState<'artists' | 'tracks' | 'albums'>('artists');

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  // Now playing or most recent scrobble
  const mostRecent = scrobbles[0];
  const recentTrack = mostRecent ? getTrackById(mostRecent.trackId) : null;
  const recentArtist = mostRecent ? getArtistById(mostRecent.artistId) : null;

  // Summary Metrics
  const summary = useMemo(() => getOverviewSummary(scrobbles, period), [scrobbles, period]);

  // Top Lists
  const topArtists = useMemo(() => getTopArtists(scrobbles, period, 5), [scrobbles, period]);
  const topTracks = useMemo(() => getTopTracks(scrobbles, period, 5), [scrobbles, period]);
  const topAlbums = useMemo(() => getTopAlbums(scrobbles, period, 5), [scrobbles, period]);

  const activeTopList =
    topTab === 'artists' ? topArtists : topTab === 'tracks' ? topTracks : topAlbums;

  return (
    <div className="space-y-5 pb-6">
      {/* Prominent My Listening Story Banner */}
      {onLaunchStory && (
        <div
          onClick={() => onLaunchStory('2026')}
          className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-500/30 shadow-xl cursor-pointer group transition-all hover:border-blue-400/60"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>MY LISTENING STORY</span>
              </span>
              <h3 className="text-sm font-bold text-white font-display">
                Experience Your Music Story
              </h3>
              <p className="text-[11px] text-slate-300">
                10-card cinematic journey of your 2026 listening history
              </p>
            </div>
            <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Now Playing / Latest Scrobble Live Telemetry Card */}
      {mostRecent && recentTrack && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1424] to-[#0A0D18] border border-slate-800 p-4 shadow-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE TELEMETRY</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {formatRelativeTime(mostRecent.timestamp)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="relative cursor-pointer group"
              onClick={() => onSelectEntity({ type: 'track', id: recentTrack.id })}
            >
              <ArtworkThumb
                src={recentTrack.artworkUrl}
                alt={recentTrack.title}
                sizeClass="w-18 h-18"
                roundedClass="rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/20 rounded-2xl group-hover:bg-transparent transition-colors" />
            </div>

            <div className="flex-1 min-w-0">
              <h3
                onClick={() => onSelectEntity({ type: 'track', id: recentTrack.id })}
                className="text-base font-bold text-white truncate cursor-pointer hover:underline font-display"
              >
                {recentTrack.title}
              </h3>
              <p
                onClick={() => onSelectEntity({ type: 'artist', id: recentTrack.artistId })}
                className="text-xs text-slate-300 truncate cursor-pointer hover:text-white mt-0.5"
              >
                {recentTrack.artistName}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {recentTrack.albumTitle}
              </p>

              {/* Animated waveform bars */}
              <div className="flex items-center gap-1 mt-2.5 h-3">
                <span className={`w-1 h-3 rounded-full ${theme.primaryBg} animate-pulse`} />
                <span className={`w-1 h-2 rounded-full ${theme.primaryBg} animate-bounce`} />
                <span className={`w-1 h-3.5 rounded-full ${theme.primaryBg} animate-pulse`} />
                <span className={`w-1 h-1.5 rounded-full ${theme.primaryBg} animate-bounce`} />
                <span className={`w-1 h-2.5 rounded-full ${theme.primaryBg} animate-pulse`} />
                <span className="text-[10px] font-mono text-slate-400 ml-2">
                  Scrobbled to Last.fm
                </span>
              </div>
            </div>

            <button
              onClick={() => onToggleLoved(recentTrack.id)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Heart
                className={`w-5 h-5 ${
                  lovedTrackIds.has(recentTrack.id) ? 'text-rose-500 fill-current' : ''
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => onNavigateTab('charts')}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-cyan-400">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-slate-200 mt-2 font-display">Charts</p>
          <p className="text-[9px] text-slate-400 truncate">Ratios & Clock</p>
        </button>

        <button
          onClick={() => onNavigateTab('activity')}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400">
            <Radio className="w-4 h-4 text-emerald-400" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-slate-200 mt-2 font-display">Activity</p>
          <p className="text-[9px] text-slate-400 truncate">Heatmaps</p>
        </button>

        <button
          onClick={() => onNavigateTab('timeline')}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-400">
            <Clock className="w-4 h-4 text-blue-400" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-slate-200 mt-2 font-display">Timeline</p>
          <p className="text-[9px] text-slate-400 truncate">Trends</p>
        </button>

        <button
          onClick={() => onNavigateTab('rediscover')}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-slate-200 mt-2 font-display">Rediscover</p>
          <p className="text-[9px] text-slate-400 truncate">Gems</p>
        </button>
      </div>

      {/* Period Selector & Summary Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 font-display uppercase tracking-wider">
            Listening Overview
          </h3>
          <TimeRangeSelector value={period} onChange={setPeriod} accentColor={accentColor} />
        </div>

        {/* 2x2 Telemetry Metric Matrix */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
              Total Scrobbles
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                {summary.totalScrobbles.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ~{summary.dailyAverage}/day
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
              Listening Time
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                {summary.listeningTimeFormatted}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
              Unique Catalog
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
              <span className="text-white font-bold">{summary.totalArtists}</span> art ·{' '}
              <span className="text-white font-bold">{summary.totalTracks}</span> trk
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
              Active Streak
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono">
              <Flame className="w-4 h-4 text-amber-500 fill-current" />
              <span className="text-white font-bold text-sm">
                {summary.currentStreakDays} days
              </span>
              <span className="text-slate-500 text-[10px]">
                (max {summary.longestStreakDays}d)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Rankings Segmented Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            {(['artists', 'tracks', 'albums'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTopTab(tab)}
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  topTab === tab
                    ? `${theme.subtleBg} ${theme.primaryText}`
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Top {tab}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Top {activeTopList.length}
          </span>
        </div>

        <div className="space-y-2">
          {activeTopList.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (topTab === 'artists') onSelectEntity({ type: 'artist', id: item.id });
                else if (topTab === 'tracks') onSelectEntity({ type: 'track', id: item.id });
                else onSelectEntity({ type: 'album', id: item.id });
              }}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-center font-mono text-xs font-black text-slate-500 group-hover:text-slate-300">
                  {item.rank}
                </span>
                <ArtworkThumb
                  src={item.artworkUrl}
                  alt={item.name}
                  sizeClass="w-11 h-11"
                  roundedClass={topTab === 'artists' ? 'rounded-full' : 'rounded-xl'}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate group-hover:text-white font-display">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-mono font-bold text-slate-200">
                  {item.plays.toLocaleString()} <span className="text-[10px] text-slate-500">plays</span>
                </p>
                <p className="text-[10px] font-mono text-slate-400">{item.sharePercent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Scrobbles Preview */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider">
            Recent Scrobble Stream
          </h3>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60 rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
          {scrobbles.slice(0, 6).map((s) => {
            const trk = getTrackById(s.trackId);
            if (!trk) return null;
            return (
              <div
                key={s.id}
                onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ArtworkThumb src={trk.artworkUrl} alt={trk.title} sizeClass="w-9 h-9" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                      {trk.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{trk.artistName}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-2">
                  {formatRelativeTime(s.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
