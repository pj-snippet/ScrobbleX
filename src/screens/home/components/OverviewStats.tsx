import React from 'react';
import { Flame } from 'lucide-react';
import type { AccentColor, TimeRangeFilter } from '../../../types/music';
import type { OverviewSummaryMetrics } from '../../../features/analytics/services/analyticsEngine';
import { TimeRangeSelector } from '../../../components/ui/MobilePrimitives';

interface OverviewStatsProps {
  summary: OverviewSummaryMetrics;
  period: TimeRangeFilter;
  accentColor: AccentColor;
  onPeriodChange: (period: TimeRangeFilter) => void;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({
  summary,
  period,
  accentColor,
  onPeriodChange,
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-200 font-display uppercase tracking-wider">
        Listening Overview
      </h3>
      <TimeRangeSelector value={period} onChange={onPeriodChange} accentColor={accentColor} />
    </div>

    <div className="grid grid-cols-2 gap-2.5">
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
          Total Scrobbles
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black font-mono text-white">
            {summary.totalScrobbles.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ~{summary.dailyAverage}/day
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
          Listening Time
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black font-mono text-white">
            {summary.listeningTimeFormatted}
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
          Unique Catalog
        </span>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
          <span className="text-white font-bold">{summary.totalArtists}</span> art ·{' '}
          <span className="text-white font-bold">{summary.totalTracks}</span> trk
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">
          Active Streak
        </span>
        <div className="flex items-center gap-1.5 mt-1 text-xs font-mono">
          <Flame className="w-4 h-4 text-amber-500 fill-current" />
          <span className="text-white font-bold text-sm">{summary.currentStreakDays} days</span>
          <span className="text-slate-500 text-[10px]">
            (max {summary.longestStreakDays}d)
          </span>
        </div>
      </div>
    </div>
  </div>
);
