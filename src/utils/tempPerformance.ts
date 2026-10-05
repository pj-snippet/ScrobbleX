// TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
export interface TempPerformanceDetails {
  page?: number;
  pages?: number;
  records?: number;
  recordsPerSecond?: number;
  mode?: 'initial' | 'incremental' | 'full' | 'unknown';
  httpStatus?: number;
  success?: boolean;
}

function logMeasurement(
  phase: string,
  startedAt: number,
  success: boolean,
  details: TempPerformanceDetails = {}
): void {
  console.info('[TEMP PERF]', {
    phase,
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    success: details.success ?? success,
    ...details,
  });
}

export function measureTempSync<T>(
  phase: string,
  operation: () => T,
  details: TempPerformanceDetails = {}
): T {
  const startedAt = performance.now();
  let success = false;
  try {
    const result = operation();
    success = true;
    return result;
  } finally {
    logMeasurement(phase, startedAt, success, details);
  }
}

export async function measureTempAsync<T>(
  phase: string,
  operation: () => Promise<T>,
  details: TempPerformanceDetails | ((result: T) => TempPerformanceDetails) = {}
): Promise<T> {
  const startedAt = performance.now();
  let success = false;
  let result: T | undefined;
  try {
    result = await operation();
    success = true;
    return result;
  } finally {
    const resultDetails =
      success && typeof details === 'function' && result !== undefined
        ? details(result)
        : typeof details === 'function'
          ? {}
          : details;
    logMeasurement(phase, startedAt, success, resultDetails);
  }
}

export function logTempMeasurement(
  phase: string,
  durationMs: number,
  details: TempPerformanceDetails = {}
): void {
  console.info('[TEMP PERF]', {
    phase,
    durationMs: Number(durationMs.toFixed(2)),
    success: true,
    ...details,
  });
}
