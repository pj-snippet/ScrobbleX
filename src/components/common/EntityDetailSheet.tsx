import React from 'react';
import {
  Heart,
  ChevronRight,
  Disc,
  Music2,
  User2,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AccentColor, Scrobble, Track } from '../../types/music';
import {
  formatDateHuman,
  formatDuration,
  formatTimeUTC,
  getAlbumStatistics,
  getArtistStatistics,
  getTrackById,
  getTrackStatistics,
} from '../../features/analytics/services/analyticsEngine';
import { ACCENT_THEMES } from '../../features/themes/themeRegistry';
import { ArtworkThumb, BottomSheetModal } from '../ui/MobilePrimitives';

export type SelectedEntity =
  | { type: 'track'; id: string }
  | { type: 'artist'; id: string }
  | { type: 'album'; id: string }
  | null;

interface EntityDetailSheetProps {
  selectedEntity: SelectedEntity;
  onClose: () => void;
  scrobbles: Scrobble[];
  lovedTrackIds: Set<string>;
  onToggleLoved: (trackId: string) => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor?: AccentColor;
}

export const EntityDetailSheet: React.FC<EntityDetailSheetProps> = ({
  selectedEntity,
  onClose,
  scrobbles,
  lovedTrackIds,
  onToggleLoved,
  onSelectEntity,
  accentColor = 'blue',
}) => {
  if (!selectedEntity) return null;

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  if (selectedEntity.type === 'track') {
    const stats = getTrackStatistics(scrobbles, selectedEntity.id);
    if (!stats) return null;
    const isLoved = lovedTrackIds.has(stats.track.id);

    return (
      <BottomSheetModal
        isOpen={Boolean(selectedEntity)}
        onClose={onClose}
        title="Track Telemetry"
        subtitle="Detailed listening metrics & history"
      >
        <div className="space-y-4">
          {/* Header Card */}
          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <ArtworkThumb
              src={stats.track.artworkUrl}
              alt={stats.track.title}
              sizeClass="w-16 h-16"
              roundedClass="rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white truncate font-display">
                {stats.track.title}
              </h4>
              <button
                onClick={() => onSelectEntity({ type: 'artist', id: stats.track.artistId })}
                className="text-xs text-slate-400 hover:text-slate-200 truncate flex items-center gap-1 mt-0.5"
              >
                <User2 className="w-3 h-3 text-slate-500" />
                <span className="truncate">{stats.track.artistName}</span>
              </button>
              <button
                onClick={() => onSelectEntity({ type: 'album', id: stats.track.albumId })}
                className="text-xs text-slate-500 hover:text-slate-300 truncate flex items-center gap-1 mt-0.5"
              >
                <Disc className="w-3 h-3 text-slate-600" />
                <span className="truncate">{stats.track.albumTitle}</span>
              </button>
            </div>
            <button
              onClick={() => onToggleLoved(stats.track.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isLoved
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-rose-400 hover:bg-slate-800'
              }`}
              title={isLoved ? 'Remove from Loved Tracks' : 'Add to Loved Tracks'}
            >
              <Heart className={`w-5 h-5 ${isLoved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                Total Plays
              </span>
              <p className="text-xl font-bold font-mono text-slate-100 mt-0.5">
                {stats.totalPlays.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">
                {stats.totalDurationFormatted} listening
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                Track Length
              </span>
              <p className="text-xl font-bold font-mono text-slate-100 mt-0.5">
                {formatDuration(stats.track.durationSec)}
              </p>
              <span className="text-[11px] text-slate-500 font-mono">
                {stats.track.durationSec === null
                  ? 'Duration unavailable'
                  : `${Math.floor(stats.track.durationSec / 60)}:${String(
                      stats.track.durationSec % 60
                    ).padStart(2, '0')} min`}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                First Listened
              </span>
              <p className="text-xs font-semibold text-slate-200 mt-1">
                {stats.firstPlayedDate}
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                Last Listened
              </span>
              <p className="text-xs font-semibold text-slate-200 mt-1">
                {stats.lastPlayedDate}
              </p>
            </div>
          </div>

          {/* Monthly Trajectory Bar Chart */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">12-Month Play Trajectory</span>
              <span className="font-mono text-slate-500 text-[10px]">Monthly Activity</span>
            </div>
            <div className="flex items-end gap-1.5 h-20 pt-4">
              {stats.monthlyTimeline.map((item) => {
                const maxPlays = Math.max(
                  ...stats.monthlyTimeline.map((m) => m.plays),
                  1
                );
                const heightPercent = Math.max(8, (item.plays / maxPlays) * 100);
                return (
                  <div
                    key={item.monthKey}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end group"
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-xs transition-all ${
                        item.plays > 0
                          ? `${theme.primaryBg} group-hover:brightness-125`
                          : 'bg-slate-800/60'
                      }`}
                    />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">
                      {item.label.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Scrobble History */}
          {stats.recentPlays.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Recent Scrobble Logs
              </span>
              <div className="divide-y divide-slate-800/60 bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden">
                {stats.recentPlays.map((scrobble) => (
                  <div
                    key={scrobble.id}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{formatDateHuman(scrobble.dateKey)}</span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {formatTimeUTC(scrobble.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheetModal>
    );
  }

  if (selectedEntity.type === 'artist') {
    const stats = getArtistStatistics(scrobbles, selectedEntity.id);
    if (!stats) return null;

    return (
      <BottomSheetModal
        isOpen={Boolean(selectedEntity)}
        onClose={onClose}
        title="Artist Analytics"
        subtitle={stats.artist.primaryGenre}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <ArtworkThumb
              src={stats.artist.artworkUrl}
              alt={stats.artist.name}
              sizeClass="w-16 h-16"
              roundedClass="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-white truncate font-display">
                {stats.artist.name}
              </h4>
              <p className="text-xs text-slate-400">{stats.artist.primaryGenre}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                <span className="text-slate-300 font-semibold">
                  {stats.totalPlays.toLocaleString()} plays
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{stats.totalDurationFormatted}</span>
              </div>
            </div>
          </div>

          {/* Top Tracks by this Artist */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Top Catalog Tracks ({stats.topTracks.length})
            </span>
            <div className="space-y-1.5">
              {stats.topTracks.map((trk) => {
                const isLoved = lovedTrackIds.has(trk.id);
                return (
                  <div
                    key={trk.id}
                    onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center">
                        {trk.rank}
                      </span>
                      <ArtworkThumb src={trk.artworkUrl} alt={trk.name} sizeClass="w-9 h-9" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                          {trk.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {trk.plays} plays ({trk.sharePercent}%)
                        </p>
                      </div>
                    </div>
                    {isLoved && <Heart className="w-4 h-4 text-rose-500 fill-current shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </BottomSheetModal>
    );
  }

  if (selectedEntity.type === 'album') {
    const stats = getAlbumStatistics(scrobbles, selectedEntity.id);
    if (!stats) return null;

    return (
      <BottomSheetModal
        isOpen={Boolean(selectedEntity)}
        onClose={onClose}
        title="Album Analytics"
        subtitle={stats.album.artistName}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <ArtworkThumb
              src={stats.album.artworkUrl}
              alt={stats.album.title}
              sizeClass="w-16 h-16"
              roundedClass="rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white truncate font-display">
                {stats.album.title}
              </h4>
              <button
                onClick={() => onSelectEntity({ type: 'artist', id: stats.album.artistId })}
                className="text-xs text-slate-400 hover:text-slate-200 truncate block mt-0.5"
              >
                {stats.album.artistName}
              </button>
              <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-400">
                <span>{stats.album.releaseYear}</span>
                <span>·</span>
                <span className="text-slate-200 font-semibold">
                  {stats.totalPlays.toLocaleString()} total plays
                </span>
              </div>
            </div>
          </div>

          {/* Album Tracks */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Tracks on Album
            </span>
            <div className="space-y-1.5">
              {stats.tracks.map((trk) => (
                <div
                  key={trk.id}
                  onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ArtworkThumb src={trk.artworkUrl} alt={trk.name} sizeClass="w-8 h-8" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                        {trk.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{trk.plays} plays</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </BottomSheetModal>
    );
  }

  return null;
};
