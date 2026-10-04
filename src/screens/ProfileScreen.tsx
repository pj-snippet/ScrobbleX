import React from 'react';
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
  Radio,
} from 'lucide-react';
import { AccentColor, Scrobble, UserProfile } from '../types/music';
import {
  formatDuration,
  getOverviewSummary,
  getTrackById,
} from '../domain/analyticsEngine';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface ProfileScreenProps {
  userProfile: UserProfile | null;
  scrobbles: Scrobble[];
  lovedTrackIds: Set<string>;
  onSelectEntity: (entity: SelectedEntity) => void;
  onNavigateTab: (tabId: string) => void;
  accentColor?: AccentColor;
  onLaunchStory?: (preset?: '2026' | '2025' | '12m' | '6m' | 'all') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  scrobbles,
  lovedTrackIds,
  onSelectEntity,
  onNavigateTab,
  onLaunchStory,
}) => {
  const { tokens } = useTheme();
  const summary = getOverviewSummary(scrobbles, 'all');

  if (!userProfile) {
    return (
      <div className="space-y-6 pb-12">
        <div className="p-8 rounded-3xl bg-app-card border border-app text-center space-y-4 shadow-xl">
          <div
            style={{ backgroundColor: tokens.accentSubtle, borderColor: tokens.accentBorder }}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto text-accent"
          >
            <User2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-app-primary font-display">
              No Last.fm Account Connected
            </h3>
            <p className="text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
              Connect your Last.fm account in Settings to view your profile, member status, and
              music listening intelligence.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <span>Connect Last.fm</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Derive top obsession track from recent scrobbles if not manually pinned
  const topObsessionId =
    userProfile.currentObsessionTrackId ||
    (scrobbles.length > 0 ? scrobbles[0].trackId : undefined);
  const obsessionTrack = topObsessionId ? getTrackById(topObsessionId) : undefined;
  const pinnedTrack = userProfile.pinnedTrackId
    ? getTrackById(userProfile.pinnedTrackId)
    : undefined;

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header */}
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 shadow-xl">
        <div className="flex items-center gap-4">
          <ArtworkThumb
            src={userProfile.avatarUrl}
            alt={userProfile.displayName}
            sizeClass="w-16 h-16"
            roundedClass="rounded-full"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-app-primary truncate font-display">
              {userProfile.displayName}
            </h3>
            <p className="text-xs font-mono text-app-muted truncate">@{userProfile.username}</p>
            <p className="text-[11px] text-app-muted mt-1">
              Member since {userProfile.memberSince} · {userProfile.country}
            </p>
          </div>
        </div>

        {/* 3 Metric Matrix */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-app">
          <div className="p-2.5 rounded-2xl bg-app-subcard">
            <span className="text-[10px] font-mono uppercase text-app-muted">Scrobbles</span>
            <p className="text-base font-bold font-mono text-app-primary mt-0.5">
              {scrobbles.length.toLocaleString()}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-app-subcard">
            <span className="text-[10px] font-mono uppercase text-app-muted">Artists</span>
            <p className="text-base font-bold font-mono text-app-primary mt-0.5">
              {summary.totalArtists}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-app-subcard">
            <span className="text-[10px] font-mono uppercase text-app-muted">Loved</span>
            <p className="text-base font-bold font-mono text-rose-400 mt-0.5">
              {lovedTrackIds.size}
            </p>
          </div>
        </div>
      </div>

      {/* Current Obsession / Pinned Track */}
      {(obsessionTrack || pinnedTrack) && (
        <div className="p-5 rounded-3xl bg-app-card border border-app space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-app pb-2">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-app-primary flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500 fill-current" />
              <span>Current Obsession</span>
            </span>
            <span
              style={{ backgroundColor: tokens.accentSubtle, color: tokens.accentPrimary }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold"
            >
              HEAVY ROTATION
            </span>
          </div>

          {obsessionTrack && (
            <div
              onClick={() => onSelectEntity({ type: 'track', id: obsessionTrack.id })}
              className="flex items-center gap-3.5 p-2 rounded-2xl bg-app-subcard hover:bg-app-hover cursor-pointer transition-all group"
            >
              <ArtworkThumb src={obsessionTrack.artworkUrl} alt={obsessionTrack.title} sizeClass="w-14 h-14" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-app-primary truncate font-display group-hover:text-accent transition-colors">
                  {obsessionTrack.title}
                </h4>
                <p className="text-xs text-app-muted truncate mt-0.5">{obsessionTrack.artistName}</p>
                <p className="text-[10px] text-app-muted truncate">{obsessionTrack.albumTitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app-primary" />
            </div>
          )}
        </div>
      )}

      {/* Quick Links Menu */}
      <div className="rounded-3xl bg-app-card border border-app divide-y divide-app overflow-hidden shadow-xl">
        <button
          onClick={() => onNavigateTab('loved')}
          className="w-full flex items-center justify-between p-4 hover:bg-app-hover transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
            <span className="text-xs font-bold text-app-primary">Loved Tracks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-app-muted">{lovedTrackIds.size}</span>
            <ChevronRight className="w-4 h-4 text-app-muted" />
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('integrity')}
          className="w-full flex items-center justify-between p-4 hover:bg-app-hover transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-app-primary">Listening Integrity Audit</span>
          </div>
          <ChevronRight className="w-4 h-4 text-app-muted" />
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="w-full flex items-center justify-between p-4 hover:bg-app-hover transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-app-muted" />
            <span className="text-xs font-bold text-app-primary">Theme & Sync Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 text-app-muted" />
        </button>
      </div>
    </div>
  );
};
