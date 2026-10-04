import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Info,
  PieChart,
} from 'lucide-react';
import {
  AccentColor,
  CalendarMetric,
  DailyActivitySummary,
  HeatmapGranularity,
  HeatmapMetric,
  Scrobble,
  TimeRangeFilter,
  WeeklyHeatmapCell,
} from '../types/music';
import {
  formatDateHuman,
  formatDateLong,
  formatDuration,
  getActivityInsights,
  getDailyActivityCalendar,
  getListeningSessions,
  getWeeklyListeningHeatmap,
} from '../domain/analyticsEngine';
import { ACCENT_THEMES } from '../domain/themeConfig';
import { BottomSheetModal, TimeRangeSelector } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';

interface ActivityScreenProps {
  scrobbles: Scrobble[];
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor: AccentColor;
  onNavigateTab?: (tab: string) => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  scrobbles,
  onSelectEntity,
  accentColor,
  onNavigateTab,
}) => {
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMetric, setCalendarMetric] = useState<CalendarMetric>('plays');

  const [heatmapRange, setHeatmapRange] = useState<TimeRangeFilter>('30d');
  const [heatmapGranularity, setHeatmapGranularity] = useState<HeatmapGranularity>(3);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('plays');

  // Selected Day Sheet
  const [selectedDay, setSelectedDay] = useState<DailyActivitySummary | null>(null);

  // Selected Heatmap Cell Sheet
  const [selectedCell, setSelectedCell] = useState<WeeklyHeatmapCell | null>(null);

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  // Calendar Calculation
  const calendarData = useMemo(
    () => getDailyActivityCalendar(scrobbles, calendarYear, calendarMetric),
    [scrobbles, calendarYear, calendarMetric]
  );

  // Heatmap Calculation
  const heatmapData = useMemo(
    () => getWeeklyListeningHeatmap(scrobbles, heatmapRange, heatmapGranularity, heatmapMetric),
    [scrobbles, heatmapRange, heatmapGranularity, heatmapMetric]
  );

  // Insights
  const insights = useMemo(
    () => getActivityInsights(scrobbles, heatmapRange),
    [scrobbles, heatmapRange]
  );

  // Sessions
  const sessions = useMemo(
    () => getListeningSessions(scrobbles.filter((s) => s.year === calendarYear)),
    [scrobbles, calendarYear]
  );

  // Color intensities for calendar:
  const getCalendarCellBg = (intensity: number) => {
    if (intensity === 0) return 'bg-slate-900 border-slate-800/80';
    if (intensity === 1) return 'bg-emerald-950/80 border-emerald-900/60';
    if (intensity === 2) return 'bg-emerald-800/80 border-emerald-700/60';
    if (intensity === 3) return 'bg-emerald-600 border-emerald-500';
    return 'bg-emerald-400 border-emerald-300 shadow-xs shadow-emerald-400/30';
  };

  const getHeatmapCellBg = (intensity: number) => {
    if (intensity === 0) return 'bg-slate-900/80 border-slate-800/60';
    if (intensity === 1) return `${theme.subtleBg} ${theme.borderClass}`;
    if (intensity === 2) return `${theme.subtleBg} border-blue-500/50`;
    if (intensity === 3) return `${theme.primaryBg} border-blue-400`;
    return `${theme.heatHighClass} shadow-xs`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* QUICK CHARTS LINK */}
      {onNavigateTab && (
        <div
          onClick={() => onNavigateTab('charts')}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-purple-950/50 border border-blue-500/30 flex items-center justify-between cursor-pointer hover:border-blue-400/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${theme.subtleBg} ${theme.primaryText} flex items-center justify-center border ${theme.borderClass}`}>
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                View Advanced Charts
              </p>
              <p className="text-[10px] text-slate-400">
                Music Ratio · Fingerprint · Decade Breakdown · 24h Clock
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>
      )}

      {/* SECTION 1: GITHUB-STYLE ACTIVITY CALENDAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Activity Calendar</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daily scrobble rhythm & consistency
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[2026, 2025].map((yr) => (
              <button
                key={yr}
                onClick={() => setCalendarYear(yr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                  calendarYear === yr
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector for Calendar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(
            [
              { id: 'plays', label: 'Plays' },
              { id: 'duration', label: 'Duration' },
              { id: 'uniqueArtists', label: 'Unique Artists' },
              { id: 'uniqueTracks', label: 'Unique Tracks' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setCalendarMetric(m.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors whitespace-nowrap border ${
                calendarMetric === m.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Scrollable Year Grid */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              <strong className="text-white font-bold">{calendarData.activeDaysCount}</strong> active
              days in {calendarYear}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`w-2.5 h-2.5 rounded-xs border ${getCalendarCellBg(lvl)}`}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* GitHub-style Horizontal Day Grid */}
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
              {calendarData.days.map((day) => {
                return (
                  <button
                    key={day.dateKey}
                    onClick={() => setSelectedDay(day)}
                    title={`${day.dateKey}: ${day.plays} plays`}
                    className={`w-3.5 h-3.5 rounded-xs border transition-transform hover:scale-125 focus:ring-1 focus:ring-emerald-400 cursor-pointer ${getCalendarCellBg(
                      day.intensityLevel
                    )}`}
                  />
                );
              })}
            </div>
          </div>

          {calendarData.peakDay && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Peak Day:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {formatDateHuman(calendarData.peakDay.dateKey)} ({calendarData.peakDay.plays} plays)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: HOURLY WEEKLY HEATMAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Clock className={`w-4 h-4 ${theme.primaryText}`} />
              <span>Weekly Heatmap</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Circadian rhythm & time of day</p>
          </div>

          <TimeRangeSelector
            value={heatmapRange}
            onChange={setHeatmapRange}
            accentColor={accentColor}
          />
        </div>

        {/* Heatmap Granularity & Metric Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-slate-500 mr-1">Bin:</span>
            {([1, 3, 6] as HeatmapGranularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setHeatmapGranularity(g)}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  heatmapGranularity === g
                    ? `${theme.primaryBg} text-white font-bold`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g}h
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px]">
            {(['plays', 'duration'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setHeatmapMetric(m)}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  heatmapMetric === m
                    ? `${theme.subtleBg} ${theme.primaryText} font-bold`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Grid (Days of Week vs Time Slots) */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 overflow-hidden shadow-lg">
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[320px] space-y-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, dayIndex) => {
                const dayCells = heatmapData.cells.filter((c) => c.dayOfWeek === dayIndex);
                return (
                  <div key={dayName} className="flex items-center gap-2">
                    <span className="w-8 text-[11px] font-mono text-slate-400 uppercase font-semibold">
                      {dayName}
                    </span>
                    <div className="flex-1 flex gap-1.5">
                      {dayCells.map((cell) => (
                        <button
                          key={`${cell.dayOfWeek}_${cell.startHour}`}
                          onClick={() => setSelectedCell(cell)}
                          title={`${cell.dayName} ${cell.label}: ${cell.plays} plays`}
                          className={`flex-1 h-7 rounded-lg border transition-all hover:scale-105 cursor-pointer ${getHeatmapCellBg(
                            cell.intensity
                          )}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Heatmap Insights Summary */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/70 text-xs">
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase">Peak Rhythm</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {heatmapData.busiestWindowLabel}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase">Evening Share</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {heatmapData.eveningSharePercent}% (7–10 PM)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: INFERRED SESSIONS & DERIVED INSIGHTS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Derived Listening Insights</span>
        </h3>

        <div className="space-y-2.5">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  {ins.category} telemetry
                </span>
                <span className={`text-xs font-mono font-bold ${theme.primaryText}`}>
                  {ins.metricBadge}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-100 font-display">{ins.statement}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{ins.supportingDetail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Bottom Sheet */}
      <BottomSheetModal
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDateLong(selectedDay.dateKey) : ''}
        subtitle="Daily Scrobble Breakdown"
      >
        {selectedDay && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Total Plays</span>
                <p className="text-2xl font-bold font-mono text-white mt-0.5">
                  {selectedDay.plays}
                </p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Listening Time
                </span>
                <p className="text-xl font-bold font-mono text-white mt-0.5">
                  {formatDuration(selectedDay.durationSec)}
                </p>
              </div>
            </div>

            {selectedDay.topArtist && (
              <div
                onClick={() => {
                  setSelectedDay(null);
                  onSelectEntity({ type: 'artist', id: selectedDay.topArtist!.id });
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Top Artist</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {selectedDay.topArtist.name}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        )}
      </BottomSheetModal>

      {/* Heatmap Cell Detail Bottom Sheet */}
      <BottomSheetModal
        isOpen={Boolean(selectedCell)}
        onClose={() => setSelectedCell(null)}
        title={selectedCell ? `${selectedCell.dayName} · ${selectedCell.label}` : ''}
        subtitle="Hourly Bin Activity"
      >
        {selectedCell && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Total Activity</span>
              <p className="text-2xl font-bold font-mono text-white mt-0.5">
                {selectedCell.plays} plays ({formatDuration(selectedCell.durationSec)})
              </p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consistently active during this window across the selected period.
            </p>
          </div>
        )}
      </BottomSheetModal>
    </div>
  );
};
