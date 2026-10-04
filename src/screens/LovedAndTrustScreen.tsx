import React, { useState, useMemo } from 'react';
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  RotateCcw,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { AccentColor, Scrobble } from '../types/music';
import {
  calculateListeningIntegrity,
  getLovedTracksAnalysis,
} from '../domain/analyticsEngine';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface LovedAndTrustScreenProps {
  scrobbles: Scrobble[];
  lovedTrackIds: Set<string>;
  onToggleLoved: (trackId: string) => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  onCleanupDuplicates?: () => void;
  accentColor?: AccentColor;
  initialTab?: 'loved' | 'trust';
}

export const LovedAndTrustScreen: React.FC<LovedAndTrustScreenProps> = ({
  scrobbles,
  lovedTrackIds,
  onToggleLoved,
  onSelectEntity,
  onCleanupDuplicates,
  initialTab = 'loved',
}) => {
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState<'loved' | 'trust'>(initialTab);
  const [lovedFilter, setLovedFilter] = useState<'all' | 'recent' | 'top' | 'dormant'>('all');

  const lovedReport = useMemo(
    () => getLovedTracksAnalysis(scrobbles, lovedTrackIds),
    [scrobbles, lovedTrackIds]
  );

  const trustReport = useMemo(
    () => calculateListeningIntegrity(scrobbles),
    [scrobbles]
  );

  const displayedLoved = useMemo(() => {
    if (lovedFilter === 'recent') return lovedReport.recentlyLoved;
    if (lovedFilter === 'top') return lovedReport.mostPlayedLoved;
    if (lovedFilter === 'dormant') return lovedReport.dormantSixMonths;
    return lovedReport.mostPlayedLoved;
  }, [lovedReport, lovedFilter]);

  return (
    <div className="space-y-5 pb-8">
      {/* Top Segmented Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-app-card rounded-2xl border border-app">
        <button
          onClick={() => setActiveTab('loved')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'loved'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-app-muted hover:text-app-primary'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Loved Tracks ({lovedTrackIds.size})</span>
        </button>

        <button
          onClick={() => setActiveTab('trust')}
          style={{
            backgroundColor: activeTab === 'trust' ? tokens.accentPrimary : 'transparent',
            color: activeTab === 'trust' ? tokens.accentContrast : tokens.textMuted,
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'trust' ? 'shadow-xs' : 'hover:text-app-primary'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Listening Integrity</span>
        </button>
      </div>

      {/* LOVED TRACKS VIEW */}
      {activeTab === 'loved' && (
        <div className="space-y-4">
          {/* Sub Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Loved' },
              { id: 'recent', label: 'Recently Loved' },
              { id: 'top', label: 'Most Played' },
              { id: 'dormant', label: 'Dormant (>6m)' },
            ].map((f) => {
              const isSelected = lovedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setLovedFilter(f.id as any)}
                  style={{
                    backgroundColor: isSelected ? tokens.accentPrimary : undefined,
                    color: isSelected ? tokens.accentContrast : tokens.textMuted,
                    borderColor: isSelected ? tokens.accentPrimary : undefined,
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                    isSelected ? 'font-bold shadow-xs' : 'bg-app-card border-app hover:text-app-primary'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Loved List */}
          <div className="space-y-2">
            {displayedLoved.length === 0 && (
              <div className="p-8 text-center bg-app-card rounded-2xl border border-app text-xs text-app-muted">
                No loved tracks recorded in this category.
              </div>
            )}

            {displayedLoved.map((t) => (
              <div
                key={t.track.id}
                onClick={() => onSelectEntity({ type: 'track', id: t.track.id })}
                className="flex items-center justify-between p-3 rounded-2xl bg-app-card hover:bg-app-hover border border-app transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ArtworkThumb src={t.track.artworkUrl} alt={t.track.title} sizeClass="w-11 h-11" roundedClass="rounded-xl" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-app-primary truncate font-display group-hover:text-accent transition-colors">
                      {t.track.title}
                    </p>
                    <p className="text-[11px] text-app-muted truncate mt-0.5">{t.track.artistName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLoved(t.track.id);
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-400 cursor-pointer"
                    aria-label="Remove loved"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTENING INTEGRITY VIEW */}
      {activeTab === 'trust' && (
        <div className="space-y-4">
          {/* Trust Score Main Gauge */}
          <div className="p-5 rounded-3xl bg-app-card border border-app text-center space-y-3 shadow-xl">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke={tokens.bgCardSub} strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={tokens.accentPrimary}
                  strokeWidth="10"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (trustReport.score / 100) * 314}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-mono text-app-primary">
                  {trustReport.score}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-app-muted">
                  / 100 Score
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-app-primary font-display">
                {trustReport.confidenceLevel}
              </h3>
              <p className="text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
                Deterministic mathematical audit verifying genuine organic scrobble patterns.
              </p>
            </div>
          </div>

          {/* Positive Signals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-app-muted font-display uppercase tracking-wider">
              Verification Signals
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {trustReport.positiveSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="p-3 rounded-2xl bg-app-card border border-app flex items-start gap-2.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-app-primary">{sig.label}</p>
                    <p className="text-[11px] text-app-muted mt-0.5">{sig.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Anomalies / Actions */}
          {trustReport.potentialIssues.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-app-muted font-display uppercase tracking-wider">
                  Audit Findings ({trustReport.potentialIssues.length})
                </h4>
                {onCleanupDuplicates && (
                  <button
                    onClick={onCleanupDuplicates}
                    className="text-[11px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Deduplicate</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {trustReport.potentialIssues.map((anom) => (
                  <div
                    key={anom.id}
                    className="p-3 rounded-2xl bg-app-card border border-rose-500/20 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-app-primary">{anom.label}</p>
                      <p className="text-[11px] text-app-muted mt-0.5">{anom.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
