import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Layers,
  PieChart,
} from 'lucide-react';
import {
  AccentColor,
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
import { TimeRangeSelector, BottomSheetModal } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface ActivityScreenProps {
  scrobbles: Scrobble[];
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor?: AccentColor;
  onNavigateTab?: (tab: string) => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  scrobbles,
  onSelectEntity,
  onNavigateTab,
}) => {
  const { tokens } = useTheme();

  // Calendar Controls
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(scrobbles.map((s) => s.year))).filter(Boolean);
    return years.length > 0 ? years.sort((a, b) => b - a) : [2026, 2025];
  }, [scrobbles]);

  const [calendarYear, setCalendarYear] = useState<number>(availableYears[0] || 2026);
  const [calendarMetric, setCalendarMetric] = useState<
    'plays' | 'duration' | 'uniqueArtists' | 'uniqueTracks'
  >('plays');

  // Heatmap Controls
  const [heatmapRange, setHeatmapRange] = useState<TimeRangeFilter>('30d');
  const [heatmapGranularity, setHeatmapGranularity] = useState<HeatmapGranularity>(3);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('plays');

  // Selected Day Sheet
  const [selectedDay, setSelectedDay] = useState<DailyActivitySummary | null>(null);

  // Selected Heatmap Cell Sheet
  const [selectedCell, setSelectedCell] = useState<WeeklyHeatmapCell | null>(null);

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

  // Activity calendar cell style - adapts dynamically to user's selected accent
  const getCalendarCellStyle = (intensity: number) => {
    if (intensity === 0) return { backgroundColor: tokens.heatmapEmpty, borderColor: tokens.heatmapEmptyBorder };
    if (intensity === 1) return { backgroundColor: tokens.heatmap1, borderColor: tokens.accentBorder };
    if (intensity === 2) return { backgroundColor: tokens.heatmap2, borderColor: tokens.accentBorder };
    if (intensity === 3) return { backgroundColor: tokens.heatmap3, borderColor: tokens.accentPrimary };
    return {
      backgroundColor: tokens.heatmap4,
      borderColor: tokens.accentContrast === '#FFFFFF' ? '#FFFFFF' : tokens.accentHover,
      boxShadow: `0 0 8px ${tokens.accentGlow}`,
    };
  };

  // Circadian weekly heatmap cell style - adapts dynamically to user's selected accent
  const getHeatmapCellStyle = (intensity: number) => {
    if (intensity === 0) return { backgroundColor: tokens.heatmapEmpty, borderColor: tokens.heatmapEmptyBorder };
    if (intensity === 1) return { backgroundColor: tokens.heatmap1, borderColor: tokens.accentBorder };
    if (intensity === 2) return { backgroundColor: tokens.heatmap2, borderColor: tokens.accentBorder };
    if (intensity === 3) return { backgroundColor: tokens.heatmap3, borderColor: tokens.accentPrimary };
    return {
      backgroundColor: tokens.heatmap4,
      borderColor: '#FFFFFF',
      boxShadow: `0 0 10px ${tokens.accentGlow}`,
    };
  };

  return (
    <div className="space-y-6 pb-8">
      {/* QUICK CHARTS LINK */}
      {onNavigateTab && (
        <div
          onClick={() => onNavigateTab('charts')}
          style={{ borderColor: tokens.accentBorder }}
          className="p-3.5 rounded-2xl bg-app-card border flex items-center justify-between cursor-pointer hover:bg-app-hover transition-all group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: tokens.accentSubtle,
                color: tokens.accentPrimary,
                borderColor: tokens.accentBorder,
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
            >
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-app-primary group-hover:text-accent transition-colors">
                View Advanced Charts
              </p>
              <p className="text-[10px] text-app-muted">
                Music Ratio · Fingerprint · Decade Breakdown · 24h Clock
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      )}

      {/* SECTION 1: GITHUB-STYLE ACTIVITY CALENDAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Activity Calendar</span>
            </h3>
            <p className="text-[11px] text-app-muted mt-0.5">
              Daily scrobble rhythm & consistency
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-app-subcard p-1 rounded-xl border border-app">
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setCalendarYear(yr)}
                style={{
                  backgroundColor: calendarYear === yr ? tokens.accentPrimary : 'transparent',
                  color: calendarYear === yr ? tokens.accentContrast : tokens.textMuted,
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
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
          ).map((m) => {
            const isSelected = calendarMetric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setCalendarMetric(m.id)}
                style={{
                  backgroundColor: isSelected ? tokens.accentSubtle : undefined,
                  color: isSelected ? tokens.accentPrimary : tokens.textMuted,
                  borderColor: isSelected ? tokens.accentBorder : undefined,
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors whitespace-nowrap border ${
                  isSelected ? 'font-bold' : 'bg-app-subcard border-app hover:text-app-primary'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Year Grid */}
        <div className="p-4 rounded-3xl bg-app-card border border-app space-y-3 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-app-muted">
            <span className="font-mono">
              <strong className="text-app-primary font-bold">{calendarData.activeDaysCount}</strong> active
              days in {calendarYear}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  style={getCalendarCellStyle(lvl)}
                  className="w-2.5 h-2.5 rounded-xs border"
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
                    style={getCalendarCellStyle(day.intensityLevel)}
                    className="w-3.5 h-3.5 rounded-xs border transition-transform hover:scale-125 focus:ring-1 focus:ring-accent cursor-pointer"
                  />
                );
              })}
            </div>
          </div>

          {calendarData.peakDay && (
            <div className="flex items-center justify-between pt-2 border-t border-app text-xs">
              <span className="text-app-muted font-mono text-[11px]">Peak Day:</span>
              <span style={{ color: tokens.accentPrimary }} className="font-mono font-semibold">
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
            <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Weekly Heatmap</span>
            </h3>
            <p className="text-[11px] text-app-muted mt-0.5">Circadian rhythm & time of day</p>
          </div>

          <TimeRangeSelector
            value={heatmapRange}
            onChange={setHeatmapRange}
          />
        </div>

        {/* Heatmap Granularity & Metric Bar */}
        <div className="flex items-center justify-between bg-app-card p-2 rounded-2xl border border-app text-xs">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-app-muted mr-1">Bin:</span>
            {([1, 3, 6] as HeatmapGranularity[]).map((g) => {
              const isSelected = heatmapGranularity === g;
              return (
                <button
                  key={g}
                  onClick={() => setHeatmapGranularity(g)}
                  style={{
                    backgroundColor: isSelected ? tokens.accentPrimary : 'transparent',
                    color: isSelected ? tokens.accentContrast : tokens.textMuted,
                  }}
                  className="px-2 py-0.5 rounded-md cursor-pointer transition-colors font-bold hover:text-app-primary"
                >
                  {g}h
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px]">
            {(['plays', 'duration'] as const).map((m) => {
              const isSelected = heatmapMetric === m;
              return (
                <button
                  key={m}
                  onClick={() => setHeatmapMetric(m)}
                  style={{
                    backgroundColor: isSelected ? tokens.accentSubtle : 'transparent',
                    color: isSelected ? tokens.accentPrimary : tokens.textMuted,
                  }}
                  className="px-2 py-0.5 rounded-md cursor-pointer transition-colors font-bold hover:text-app-primary"
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Heatmap Grid (Days of Week vs Time Slots) */}
        <div className="p-4 rounded-3xl bg-app-card border border-app space-y-3 overflow-hidden shadow-lg">
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[320px] space-y-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, dayIndex) => {
                const dayCells = heatmapData.cells.filter((c) => c.dayOfWeek === dayIndex);
                return (
                  <div key={dayName} className="flex items-center gap-2">
                    <span className="w-8 text-[11px] font-mono text-app-muted uppercase font-semibold">
                      {dayName}
                    </span>
                    <div className="flex-1 flex gap-1.5">
                      {dayCells.map((cell) => (
                        <button
                          key={`${cell.dayOfWeek}_${cell.startHour}`}
                          onClick={() => setSelectedCell(cell)}
                          title={`${cell.dayName} ${cell.label}: ${cell.plays} plays`}
                          style={getHeatmapCellStyle(cell.intensity)}
                          className="flex-1 h-7 rounded-lg border transition-all hover:scale-105 cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Heatmap Insights Summary */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-app text-xs">
            <div>
              <span className="text-app-muted font-mono text-[10px] uppercase">Peak Rhythm</span>
              <p className="font-semibold text-app-primary mt-0.5">
                {heatmapData.busiestWindowLabel}
              </p>
            </div>
            <div>
              <span className="text-app-muted font-mono text-[10px] uppercase">Evening Share</span>
              <p className="font-semibold text-app-primary mt-0.5">
                {heatmapData.eveningSharePercent}% (7–10 PM)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: INFERRED SESSIONS & DERIVED INSIGHTS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Derived Listening Insights</span>
        </h3>

        <div className="space-y-2.5">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="p-3.5 rounded-2xl bg-app-card border border-app space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-app-muted tracking-wider">
                  {ins.category} telemetry
                </span>
                <span style={{ color: tokens.accentPrimary }} className="text-xs font-mono font-bold">
                  {ins.metricBadge}
                </span>
              </div>
              <p className="text-xs font-bold text-app-primary font-display">{ins.statement}</p>
              <p className="text-[11px] text-app-muted leading-relaxed">{ins.supportingDetail}</p>
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
              <div className="bg-app-subcard p-3 rounded-xl border border-app">
                <span className="text-[10px] font-mono text-app-muted uppercase">Total Plays</span>
                <p className="text-2xl font-bold font-mono text-app-primary mt-0.5">
                  {selectedDay.plays}
                </p>
              </div>
              <div className="bg-app-subcard p-3 rounded-xl border border-app">
                <span className="text-[10px] font-mono text-app-muted uppercase">
                  Listening Time
                </span>
                <p className="text-xl font-bold font-mono text-app-primary mt-0.5">
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
                className="flex items-center justify-between p-3 rounded-xl bg-app-subcard border border-app hover:bg-app-hover transition-colors cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-mono text-app-muted uppercase">Top Artist</span>
                  <p className="text-sm font-bold text-app-primary mt-0.5">
                    {selectedDay.topArtist.name}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-app-muted" />
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
            <div className="p-3 bg-app-subcard rounded-xl border border-app">
              <span className="text-[10px] font-mono text-app-muted uppercase">Total Activity</span>
              <p className="text-2xl font-bold font-mono text-app-primary mt-0.5">
                {selectedCell.plays} plays ({formatDuration(selectedCell.durationSec)})
              </p>
            </div>
            <p className="text-xs text-app-muted leading-relaxed">
              Consistently active during this window across the selected period.
            </p>
          </div>
        )}
      </BottomSheetModal>
    </div>
  );
};
