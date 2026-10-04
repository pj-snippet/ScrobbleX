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
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface TimelineScreenProps {
  scrobbles: Scrobble[];
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor?: AccentColor;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  scrobbles,
  onSelectEntity,
}) => {
  const { tokens } = useTheme();
  const [preset, setPreset] = useState<TimelinePeriodPreset>('q1_vs_q3_2026');
  const [entityType, setEntityType] = useState<'artists' | 'tracks' | 'albums'>('artists');
  const [filterGroup, setFilterGroup] = useState<'all' | 'rose' | 'fell' | 'new' | 'dropped'>('all');

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
          <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span>Listening Evolution & Timeline</span>
          </h3>
          <p className="text-[11px] text-app-muted mt-0.5">
            Compare taste shifts across historical windows
          </p>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-app-card rounded-2xl border border-app">
          {[
            { id: 'q1_vs_q3_2026' as const, label: 'Q1 vs Q3' },
            { id: 'q2_vs_q3_2026' as const, label: 'Q2 vs Q3' },
            { id: 'aug_vs_sep_2026' as const, label: 'Aug vs Sep' },
          ].map((item) => {
            const isSelected = preset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPreset(item.id)}
                style={{
                  backgroundColor: isSelected ? tokens.accentPrimary : 'transparent',
                  color: isSelected ? tokens.accentContrast : tokens.textMuted,
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isSelected ? 'shadow-xs font-bold' : 'hover:text-app-primary'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entity Selector (Artists / Tracks / Albums) */}
      <div className="flex items-center justify-between border-b border-app pb-2">
        <div className="flex items-center gap-2">
          {(['artists', 'tracks', 'albums'] as const).map((type) => {
            const isSelected = entityType === type;
            return (
              <button
                key={type}
                onClick={() => setEntityType(type)}
                style={{
                  backgroundColor: isSelected ? tokens.accentSubtle : 'transparent',
                  color: isSelected ? tokens.accentPrimary : tokens.textMuted,
                }}
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isSelected ? 'font-bold' : 'hover:text-app-primary'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-app-muted">
          {report.periodALabel} → {report.periodBLabel}
        </span>
      </div>

      {/* 4 Summary Stats Bar */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => setFilterGroup(filterGroup === 'rose' ? 'all' : 'rose')}
          style={{
            borderColor: filterGroup === 'rose' ? tokens.accentPrimary : undefined,
          }}
          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
            filterGroup === 'rose'
              ? 'bg-app-hover ring-1 ring-accent'
              : 'bg-app-card border-app hover:bg-app-hover'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="text-sm font-bold font-mono">{report.rose.length}</span>
          </div>
          <p className="text-[10px] text-app-muted mt-0.5">Climbed</p>
        </button>

        <button
          onClick={() => setFilterGroup(filterGroup === 'fell' ? 'all' : 'fell')}
          style={{
            borderColor: filterGroup === 'fell' ? tokens.accentPrimary : undefined,
          }}
          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
            filterGroup === 'fell'
              ? 'bg-app-hover ring-1 ring-accent'
              : 'bg-app-card border-app hover:bg-app-hover'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-rose-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span className="text-sm font-bold font-mono">{report.fell.length}</span>
          </div>
          <p className="text-[10px] text-app-muted mt-0.5">Dropped</p>
        </button>

        <button
          onClick={() => setFilterGroup(filterGroup === 'new' ? 'all' : 'new')}
          style={{
            borderColor: filterGroup === 'new' ? tokens.accentPrimary : undefined,
          }}
          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
            filterGroup === 'new'
              ? 'bg-app-hover ring-1 ring-accent'
              : 'bg-app-card border-app hover:bg-app-hover'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-sm font-bold font-mono">{report.newEntries.length}</span>
          </div>
          <p className="text-[10px] text-app-muted mt-0.5">New</p>
        </button>

        <button
          onClick={() => setFilterGroup(filterGroup === 'dropped' ? 'all' : 'dropped')}
          style={{
            borderColor: filterGroup === 'dropped' ? tokens.accentPrimary : undefined,
          }}
          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
            filterGroup === 'dropped'
              ? 'bg-app-hover ring-1 ring-accent'
              : 'bg-app-card border-app hover:bg-app-hover'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-app-muted">
            <MinusCircle className="w-3.5 h-3.5" />
            <span className="text-sm font-bold font-mono">{report.droppedEntries.length}</span>
          </div>
          <p className="text-[10px] text-app-muted mt-0.5">Faded</p>
        </button>
      </div>

      {/* Movement List */}
      <div className="space-y-2">
        {displayedItems.length === 0 && (
          <div className="p-8 text-center bg-app-card rounded-2xl border border-app text-xs text-app-muted">
            No movements recorded for this filter in the selected timeline window.
          </div>
        )}

        {displayedItems.map((item) => {
          let rankBadgeClass = 'text-app-muted bg-app-subcard';
          let icon = null;
          let rankText = '=';

          if (item.status === 'new') {
            rankBadgeClass = 'text-accent bg-accent-subtle';
            rankText = 'NEW';
          } else if (item.status === 'dropped') {
            rankBadgeClass = 'text-rose-400 bg-rose-500/10';
            rankText = 'OUT';
          } else if (item.rankDelta > 0) {
            rankBadgeClass = 'text-emerald-400 bg-emerald-500/10';
            icon = <ArrowUpRight className="w-3 h-3" />;
            rankText = `+${item.rankDelta}`;
          } else if (item.rankDelta < 0) {
            rankBadgeClass = 'text-rose-400 bg-rose-500/10';
            icon = <ArrowDownRight className="w-3 h-3" />;
            rankText = `${item.rankDelta}`;
          }

          return (
            <div
              key={item.id}
              onClick={() => {
                if (entityType === 'artists') onSelectEntity({ type: 'artist', id: item.id });
                else if (entityType === 'tracks') onSelectEntity({ type: 'track', id: item.id });
                else onSelectEntity({ type: 'album', id: item.id });
              }}
              className="flex items-center justify-between p-3 rounded-2xl bg-app-card hover:bg-app-hover border border-app transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Movement Badge */}
                <div
                  className={`w-10 h-7 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${rankBadgeClass}`}
                >
                  {icon}
                  <span>{rankText}</span>
                </div>

                <ArtworkThumb
                  src={item.artworkUrl}
                  alt={item.name}
                  sizeClass="w-10 h-10"
                  roundedClass={entityType === 'artists' ? 'rounded-full' : 'rounded-xl'}
                />

                <div className="min-w-0">
                  <p className="text-xs font-bold text-app-primary truncate font-display group-hover:text-accent transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-app-muted truncate font-mono">
                    {item.periodARank ? `#${item.periodARank}` : '—'} → {item.periodBRank ? `#${item.periodBRank}` : '—'}
                  </p>
                </div>
              </div>

              {/* Plays Shift */}
              <div className="text-right shrink-0 ml-2">
                <span className="text-xs font-mono font-bold text-app-primary block">
                  {item.periodBPlays} plays
                </span>
                <span className="text-[10px] font-mono text-app-muted">
                  from {item.periodAPlays}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
