import { useEffect, useMemo, useState } from 'react';
import type { Scrobble, TimeRangeFilter } from '../../../types/music';
import {
  FingerprintDimension,
  HourClockItem,
  getListeningClock,
  getListeningFingerprint,
  getMusicRatio,
} from '../../../features/analytics/services/analyticsEngine';
import { measureTempSync } from '../../../utils/tempPerformance';

export function useChartsData(scrobbles: Scrobble[]) {
  const [period, setPeriod] = useState<TimeRangeFilter>('30d');
  const [clockMetric, setClockMetric] = useState<'plays' | 'duration'>('plays');
  const [useLocalTz, setUseLocalTz] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<FingerprintDimension | null>(null);
  const [selectedHour, setSelectedHour] = useState<HourClockItem | null>(null);

  // TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
  const ratioReport = useMemo(
    () =>
      measureTempSync(
        'analytics.charts.music_ratio',
        () => getMusicRatio(scrobbles, period),
        { records: scrobbles.length }
      ),
    [scrobbles, period]
  );
  const fingerprintReport = useMemo(
    () =>
      measureTempSync(
        'analytics.charts.listening_fingerprint',
        () => getListeningFingerprint(scrobbles, period),
        { records: scrobbles.length }
      ),
    [scrobbles, period]
  );
  const clockReport = useMemo(
    () =>
      measureTempSync(
        'analytics.charts.listening_clock',
        () => getListeningClock(scrobbles, period, clockMetric, useLocalTz),
        { records: scrobbles.length }
      ),
    [scrobbles, period, clockMetric, useLocalTz]
  );

  useEffect(() => {
    if (clockReport.busiestHour) {
      setSelectedHour(clockReport.busiestHour);
    }
  }, [clockReport.busiestHour]);

  return {
    period,
    setPeriod,
    clockMetric,
    setClockMetric,
    useLocalTz,
    setUseLocalTz,
    selectedDimension,
    setSelectedDimension,
    selectedHour,
    setSelectedHour,
    ratioReport,
    fingerprintReport,
    clockReport,
  };
}
