import React from 'react';
import { Heart } from 'lucide-react';
import type { AccentColor, Scrobble, Track } from '../../../types/music';
import { formatRelativeTime } from '../../analytics/services/analyticsEngine';
import { ACCENT_THEMES } from '../../themes/themeRegistry';
import { ArtworkThumb } from '../../../components/ui/MobilePrimitives';
import type { SelectedEntity } from '../../../components/common/EntityDetailSheet';

interface LiveTelemetryCardProps {
  scrobble: Scrobble | null;
  track: Track;
  isNowPlaying: boolean;
  lovedTrackIds: Set<string>;
  accentColor: AccentColor;
  onSelectEntity: (entity: SelectedEntity) => void;
  onToggleLoved: (trackId: string) => void;
}

export const LiveTelemetryCard: React.FC<LiveTelemetryCardProps> = ({
  scrobble,
  track,
  isNowPlaying,
  lovedTrackIds,
  accentColor,
  onSelectEntity,
  onToggleLoved,
}) => {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;
  const selectTrack = () => onSelectEntity({ type: 'track', id: track.id });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1424] to-[#0A0D18] border border-slate-800 p-4 shadow-xl">
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-300">
          <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isNowPlaying ? 'animate-pulse' : ''}`} />
          <span>{isNowPlaying ? 'NOW PLAYING' : 'LAST SCROBBLE'}</span>
        </div>
        {scrobble && !isNowPlaying && (
          <span className="text-[11px] font-mono text-slate-400">
            {formatRelativeTime(scrobble.timestamp)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer group" onClick={selectTrack}>
          <ArtworkThumb
            src={track.artworkUrl}
            alt={track.title}
            sizeClass="w-18 h-18"
            roundedClass="rounded-2xl"
          />
          <div className="absolute inset-0 bg-black/20 rounded-2xl group-hover:bg-transparent transition-colors" />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            onClick={selectTrack}
            className="text-base font-bold text-white truncate cursor-pointer hover:underline font-display"
          >
            {track.title}
          </h3>
          <p
            onClick={() => onSelectEntity({ type: 'artist', id: track.artistId })}
            className="text-xs text-slate-300 truncate cursor-pointer hover:text-white mt-0.5"
          >
            {track.artistName}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{track.albumTitle}</p>
          <div className="flex items-center gap-1 mt-2.5 h-3">
            <span className={`w-1 h-3 rounded-full ${theme.primaryBg} animate-pulse`} />
            <span className={`w-1 h-2 rounded-full ${theme.primaryBg} animate-bounce`} />
            <span className={`w-1 h-3.5 rounded-full ${theme.primaryBg} animate-pulse`} />
            <span className={`w-1 h-1.5 rounded-full ${theme.primaryBg} animate-bounce`} />
            <span className={`w-1 h-2.5 rounded-full ${theme.primaryBg} animate-pulse`} />
            <span className="text-[10px] font-mono text-slate-400 ml-2">
              {isNowPlaying ? 'Playing now' : 'Scrobbled to Last.fm'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onToggleLoved(track.id)}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Heart className={`w-5 h-5 ${lovedTrackIds.has(track.id) ? 'text-rose-500 fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};
