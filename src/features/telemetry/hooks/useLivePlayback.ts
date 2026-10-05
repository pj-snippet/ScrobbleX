import { useCallback, useEffect, useRef, useState } from 'react';
import type { Track } from '../../../types/music';
import { registerTrackMetadata } from '../../analytics/services/analyticsCore';
import { requestLastFmNowPlaying } from '../../lastfm/api/lastfmApi';

const LIVE_PLAYBACK_REFRESH_MS = 20_000;
const EVENT_REFRESH_COOLDOWN_MS = 1_500;

function toTrack(track: Awaited<ReturnType<typeof requestLastFmNowPlaying>>): Track | null {
  if (!track) return null;
  return {
    id: track.id,
    title: track.title,
    artistId: track.artistId,
    artistName: track.artistName,
    albumId: track.albumId,
    albumTitle: track.albumTitle,
    artworkUrl: track.artworkUrl,
    durationSec: null,
    loved: false,
  };
}

function tracksMatch(left: Track | null, right: Track | null): boolean {
  return (
    left?.id === right?.id &&
    left?.title === right?.title &&
    left?.artistName === right?.artistName &&
    left?.albumTitle === right?.albumTitle &&
    left?.artworkUrl === right?.artworkUrl
  );
}

export function useLivePlayback(connected: boolean, screenActive: boolean): {
  nowPlayingTrack: Track | null;
  refreshNowPlaying: () => Promise<void>;
} {
  const [nowPlayingTrack, setNowPlayingTrack] = useState<Track | null>(null);
  const requestInFlight = useRef<Promise<Track | null> | null>(null);
  const lastRequestAt = useRef(0);

  const refresh = useCallback(
    async (manual = false): Promise<Track | null> => {
      if (!connected) return null;
      if (requestInFlight.current) return requestInFlight.current;
      const now = Date.now();
      if (!manual && now - lastRequestAt.current < EVENT_REFRESH_COOLDOWN_MS) {
        return null;
      }
      lastRequestAt.current = now;

      const request = requestLastFmNowPlaying()
        .then(toTrack)
        .then((track) => {
          if (track) registerTrackMetadata(track);
          setNowPlayingTrack((current) => (tracksMatch(current, track) ? current : track));
          return track;
        })
        .catch(() => {
          console.error('Live playback refresh failed.');
          return null;
        })
        .finally(() => {
          requestInFlight.current = null;
        });
      requestInFlight.current = request;
      return request;
    },
    [connected]
  );

  const refreshNowPlaying = useCallback(async () => {
    await refresh(true);
  }, [refresh]);

  useEffect(() => {
    if (!connected) {
      setNowPlayingTrack(null);
      return;
    }
    if (!screenActive) return;

    let intervalId: number | undefined;
    const stopPolling = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };
    const startPolling = () => {
      stopPolling();
      if (document.visibilityState !== 'visible') return;
      void refresh();
      intervalId = window.setInterval(() => {
        void refresh();
      }, LIVE_PLAYBACK_REFRESH_MS);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') startPolling();
      else stopPolling();
    };
    const onWindowFocus = () => {
      if (document.visibilityState === 'visible') startPolling();
    };
    const onWindowBlur = () => stopPolling();

    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [connected, screenActive, refresh]);

  return { nowPlayingTrack, refreshNowPlaying };
}
