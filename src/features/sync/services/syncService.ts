import type { Scrobble } from '../../../types/music';
import {
  getScrobbleCount,
  insertImportedScrobbles,
} from '../../../data/local/scrobbleRepository';
import {
  requestCloudHistoryPage,
  requestLastFmSyncPage,
  type RemoteSyncState,
} from '../../lastfm/api/lastfmApi';
import { registerScrobbleMetadata } from '../../analytics/services/analyticsEngine';
import {
  logTempMeasurement,
  measureTempAsync,
  measureTempSync,
} from '../../../utils/tempPerformance';

type SyncMode = 'initial' | 'incremental' | null;

interface SyncProgressHandlers {
  onCloudRestoreProgress?: (restoredCount: number) => void;
  onPageAcknowledged?: (state: RemoteSyncState, mode: SyncMode) => void;
  databaseSizeBytes?: number;
}

export interface ScrobbleSyncResult {
  scrobbles: Scrobble[];
  databaseSizeBytes: number;
  isFullHistory: boolean;
  remoteState: RemoteSyncState | null;
  mode: SyncMode;
  pagesProcessed: number;
  recordsProcessed: number;
}

export async function runScrobbleSync(
  handlers: SyncProgressHandlers = {}
): Promise<ScrobbleSyncResult> {
  // TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
  const startedAt = performance.now();
  try {
    const result = await runScrobbleSyncMeasured(handlers);
    const durationMs = performance.now() - startedAt;
    logTempMeasurement('sync.total_run', durationMs, {
      mode: result.mode || 'unknown',
      pages: result.pagesProcessed,
      records: result.recordsProcessed,
      recordsPerSecond: durationMs > 0
        ? Number((result.recordsProcessed / (durationMs / 1000)).toFixed(2))
        : 0,
    });
    return result;
  } catch (error) {
    logTempMeasurement('sync.total_run', performance.now() - startedAt, {
      success: false,
    });
    throw error;
  }
}

async function runScrobbleSyncMeasured(
  handlers: SyncProgressHandlers
): Promise<ScrobbleSyncResult> {
  let newScrobbles: Scrobble[] = [];
  let recordsProcessed = 0;
  let pagesProcessed = 0;
  const currentLocalCount = await measureTempAsync(
    'sync.initial_local_scrobble_count',
    getScrobbleCount
  );
  if (currentLocalCount === 0) {
    let cursor: { playedAt: number; eventId: string } | undefined;
    let restoredCount = 0;
    do {
      const cloudPage = await measureTempAsync(
        'sync.cloud_history_page_request',
        () => requestCloudHistoryPage(cursor),
        (result) => ({ records: result.items.length, mode: 'full' })
      );
      pagesProcessed += 1;
      if (cloudPage.items.length > 0) {
        const persisted = await measureTempAsync(
          'sync.cloud_history_indexeddb_page_write',
          () => insertImportedScrobbles(cloudPage.items),
          { records: cloudPage.items.length }
        );
        newScrobbles.push(...persisted.inserted);
        recordsProcessed += cloudPage.items.length;
        restoredCount += cloudPage.items.length;
        handlers.onCloudRestoreProgress?.(restoredCount);
      }
      cursor = cloudPage.nextCursor || undefined;
    } while (cursor);
  }

  let mode: SyncMode = null;
  let syncFinished = false;
  let acknowledgedPage: number | undefined;
  let finalRemoteState: RemoteSyncState | null = null;
  while (!syncFinished) {
    const pageCycleStartedAt = performance.now();
    let pageCycleSucceeded = false;
    let pageNumber: number | undefined;
    let recordCount = 0;
    let pageMode: SyncMode = mode;
    try {
      const page = await measureTempAsync(
        'sync.lastfm_page_request',
        () => requestLastFmSyncPage(acknowledgedPage),
        (result) => ({
          page: result.page,
          records: result.items.length,
          mode: result.state.mode || 'unknown',
        })
      );
      if (
        acknowledgedPage !== undefined &&
        page.items.length === 0 &&
        page.state.status === 'complete'
      ) {
        finalRemoteState = page.state;
        handlers.onPageAcknowledged?.(page.state, mode);
        syncFinished = true;
        pageCycleSucceeded = true;
        continue;
      }
      pageNumber = page.page;
      recordCount = page.items.length;
      mode = page.state.mode || mode;
      pageMode = mode;
      if (acknowledgedPage !== undefined) {
        handlers.onPageAcknowledged?.(page.state, mode);
      }
      const persisted = await measureTempAsync(
        'sync.indexeddb_page_write',
        () => insertImportedScrobbles(page.items),
        { page: page.page, records: page.items.length, mode: mode || 'unknown' }
      );
      newScrobbles.push(...persisted.inserted);
      recordsProcessed += page.items.length;
      pagesProcessed += 1;
      acknowledgedPage = page.page;
      finalRemoteState = page.state;
      pageCycleSucceeded = true;
    } finally {
      logTempMeasurement('sync.complete_page_processing_cycle',
        performance.now() - pageCycleStartedAt,
        {
          page: pageNumber,
          records: recordCount,
          mode: pageMode || 'unknown',
          success: pageCycleSucceeded,
        });
    }
  }

  measureTempSync(
    'sync.imported_metadata_registration',
    () => registerScrobbleMetadata(newScrobbles),
    { records: newScrobbles.length }
  );
  const importedSizeBytes = measureTempSync(
    'sync.imported_records_size_accounting',
    () => {
      const encoder = new TextEncoder();
      const insertedBytes = newScrobbles.reduce(
        (total, scrobble) =>
          total + encoder.encode(JSON.stringify(scrobble)).byteLength,
        0
      );
      return insertedBytes;
    },
    { records: newScrobbles.length }
  );

  return {
    scrobbles: newScrobbles.sort((a, b) => b.timestamp - a.timestamp),
    databaseSizeBytes: (handlers.databaseSizeBytes ?? 0) + importedSizeBytes,
    isFullHistory: currentLocalCount === 0,
    remoteState: finalRemoteState,
    mode,
    pagesProcessed,
    recordsProcessed,
  };
}
