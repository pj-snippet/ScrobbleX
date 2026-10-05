import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Heart,
  ChevronRight,
  Flame,
  Calendar,
} from 'lucide-react';
import {
  AccentColor,
  RediscoverCandidate,
  RediscoverCategory,
  Scrobble,
} from '../../types/music';
import { getRediscoverCandidates } from '../../features/analytics/services/analyticsEngine';
import { ACCENT_THEMES } from '../../features/themes/themeRegistry';
import { ArtworkThumb } from '../../components/ui/MobilePrimitives';
import { SelectedEntity } from '../../components/common/EntityDetailSheet';

interface RediscoverScreenProps {
  scrobbles: Scrobble[];
  lovedTrackIds: Set<string>;
  onToggleLoved: (trackId: string) => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor: AccentColor;
}

export const RediscoverScreen: React.FC<RediscoverScreenProps> = ({
  scrobbles,
  lovedTrackIds,
  onToggleLoved,
  onSelectEntity,
  accentColor,
}) => {
  const [activeCategory, setActiveCategory] = useState<RediscoverCategory | 'all'>('all');
  const [minPlays, setMinPlays] = useState<number>(20);
  const [minDormantDays, setMinDormantDays] = useState<number>(60);
  const [showConfig, setShowConfig] = useState(false);

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  const candidates = useMemo(() => {
    return getRediscoverCandidates(scrobbles, {
      minHistoricalPlays: minPlays,
      minDormantDays,
    });
  }, [scrobbles, minPlays, minDormantDays]);

  const filteredCandidates = useMemo(() => {
    if (activeCategory === 'all') return candidates;
    return candidates.filter((c) => c.category === activeCategory);
  }, [candidates, activeCategory]);

  const categories: { id: RediscoverCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Candidates' },
    { id: 'forgotten_favorites', label: 'Forgotten' },
    { id: 'fading_favorites', label: 'Fading' },
    { id: 'old_obsessions', label: 'Old Obsessions' },
    { id: 'recently_returned', label: 'Returned' },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header & Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Rediscovery Engine</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tracks you loved but haven't played recently
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showConfig
                ? `${theme.subtleBg} ${theme.primaryText} ${theme.borderClass}`
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Configure Algorithm Thresholds"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Algorithm Configuration Accordion */}
        {showConfig && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Mathematical Evidence Criteria
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Minimum Historical Plays:</span>
                  <span className="font-bold text-white">{minPlays} plays</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={minPlays}
                  onChange={(e) => setMinPlays(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Minimum Dormancy (Days Inactive):</span>
                  <span className="font-bold text-white">{minDormantDays} days</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={minDormantDays}
                  onChange={(e) => setMinDormantDays(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                activeCategory === cat.id
                  ? `${theme.primaryBg} text-white ${theme.borderClass} font-bold shadow-xs`
                  : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Count */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-mono">
        <span>Found {filteredCandidates.length} potential gems</span>
        <span>Ranked by dormancy score</span>
      </div>

      {/* Candidate Cards */}
      <div className="space-y-2.5">
        {filteredCandidates.map((cand) => {
          const isLoved = lovedTrackIds.has(cand.trackId);

          let catBadgeClass = 'bg-slate-800 text-slate-300';
          let catLabel = 'Candidate';
          if (cand.category === 'forgotten_favorites') {
            catBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
            catLabel = 'Forgotten Gem';
          } else if (cand.category === 'fading_favorites') {
            catBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            catLabel = 'Fading Fast';
          } else if (cand.category === 'old_obsessions') {
            catBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            catLabel = 'Past Obsession';
          } else if (cand.category === 'recently_returned') {
            catBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            catLabel = 'Returned';
          }

          return (
            <div
              key={cand.trackId}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${catBadgeClass}`}>
                  {catLabel}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    Inactive <strong className="text-white">{cand.daysSinceLastPlay}d</strong>
                  </span>
                  <button
                    onClick={() => onToggleLoved(cand.trackId)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isLoved ? 'text-rose-500 fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Track Info */}
              <div
                onClick={() => onSelectEntity({ type: 'track', id: cand.trackId })}
                className="flex items-center gap-3.5 cursor-pointer group"
              >
                <ArtworkThumb
                  src={cand.artworkUrl}
                  alt={cand.title}
                  sizeClass="w-12 h-12"
                  roundedClass="rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-white font-display">
                    {cand.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {cand.artistName} · {cand.albumTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-200 font-semibold">{cand.totalHistoricalPlays} total plays</span>
                    <span>·</span>
                    <span>Peak: {cand.peakPeriodLabel}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 shrink-0" />
              </div>

              {/* Mathematical Evidence Statement */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-300 leading-relaxed font-mono">
                {cand.evidenceExplanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
