import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MinusCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  AccentColor,
  Scrobble,
  TimelineComparisonItem,
} from '../types/music';
import {
  getTimelineComparison,
  TimelinePeriodPreset,
} from '../domain/analyticsEngine';
import { ACCENT_THEMES } from '../domain/themeConfig';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';

interface TimelineScreenProps {
  scrobbles: Scrobble[];
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor: AccentColor;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  scrobbles,
  onSelectEntity,
  accentColor,
}) => {
  const [preset, setPreset] = useState<TimelinePeriodPreset>('q1_vs_q3_2026');
  const [entityType, setEntityType] = useState<'artists' | 'tracks' | 'albums'>('artists');
  const [filterGroup, setFilterGroup] = useState<'all' | 'rose' | 'fell' | 'new' | 'dropped'>('all');

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  const report = useMemo(
    () => getTimelineComparison(scrobbles, preset, entityType),
    [scrobbles, preset, entityType]
  );

  const displayedItems = useMemo(() => {
    if (filterGroup === 'rose') return report.rose;
    if (filterGroup === 'fell') return report.fell;
    if (filterGroup === 'new') return report.newEntries;
    if (filterGroup === 'dropped') return report.droppedEntries;
    return report.allItems;
  }, [report, filterGroup]);

  return (
    <div className="space-y-5 pb-8">
      {/* Header & Preset Switcher */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
            <Clock className={`w-4 h-4 ${theme.primaryText}`} />
            <span>Listening Evolution & Timeline</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Compare taste shifts across historical windows
          </p>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
          {[
            { id: 'q1_vs_q3_2026' as const, label: 'Q1 vs Q3' },
            { id: 'q2_vs_q3_2026' as const, label: 'Q2 vs Q3' },
            { id: 'aug_vs_sep_2026' as const, label: 'Aug vs Sep' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPreset(item.id)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                preset === item.id
                  ? `${theme.primaryBg} text-white shadow-xs font-bold`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entity Selector (Artists / Tracks / Albums) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {(['artists', 'tracks', 'albums'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setEntityType(type)}
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                entityType === type
                  ? `${theme.subtleBg} ${theme.primaryText}`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {report.periodALabel.slice(0, 7)} ➔ {report.periodBLabel.slice(0, 7)}
        </span>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <button
          onClick={() => setFilterGroup('rose')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            filterGroup === 'rose'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Rose</span>
          </div>
          <p className="text-lg font-bold font-mono text-white mt-1">{report.rose.length}</p>
        </button>

        <button
          onClick={() => setFilterGroup('fell')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            filterGroup === 'fell'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-bold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Fell</span>
          </div>
          <p className="text-lg font-bold font-mono text-white mt-1">{report.fell.length}</p>
        </button>

        <button
          onClick={() => setFilterGroup('new')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            filterGroup === 'new'
              ? `${theme.subtleBg} ${theme.borderClass} ${theme.primaryText}`
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-blue-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>New</span>
          </div>
          <p className="text-lg font-bold font-mono text-white mt-1">{report.newEntries.length}</p>
        </button>

        <button
          onClick={() => setFilterGroup('dropped')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            filterGroup === 'dropped'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Drop</span>
          </div>
          <p className="text-lg font-bold font-mono text-white mt-1">{report.droppedEntries.length}</p>
        </button>
      </div>

      {filterGroup !== 'all' && (
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400">
            Showing <strong className="text-white capitalize">{filterGroup}</strong> items ({displayedItems.length})
          </span>
          <button
            onClick={() => setFilterGroup('all')}
            className={`font-semibold hover:underline ${theme.primaryText} cursor-pointer`}
          >
            Show All
          </button>
        </div>
      )}

      {/* Comparison Items List */}
      <div className="space-y-2">
        {displayedItems.map((item) => {
          let badgeContent = null;
          if (item.status === 'new') {
            badgeContent = (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${theme.subtleBg} ${theme.primaryText} border ${theme.borderClass}`}>
                NEW #{item.periodBRank}
              </span>
            );
          } else if (item.status === 'dropped') {
            badgeContent = (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                DROPPED
              </span>
            );
          } else if (item.status === 'rose') {
            badgeContent = (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ArrowUpRight className="w-3 h-3" />
                <span>+{item.rankDelta}</span>
              </span>
            );
          } else if (item.status === 'fell') {
            badgeContent = (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <ArrowDownRight className="w-3 h-3" />
                <span>{item.rankDelta}</span>
              </span>
            );
          } else {
            badgeContent = (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500">
                STEADY
              </span>
            );
          }

          return (
            <div
              key={item.id}
              onClick={() => {
                if (entityType === 'artists') onSelectEntity({ type: 'artist', id: item.id });
                else if (entityType === 'tracks') onSelectEntity({ type: 'track', id: item.id });
                else onSelectEntity({ type: 'album', id: item.id });
              }}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ArtworkThumb
                  src={item.artworkUrl}
                  alt={item.name}
                  sizeClass="w-11 h-11"
                  roundedClass={entityType === 'artists' ? 'rounded-full' : 'rounded-xl'}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate group-hover:text-white font-display">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-500">{item.periodAPlays}p</span>
                  <span className="text-slate-600 mx-1">➔</span>
                  <span className="font-bold text-slate-200">{item.periodBPlays}p</span>
                </div>
                {badgeContent}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
