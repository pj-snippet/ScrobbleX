import { useEffect, useRef, useState } from 'react';
import type { Scrobble } from '../../../types/music';
import {
  getLocalHistoryPage,
  type ScrobblePageCursor,
} from '../../../data/local/scrobbleRepository';

export function useListeningHistory(
  enabled: boolean,
  dateFilter: string,
  searchQuery: string
) {
  const [scrobbles, setScrobbles] = useState<Scrobble[]>([]);
  const [cursor, setCursor] = useState<ScrobblePageCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    if (!enabled) return;
    let cancelled = false;
    setScrobbles([]);
    setCursor(null);
    setHasMore(false);
    setError('');
    setLoading(true);

    getLocalHistoryPage({ limit: 30, dateFilter, query: searchQuery })
      .then((page) => {
        if (cancelled || currentRequestId !== requestId.current) return;
        setScrobbles(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      })
      .catch((cause: unknown) => {
        if (cancelled || currentRequestId !== requestId.current) return;
        setError(
          cause instanceof Error ? cause.message : 'Could not load local listening history.'
        );
      })
      .finally(() => {
        if (!cancelled && currentRequestId === requestId.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateFilter, enabled, searchQuery]);

  const loadNextPage = async () => {
    if (!cursor || loading) return;
    const currentRequestId = requestId.current;
    setLoading(true);
    setError('');
    try {
      const page = await getLocalHistoryPage({
        limit: 30,
        before: cursor,
        dateFilter,
        query: searchQuery,
      });
      if (currentRequestId !== requestId.current) return;
      setScrobbles((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (cause) {
      if (currentRequestId !== requestId.current) return;
      setError(
        cause instanceof Error ? cause.message : 'Could not load more listening history.'
      );
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  };

  return { scrobbles, hasMore, loading, error, loadNextPage };
}
