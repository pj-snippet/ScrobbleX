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
  PieChart,
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
import { ArtworkThumb, TimeRangeSelector } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface HomeScreenProps {
  scrobbles: Scrobble[];
  userProfile: UserProfile | null;
  lovedTrackIds: Set<string>;
  onSelectEntity: (entity: SelectedEntity) => void;
  onNavigateTab: (tabId: string) => void;
  accentColor?: AccentColor;
  onToggleLoved: (trackId: string) => void;
  onLaunchStory?: (preset?: '2026' | '2025' | '12m' | '6m' | 'all') => void;
  onLoadDemoData?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  scrobbles,
  userProfile,
  lovedTrackIds,
  onSelectEntity,
  onNavigateTab,
  onToggleLoved,
  onLaunchStory,
  onLoadDemoData,
}) => {
  const { tokens } = useTheme();
  const [period, setPeriod] = useState<TimeRangeFilter>('30d');
  const [topTab, setTopTab] = useState<'artists' | 'tracks' | 'albums'>('artists');

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
      {/* Empty State when no scrobbles yet */}
      {scrobbles.length === 0 && (
        <div className="p-8 rounded-3xl bg-app-card border border-app text-center space-y-5 shadow-xl">
          <div
            style={{ backgroundColor: tokens.accentSubtle, borderColor: tokens.accentBorder }}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto text-accent"
          >
            <Radio className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-app-primary font-display">
              {userProfile ? `Welcome, @${userProfile.username}!` : 'Connect Last.fm to start'}
            </h3>
            <p className="text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
              {userProfile
                ? 'Your account is connected. Tap below to synchronize your scrobbles and begin exploring your listening patterns.'
                : 'Connect Last.fm to start understanding your listening history, top artists, tracks, and rhythm analytics.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              onClick={() => onNavigateTab('settings')}
              style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <span>{userProfile ? 'Sync in Settings' : 'Connect Last.fm'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            {onLoadDemoData && (
              <button
                onClick={onLoadDemoData}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-app-subcard hover:bg-app-hover text-app-secondary border border-app font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Preview with Demo Data</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prominent My Listening Story Banner */}
      {scrobbles.length > 0 && onLaunchStory && (
        <div
          onClick={() => onLaunchStory('2026')}
          style={{ borderColor: tokens.accentBorder }}
          className="relative overflow-hidden rounded-3xl p-4 bg-app-card border shadow-xl cursor-pointer group transition-all"
        >
          <div
            style={{ backgroundColor: tokens.accentSubtle }}
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none"
          />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <span
                style={{
                  backgroundColor: tokens.accentSubtle,
                  color: tokens.accentPrimary,
                  borderColor: tokens.accentBorder,
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
              >
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>MY LISTENING STORY</span>
              </span>
              <h3 className="text-sm font-bold text-app-primary font-display group-hover:text-accent transition-colors">
                Experience Your Music Story
              </h3>
              <p className="text-[11px] text-app-secondary">
                10-card cinematic journey of your 2026 listening history
              </p>
            </div>
            <div
              style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0"
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Now Playing / Latest Scrobble Live Telemetry Card */}
      {mostRecent && recentTrack && (
        <div className="relative overflow-hidden rounded-3xl bg-app-card border border-app p-4 shadow-xl">
          <div
            style={{ backgroundColor: tokens.accentSubtle }}
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none"
          />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-subcard border border-app text-[11px] font-mono text-app-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE TELEMETRY</span>
            </div>
            <span className="text-[11px] font-mono text-app-muted">
              {formatRelativeTime(mostRecent.timestamp)}
            </span>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div
              className="relative cursor-pointer group shrink-0"
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
                className="text-base font-bold text-app-primary truncate cursor-pointer hover:underline font-display"
              >
                {recentTrack.title}
              </h3>
              <p
                onClick={() => onSelectEntity({ type: 'artist', id: recentTrack.artistId })}
                className="text-xs text-app-secondary truncate cursor-pointer hover:text-app-primary mt-0.5"
              >
                {recentTrack.artistName}
              </p>
              <p className="text-[11px] text-app-muted truncate mt-0.5">
                {recentTrack.albumTitle}
              </p>

              {/* Animated waveform bars */}
              <div className="flex items-center gap-1 mt-2.5 h-3">
                <span
                  style={{ backgroundColor: tokens.accentPrimary }}
                  className="w-1 h-3 rounded-full animate-pulse"
                />
                <span
                  style={{ backgroundColor: tokens.accentPrimary }}
                  className="w-1 h-2 rounded-full animate-bounce"
                />
                <span
                  style={{ backgroundColor: tokens.accentPrimary }}
                  className="w-1 h-3.5 rounded-full animate-pulse"
                />
                <span
                  style={{ backgroundColor: tokens.accentPrimary }}
                  className="w-1 h-1.5 rounded-full animate-bounce"
                />
                <span
                  style={{ backgroundColor: tokens.accentPrimary }}
                  className="w-1 h-2.5 rounded-full animate-pulse"
                />
                <span className="text-[10px] font-mono text-app-muted ml-2">
                  Scrobbled to Last.fm
                </span>
              </div>
            </div>

            <button
              onClick={() => onToggleLoved(recentTrack.id)}
              className="p-2.5 rounded-xl bg-app-subcard hover:bg-app-hover border border-app text-app-muted hover:text-rose-400 transition-colors cursor-pointer shrink-0"
              aria-label="Love Track"
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
          className="p-2.5 rounded-2xl bg-app-card hover:bg-app-hover border border-app text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-app-muted group-hover:text-accent">
            <PieChart className="w-4 h-4 text-accent" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-app-primary mt-2 font-display">Charts</p>
          <p className="text-[9px] text-app-muted truncate">Ratios & Clock</p>
        </button>

        <button
          onClick={() => onNavigateTab('activity')}
          className="p-2.5 rounded-2xl bg-app-card hover:bg-app-hover border border-app text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-app-muted group-hover:text-accent">
            <Radio className="w-4 h-4 text-accent" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-app-primary mt-2 font-display">Activity</p>
          <p className="text-[9px] text-app-muted truncate">Heatmaps</p>
        </button>

        <button
          onClick={() => onNavigateTab('timeline')}
          className="p-2.5 rounded-2xl bg-app-card hover:bg-app-hover border border-app text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-app-muted group-hover:text-accent">
            <Clock className="w-4 h-4 text-accent" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-app-primary mt-2 font-display">Timeline</p>
          <p className="text-[9px] text-app-muted truncate">Trends</p>
        </button>

        <button
          onClick={() => onNavigateTab('rediscover')}
          className="p-2.5 rounded-2xl bg-app-card hover:bg-app-hover border border-app text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-app-muted group-hover:text-accent">
            <Sparkles className="w-4 h-4 text-accent" />
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>
          <p className="text-xs font-bold text-app-primary mt-2 font-display">Rediscover</p>
          <p className="text-[9px] text-app-muted truncate">Gems</p>
        </button>
      </div>

      {/* Period Selector & Summary Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider">
            Listening Overview
          </h3>
          <TimeRangeSelector value={period} onChange={setPeriod} />
        </div>

        {/* 2x2 Telemetry Metric Matrix */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-app-card border border-app">
            <span className="text-[10px] uppercase font-mono font-semibold text-app-muted">
              Total Scrobbles
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-app-primary">
                {summary.totalScrobbles.toLocaleString()}
              </span>
              <span className="text-[11px] text-app-muted font-mono">
                ~{summary.dailyAverage}/day
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-app-card border border-app">
            <span className="text-[10px] uppercase font-mono font-semibold text-app-muted">
              Listening Time
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-app-primary">
                {summary.listeningTimeFormatted}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-app-card border border-app">
            <span className="text-[10px] uppercase font-mono font-semibold text-app-muted">
              Unique Catalog
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-app-secondary font-mono">
              <span className="text-app-primary font-bold">{summary.totalArtists}</span> art ·{' '}
              <span className="text-app-primary font-bold">{summary.totalTracks}</span> trk
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-app-card border border-app">
            <span className="text-[10px] uppercase font-mono font-semibold text-app-muted">
              Active Streak
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono">
              <Flame className="w-4 h-4 text-amber-500 fill-current" />
              <span className="text-app-primary font-bold text-sm">
                {summary.currentStreakDays} days
              </span>
              <span className="text-app-muted text-[10px]">
                (max {summary.longestStreakDays}d)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Rankings Segmented Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-app pb-2">
          <div className="flex items-center gap-2">
            {(['artists', 'tracks', 'albums'] as const).map((tab) => {
              const isActive = topTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setTopTab(tab)}
                  style={{
                    backgroundColor: isActive ? tokens.accentSubtle : 'transparent',
                    color: isActive ? tokens.accentPrimary : tokens.textMuted,
                  }}
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer hover:text-app-primary ${
                    isActive ? 'font-bold' : ''
                  }`}
                >
                  Top {tab}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-mono text-app-muted">
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
              className="flex items-center justify-between p-2.5 rounded-2xl bg-app-card hover:bg-app-hover border border-app transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-center font-mono text-xs font-black text-app-muted group-hover:text-app-primary">
                  {item.rank}
                </span>
                <ArtworkThumb
                  src={item.artworkUrl}
                  alt={item.name}
                  sizeClass="w-11 h-11"
                  roundedClass={topTab === 'artists' ? 'rounded-full' : 'rounded-xl'}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-app-primary truncate font-display">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-app-muted truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-mono font-bold text-app-primary">
                  {item.plays.toLocaleString()} <span className="text-[10px] text-app-muted">plays</span>
                </p>
                <p className="text-[10px] font-mono text-app-muted">{item.sharePercent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Scrobbles Preview */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-app-secondary font-display uppercase tracking-wider">
            Recent Scrobble Stream
          </h3>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-medium text-app-muted hover:text-app-primary flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-app rounded-2xl bg-app-card border border-app overflow-hidden">
          {scrobbles.slice(0, 6).map((s) => {
            const trk = getTrackById(s.trackId);
            if (!trk) return null;
            return (
              <div
                key={s.id}
                onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                className="flex items-center justify-between p-3 hover:bg-app-hover transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ArtworkThumb src={trk.artworkUrl} alt={trk.title} sizeClass="w-9 h-9" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-app-primary truncate">
                      {trk.title}
                    </p>
                    <p className="text-[11px] text-app-muted truncate">{trk.artistName}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-app-muted shrink-0 ml-2">
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
