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
import { AccentColor, Scrobble, Track } from '../types/music';
import {
  formatDateHuman,
  formatDuration,
  formatTimeUTC,
  getAlbumStatistics,
  getArtistStatistics,
  getTrackById,
  getTrackStatistics,
} from '../domain/analyticsEngine';
import { ArtworkThumb, BottomSheetModal } from './MobilePrimitives';
import { useTheme } from '../context/ThemeContext';

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
}) => {
  const { tokens } = useTheme();

  if (!selectedEntity) return null;

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
          <div className="flex items-center gap-4 bg-app-card p-4 rounded-2xl border border-app">
            <ArtworkThumb
              src={stats.track.artworkUrl}
              alt={stats.track.title}
              sizeClass="w-16 h-16"
              roundedClass="rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-app-primary truncate font-display">
                {stats.track.title}
              </h4>
              <button
                onClick={() => onSelectEntity({ type: 'artist', id: stats.track.artistId })}
                className="text-xs text-app-muted hover:text-app-primary truncate flex items-center gap-1 mt-0.5"
              >
                <User2 className="w-3 h-3 text-app-muted" />
                <span className="truncate">{stats.track.artistName}</span>
              </button>
              <button
                onClick={() => onSelectEntity({ type: 'album', id: stats.track.albumId })}
                className="text-xs text-app-muted hover:text-app-primary truncate flex items-center gap-1 mt-0.5"
              >
                <Disc className="w-3 h-3 text-app-muted" />
                <span className="truncate">{stats.track.albumTitle}</span>
              </button>
            </div>
            <button
              onClick={() => onToggleLoved(stats.track.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isLoved
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-app-subcard text-app-muted border-app hover:text-rose-400'
              }`}
              title={isLoved ? 'Remove from Loved Tracks' : 'Add to Loved Tracks'}
            >
              <Heart className={`w-5 h-5 ${isLoved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-app-subcard p-3 rounded-xl border border-app">
              <span className="text-[10px] uppercase font-mono text-app-muted font-semibold">
                Total Plays
              </span>
              <p className="text-xl font-bold font-mono text-app-primary mt-0.5">
                {stats.totalPlays.toLocaleString()}
              </p>
              <span className="text-[11px] text-app-muted">
                {stats.totalDurationFormatted} listening
              </span>
            </div>

            <div className="bg-app-subcard p-3 rounded-xl border border-app">
              <span className="text-[10px] uppercase font-mono text-app-muted font-semibold">
                Track Length
              </span>
              <p className="text-xl font-bold font-mono text-app-primary mt-0.5">
                {formatDuration(stats.track.durationSec)}
              </p>
              <span className="text-[11px] text-app-muted font-mono">
                {Math.floor(stats.track.durationSec / 60)}:
                {String(stats.track.durationSec % 60).padStart(2, '0')} min
              </span>
            </div>

            <div className="bg-app-subcard p-3 rounded-xl border border-app">
              <span className="text-[10px] uppercase font-mono text-app-muted font-semibold">
                First Listened
              </span>
              <p className="text-xs font-semibold text-app-secondary mt-1">
                {stats.firstPlayedDate}
              </p>
            </div>

            <div className="bg-app-subcard p-3 rounded-xl border border-app">
              <span className="text-[10px] uppercase font-mono text-app-muted font-semibold">
                Last Listened
              </span>
              <p className="text-xs font-semibold text-app-secondary mt-1">
                {stats.lastPlayedDate}
              </p>
            </div>
          </div>

          {/* Monthly Trajectory Bar Chart */}
          <div className="bg-app-card p-4 rounded-2xl border border-app space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-app-primary">12-Month Play Trajectory</span>
              <span className="font-mono text-app-muted text-[10px]">Monthly Activity</span>
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
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: item.plays > 0 ? tokens.accentPrimary : tokens.heatmapEmpty,
                      }}
                      className="w-full rounded-xs transition-all group-hover:brightness-125"
                    />
                    <span className="text-[8px] font-mono text-app-muted uppercase">
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
              <span className="text-xs font-semibold text-app-muted uppercase tracking-wider font-mono">
                Recent Scrobble Logs
              </span>
              <div className="divide-y divide-app bg-app-subcard rounded-xl border border-app overflow-hidden">
                {stats.recentPlays.map((scrobble) => (
                  <div
                    key={scrobble.id}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-app-muted" />
                      <span className="text-app-secondary">{formatDateHuman(scrobble.dateKey)}</span>
                    </div>
                    <span className="font-mono text-app-muted text-[11px]">
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
          <div className="flex items-center gap-4 bg-app-card p-4 rounded-2xl border border-app">
            <ArtworkThumb
              src={stats.artist.artworkUrl}
              alt={stats.artist.name}
              sizeClass="w-16 h-16"
              roundedClass="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-app-primary truncate font-display">
                {stats.artist.name}
              </h4>
              <p className="text-xs text-app-muted">{stats.artist.primaryGenre}</p>
              <p className="text-[11px] font-mono text-accent mt-0.5">
                {stats.totalPlays.toLocaleString()} total scrobbles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-app-subcard p-2.5 rounded-xl border border-app">
              <span className="text-[10px] font-mono uppercase text-app-muted">Unique Tracks</span>
              <p className="text-base font-bold font-mono text-app-primary mt-0.5">
                {stats.uniqueTracksCount}
              </p>
            </div>
            <div className="bg-app-subcard p-2.5 rounded-xl border border-app">
              <span className="text-[10px] font-mono uppercase text-app-muted">Albums</span>
              <p className="text-base font-bold font-mono text-app-primary mt-0.5">
                {stats.uniqueAlbumsCount}
              </p>
            </div>
            <div className="bg-app-subcard p-2.5 rounded-xl border border-app">
              <span className="text-[10px] font-mono uppercase text-app-muted">Catalog Share</span>
              <p className="text-base font-bold font-mono text-app-primary mt-0.5">
                {stats.listeningSharePercent}%
              </p>
            </div>
          </div>

          {/* Top Tracks List */}
          {stats.topTracks.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-app-muted uppercase tracking-wider font-mono">
                Top Tracks in Your Library
              </span>
              <div className="divide-y divide-app bg-app-subcard rounded-xl border border-app overflow-hidden">
                {stats.topTracks.slice(0, 5).map((track, i) => (
                  <div
                    key={track.id}
                    onClick={() => onSelectEntity({ type: 'track', id: track.id })}
                    className="flex items-center justify-between p-3 hover:bg-app-hover transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-app-muted group-hover:text-accent">
                        {i + 1}
                      </span>
                      <ArtworkThumb src={track.artworkUrl} alt={track.name} sizeClass="w-9 h-9" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-app-primary truncate group-hover:text-accent transition-colors font-display">
                          {track.name}
                        </p>
                        <p className="text-[10px] text-app-muted truncate">{track.subtitle}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-app-primary shrink-0 ml-2">
                      {track.plays} plays
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

  if (selectedEntity.type === 'album') {
    const stats = getAlbumStatistics(scrobbles, selectedEntity.id);
    if (!stats) return null;

    return (
      <BottomSheetModal
        isOpen={Boolean(selectedEntity)}
        onClose={onClose}
        title="Album Analytics"
        subtitle={`${stats.album.artistName} (${stats.album.releaseYear})`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-app-card p-4 rounded-2xl border border-app">
            <ArtworkThumb
              src={stats.album.artworkUrl}
              alt={stats.album.title}
              sizeClass="w-16 h-16"
              roundedClass="rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-app-primary truncate font-display">
                {stats.album.title}
              </h4>
              <button
                onClick={() => onSelectEntity({ type: 'artist', id: stats.album.artistId })}
                className="text-xs text-app-muted hover:text-app-primary truncate block mt-0.5"
              >
                {stats.album.artistName}
              </button>
              <p className="text-[11px] font-mono text-accent mt-0.5">
                {stats.totalPlays.toLocaleString()} total scrobbles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-app-subcard p-2.5 rounded-xl border border-app">
              <span className="text-[10px] font-mono uppercase text-app-muted">Unique Tracks</span>
              <p className="text-base font-bold font-mono text-app-primary mt-0.5">
                {stats.uniqueTracksCount}
              </p>
            </div>
            <div className="bg-app-subcard p-2.5 rounded-xl border border-app">
              <span className="text-[10px] font-mono uppercase text-app-muted">Total Time</span>
              <p className="text-base font-bold font-mono text-app-primary mt-0.5">
                {stats.totalDurationFormatted}
              </p>
            </div>
          </div>

          {stats.tracklist.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-app-muted uppercase tracking-wider font-mono">
                Album Scrobble Breakdown
              </span>
              <div className="divide-y divide-app bg-app-subcard rounded-xl border border-app overflow-hidden">
                {stats.tracklist.map((track, i) => (
                  <div
                    key={track.id}
                    onClick={() => onSelectEntity({ type: 'track', id: track.id })}
                    className="flex items-center justify-between p-3 hover:bg-app-hover transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-app-muted group-hover:text-accent">
                        {i + 1}
                      </span>
                      <p className="text-xs font-bold text-app-primary truncate group-hover:text-accent transition-colors font-display">
                        {track.name}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-app-primary shrink-0 ml-2">
                      {track.plays} plays
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

  return null;
};
