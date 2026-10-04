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
import { ACCENT_THEMES } from '../domain/themeConfig';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';

interface LovedAndTrustScreenProps {
  scrobbles: Scrobble[];
  lovedTrackIds: Set<string>;
  onToggleLoved: (trackId: string) => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  onCleanupDuplicates?: () => void;
  accentColor: AccentColor;
  initialTab?: 'loved' | 'trust';
}

export const LovedAndTrustScreen: React.FC<LovedAndTrustScreenProps> = ({
  scrobbles,
  lovedTrackIds,
  onToggleLoved,
  onSelectEntity,
  onCleanupDuplicates,
  accentColor,
  initialTab = 'loved',
}) => {
  const [activeTab, setActiveTab] = useState<'loved' | 'trust'>(initialTab);
  const [lovedFilter, setLovedFilter] = useState<'all' | 'recent' | 'top' | 'dormant'>('all');

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

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
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('loved')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'loved'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Loved Tracks ({lovedTrackIds.size})</span>
        </button>

        <button
          onClick={() => setActiveTab('trust')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'trust'
              ? `${theme.primaryBg} text-white shadow-xs`
              : 'text-slate-400 hover:text-white'
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
              { id: 'dormant', label: 'Dormant (6M+)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setLovedFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border ${
                  lovedFilter === f.id
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Loved Tracks Count & Info */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>{displayedLoved.length} tracks in this filter</span>
            <span>{lovedReport.totalLovedPlays.toLocaleString()} total plays</span>
          </div>

          {/* Loved Tracks List */}
          <div className="space-y-2">
            {displayedLoved.map((item) => (
              <div
                key={item.track.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 transition-all group"
              >
                <div
                  onClick={() => onSelectEntity({ type: 'track', id: item.track.id })}
                  className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                >
                  <ArtworkThumb
                    src={item.track.artworkUrl}
                    alt={item.track.title}
                    sizeClass="w-12 h-12"
                    roundedClass="rounded-xl"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-white font-display">
                      {item.track.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.track.artistName} · {item.track.albumTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                      <span className="text-slate-200 font-semibold">{item.plays} plays</span>
                      <span>·</span>
                      <span>Last: {item.lastPlayedFormatted}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onToggleLoved(item.track.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/20 transition-colors ml-2 cursor-pointer"
                  title="Remove from Loved"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTENING INTEGRITY / TRUST VIEW */}
      {activeTab === 'trust' && (
        <div className="space-y-4">
          {/* Trust Score Header Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B1322] to-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Listening Integrity Score
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Data</span>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black font-mono text-white">
                {trustReport.score}
              </span>
              <span className="text-slate-500 font-mono text-sm">/ 100 rating</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Based on algorithmic analysis of {trustReport.evaluatedScrobbles.toLocaleString()} scrobbles
              across {trustReport.timeSpanDays} days. Normal interval distribution is{' '}
              <strong className="text-white">{trustReport.normalIntervalPercent}%</strong>.
            </p>
          </div>

          {/* Positive Signals */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Integrity Validations
            </span>
            <div className="space-y-2">
              {trustReport.positiveSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-200">{sig.label}</p>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        {sig.valueLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {sig.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Potential Issues Detected */}
          {trustReport.potentialIssues.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
                Anomalies Detected ({trustReport.potentialIssues.length})
              </span>
              <div className="space-y-2.5">
                {trustReport.potentialIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <p className="text-xs font-bold text-amber-200">{iss.label}</p>
                      </div>
                      <span className="text-[11px] font-mono text-amber-300 font-bold">
                        {iss.affectedCount} scrobbles
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{iss.detail}</p>

                    {/* Cleanup button if available */}
                    {onCleanupDuplicates && iss.id === 'iss_duplicates' && (
                      <button
                        onClick={onCleanupDuplicates}
                        className="mt-2 w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Deduplicate {iss.affectedCount} Redundant Logs</span>
                      </button>
                    )}
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
