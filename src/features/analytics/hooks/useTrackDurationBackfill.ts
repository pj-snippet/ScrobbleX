import { useCallback, useEffect, useRef } from 'react';
import type { Scrobble } from '../../../types/music';
import { enrichMissingTrackDurations } from '../services/trackDurationEnrichment';

export function useTrackDurationBackfill(
  enabled: boolean,
  scrobbles: Scrobble[],
  onBatchCompleted: () => void
): () => void {
  const scrobblesRef = useRef(scrobbles);
  const onBatchCompletedRef = useRef(onBatchCompleted);
  const inFlightRef = useRef(false);
  const rerunRequestedRef = useRef(false);
  const startRef = useRef<() => void>(() => {});

  scrobblesRef.current = scrobbles;
  onBatchCompletedRef.current = onBatchCompleted;

  const start = useCallback(() => {
    if (!enabled) return;
    if (inFlightRef.current) {
      rerunRequestedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    let batchesSinceRefresh = 0;
    void enrichMissingTrackDurations(scrobblesRef.current, () => {
      batchesSinceRefresh += 1;
      if (batchesSinceRefresh >= 20) {
        batchesSinceRefresh = 0;
        onBatchCompletedRef.current();
      }
    })
      .then(() => {
        if (batchesSinceRefresh > 0) onBatchCompletedRef.current();
      })
      .catch((error: unknown) => {
        console.error('Historical track-duration enrichment failed.', error);
      })
      .finally(() => {
        inFlightRef.current = false;
        if (rerunRequestedRef.current) {
          rerunRequestedRef.current = false;
          startRef.current();
        }
      });
  }, [enabled]);

  startRef.current = start;
  useEffect(() => {
    start();
  }, [start]);

  return start;
}
