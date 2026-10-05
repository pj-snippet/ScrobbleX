import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Scrobble } from '../../../types/music';
import { formatRelativeTime, getTrackById } from '../../../features/analytics/services/analyticsEngine';
import { ArtworkThumb } from '../../../components/ui/MobilePrimitives';
import type { SelectedEntity } from '../../../components/common/EntityDetailSheet';

interface RecentScrobblesPreviewProps {
  scrobbles: Scrobble[];
  onSelectEntity: (entity: SelectedEntity) => void;
  onViewAll: () => void;
}

export const RecentScrobblesPreview: React.FC<RecentScrobblesPreviewProps> = ({
  scrobbles,
  onSelectEntity,
  onViewAll,
}) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider">
        Recent Scrobble Stream
      </h3>
      <button
        onClick={onViewAll}
        className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
      >
        <span>View All</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>

    <div className="divide-y divide-slate-800/60 rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
      {scrobbles.slice(0, 6).map((scrobble) => {
        const track = getTrackById(scrobble.trackId);
        if (!track) return null;
        return (
          <div
            key={scrobble.id}
            onClick={() => onSelectEntity({ type: 'track', id: track.id })}
            className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <ArtworkThumb src={track.artworkUrl} alt={track.title} sizeClass="w-9 h-9" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                  {track.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-2">
              {formatRelativeTime(scrobble.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);
