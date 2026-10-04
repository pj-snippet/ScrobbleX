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
} from '../types/music';
import { getRediscoverCandidates } from '../domain/analyticsEngine';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface RediscoverScreenProps {
  scrobbles: Scrobble[];
  lovedTrackIds: Set<string>;
  onToggleLoved: (trackId: string) => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor?: AccentColor;
}

export const RediscoverScreen: React.FC<RediscoverScreenProps> = ({
  scrobbles,
  lovedTrackIds,
  onToggleLoved,
  onSelectEntity,
}) => {
  const { tokens } = useTheme();
  const [activeCategory, setActiveCategory] = useState<RediscoverCategory | 'all'>('all');
  const [minPlays, setMinPlays] = useState<number>(20);
  const [minDormantDays, setMinDormantDays] = useState<number>(60);
  const [showConfig, setShowConfig] = useState(false);

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
            <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Rediscovery Engine</span>
            </h3>
            <p className="text-[11px] text-app-muted mt-0.5">
              Tracks you loved but haven't played recently
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              backgroundColor: showConfig ? tokens.accentSubtle : undefined,
              color: showConfig ? tokens.accentPrimary : tokens.textMuted,
              borderColor: showConfig ? tokens.accentBorder : undefined,
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showConfig ? '' : 'bg-app-card border-app hover:text-app-primary'
            }`}
            title="Configure Algorithm Thresholds"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Algorithm Configuration Accordion */}
        {showConfig && (
          <div className="p-4 rounded-2xl bg-app-card border border-app space-y-4 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-app-secondary uppercase font-mono tracking-wider">
              Mathematical Evidence Criteria
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono text-app-secondary mb-1">
                  <span>Minimum Historical Scrobbles:</span>
                  <span style={{ color: tokens.accentPrimary }} className="font-bold">
                    {minPlays} plays
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={minPlays}
                  onChange={(e) => setMinPlays(Number(e.target.value))}
                  style={{ accentColor: tokens.accentPrimary }}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-app-secondary mb-1">
                  <span>Minimum Days Since Last Played:</span>
                  <span style={{ color: tokens.accentPrimary }} className="font-bold">
                    {minDormantDays} days
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="15"
                  value={minDormantDays}
                  onChange={(e) => setMinDormantDays(Number(e.target.value))}
                  style={{ accentColor: tokens.accentPrimary }}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((c) => {
            const isSelected = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                style={{
                  backgroundColor: isSelected ? tokens.accentPrimary : undefined,
                  color: isSelected ? tokens.accentContrast : tokens.textMuted,
                  borderColor: isSelected ? tokens.accentPrimary : undefined,
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                  isSelected ? 'font-bold shadow-xs' : 'bg-app-card border-app hover:text-app-primary'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Candidate Tracks List */}
      <div className="space-y-2.5">
        {filteredCandidates.length === 0 && (
          <div className="p-8 text-center bg-app-card rounded-2xl border border-app text-xs text-app-muted space-y-1">
            <p>No tracks match the current dormancy thresholds.</p>
            <p className="text-[11px] text-app-muted">Try lowering the minimum plays threshold.</p>
          </div>
        )}

        {filteredCandidates.map((c) => {
          let badgeText = 'Forgotten Favorite';
          let badgeColor = 'text-accent bg-accent-subtle';

          if (c.category === 'old_obsessions') {
            badgeText = 'Old Obsession';
            badgeColor = 'text-amber-400 bg-amber-500/10';
          } else if (c.category === 'fading_favorites') {
            badgeText = 'Fading Favorite';
            badgeColor = 'text-purple-400 bg-purple-500/10';
          } else if (c.category === 'recently_returned') {
            badgeText = 'Recently Returned';
            badgeColor = 'text-emerald-400 bg-emerald-500/10';
          }

          return (
            <div
              key={c.trackId}
              onClick={() => onSelectEntity({ type: 'track', id: c.trackId })}
              className="p-3.5 rounded-2xl bg-app-card hover:bg-app-hover border border-app transition-all cursor-pointer space-y-3 group shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ArtworkThumb src={c.artworkUrl} alt={c.title} sizeClass="w-12 h-12" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-app-primary truncate font-display group-hover:text-accent transition-colors">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-app-muted truncate mt-0.5">{c.artistName}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-bold mt-1 ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLoved(c.trackId);
                  }}
                  className="p-2 rounded-xl bg-app-subcard hover:bg-app-hover text-app-muted hover:text-rose-400 transition-colors"
                  aria-label="Toggle Loved"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      lovedTrackIds.has(c.trackId) ? 'text-rose-500 fill-current' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Mathematical Evidence Footnote */}
              <div className="p-2.5 rounded-xl bg-app-subcard border border-app text-[11px] font-mono flex items-center justify-between text-app-muted">
                <span>{c.evidenceExplanation}</span>
                <span className="font-bold text-app-primary">{c.totalHistoricalPlays} plays</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
