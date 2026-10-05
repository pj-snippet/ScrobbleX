import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, Clock } from 'lucide-react';
import { AccentColor, Scrobble } from '../../types/music';
import {
  formatKnownListeningDuration,
  getMonthlyListeningTimeline,
  MonthlyListeningSummary,
} from '../../features/analytics/services/analyticsEngine';
import { ACCENT_THEMES } from '../../features/themes/themeRegistry';

interface TimelineScreenProps {
  scrobbles: Scrobble[];
  accentColor: AccentColor;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  scrobbles,
  accentColor,
}) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  const timeline = useMemo(
    () => getMonthlyListeningTimeline(scrobbles),
    [scrobbles]
  );
  const years = useMemo(() => {
    const grouped = new Map<number, MonthlyListeningSummary[]>();
    for (const month of timeline) {
      const months = grouped.get(month.year) || [];
      months.push(month);
      grouped.set(month.year, months);
    }
    return Array.from(grouped.entries()).sort(([left], [right]) => right - left);
  }, [timeline]);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white font-display">
          <Clock className={`h-4 w-4 ${theme.primaryText}`} />
          <span>Listening Timeline</span>
        </h3>
        <p className="mt-1 text-[11px] text-slate-400">
          Your real listening history, organized by year and month
        </p>
      </div>

      {years.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-8 text-center">
          <CalendarDays className="mx-auto mb-2 h-5 w-5 text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">No monthly history yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Sync your Last.fm listening history to see your timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map(([year, months]) => {
            const isYearExpanded = expandedYear === year;
            const yearPlays = months.reduce((total, month) => total + month.plays, 0);
            const yearListeningTime = formatKnownListeningDuration(
              months.reduce((total, month) => total + month.durationSec, 0),
              months.reduce((total, month) => total + month.unknownDurationCount, 0)
            );
            return (
              <section
                key={year}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
              >
                <button
                  type="button"
                  aria-expanded={isYearExpanded}
                  onClick={() => setExpandedYear(isYearExpanded ? null : year)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="flex items-center gap-3">
                    <CalendarDays className={`h-4 w-4 ${theme.primaryText}`} />
                    <span className="text-base font-bold text-white">{year}</span>
                    <span className="text-xs text-slate-500">
                      {months.length} {months.length === 1 ? 'month' : 'months'}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      {yearPlays.toLocaleString()} plays · {yearListeningTime}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform ${
                        isYearExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </button>

                {isYearExpanded && (
                  <div className="space-y-2 border-t border-slate-800 p-3">
                    {months.map((month) => {
                      const isMonthExpanded = expandedMonth === month.monthKey;
                      return (
                        <div
                          key={month.monthKey}
                          className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/40"
                        >
                          <button
                            type="button"
                            aria-expanded={isMonthExpanded}
                            onClick={() =>
                              setExpandedMonth(isMonthExpanded ? null : month.monthKey)
                            }
                            className="flex w-full items-center justify-between gap-3 p-3 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-100">
                                {month.label}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-slate-500">
                                {month.activeDays} active days · {month.uniqueArtists} artists
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="font-mono text-xs text-slate-300">
                                {month.plays.toLocaleString()} plays
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 text-slate-500 transition-transform ${
                                  isMonthExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </span>
                          </button>

                          {isMonthExpanded && (
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 p-3">
                              <Metric
                                label="Listening time"
                                value={formatKnownListeningDuration(
                                  month.durationSec,
                                  month.unknownDurationCount
                                )}
                              />
                              <Metric label="Daily average" value={`${month.dailyAverage} plays`} />
                              <Metric label="Unique tracks" value={month.uniqueTracks.toLocaleString()} />
                              <Metric label="Unique albums" value={month.uniqueAlbums.toLocaleString()} />
                              <Metric label="Top artist" value={month.topArtist?.name || '—'} />
                              <Metric label="Top track" value={month.topTrack?.name || '—'} />
                              <Metric label="Top album" value={month.topAlbum?.name || '—'} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0 rounded-lg bg-slate-900/70 p-2.5">
    <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 truncate text-xs font-semibold text-slate-200" title={value}>
      {value}
    </p>
  </div>
);
