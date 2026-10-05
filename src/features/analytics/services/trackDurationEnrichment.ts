import type { Scrobble, Track } from '../../../types/music';
import {
  getAllTrackDurationMetadata,
  saveTrackDurationMetadata,
  type TrackDurationMetadata,
} from '../../../data/local/scrobbleRepository';
import { requestLastFmTrackDurations } from '../../lastfm/api/lastfmApi';
import {
  getTrackById,
  registerTrackMetadata,
} from './analyticsCore';

const TRACK_DURATION_BATCH_SIZE = 10;
const NEGATIVE_CACHE_TTL_MS = 30 * 86400 * 1000;

export function registerCachedTrackDurations(
  metadata: TrackDurationMetadata[]
): void {
  for (const item of metadata) {
    if (item.durationSec === null || item.durationSec <= 0) continue;
    const existing = getTrackById(item.trackId);
    const track: Track = {
      id: item.trackId,
      title: item.trackName || existing?.title || '',
      artistId: existing?.artistId || '',
      artistName: item.artistName || existing?.artistName || '',
      albumId: existing?.albumId || '',
      albumTitle: existing?.albumTitle || '',
      artworkUrl: existing?.artworkUrl || '',
      durationSec: item.durationSec,
      loved: existing?.loved || false,
    };
    registerTrackMetadata(track);
  }
}

export function applyCachedTrackDurations(scrobbles: Scrobble[]): Scrobble[] {
  let changed = false;
  const updated = scrobbles.map((scrobble) => {
    const track = getTrackById(scrobble.trackId);
    const durationSec = track?.durationSec;
    if (
      durationSec === null ||
      durationSec === undefined ||
      durationSec <= 0 ||
      scrobble.durationSec === durationSec
    ) {
      return scrobble;
    }
    changed = true;
    return { ...scrobble, durationSec };
  });
  return changed ? updated : scrobbles;
}

export async function enrichMissingTrackDurations(
  scrobbles: Scrobble[],
  onBatchCompleted: () => void
): Promise<void> {
  const cached = await getAllTrackDurationMetadata();
  registerCachedTrackDurations(cached);
  const cachedById = new Map(cached.map((item) => [item.trackId, item]));
  const uniqueTracks = new Map<
    string,
    { track_id: string; track_mbid: string | null; artist_name: string; track_name: string }
  >();
  for (const scrobble of scrobbles) {
    const track = getTrackById(scrobble.trackId);
    if ((track?.durationSec ?? scrobble.durationSec ?? 0) > 0) continue;
    const trackName = scrobble.trackName || track?.title || '';
    const artistName = scrobble.artistName || track?.artistName || '';
    if (!trackName || !artistName || uniqueTracks.has(scrobble.trackId)) continue;

    const cachedItem = cachedById.get(scrobble.trackId);
    if (
      cachedItem &&
      Date.now() - cachedItem.checkedAt < NEGATIVE_CACHE_TTL_MS
    ) {
      continue;
    }
    uniqueTracks.set(scrobble.trackId, {
      track_id: scrobble.trackId,
      track_mbid: scrobble.trackMbid || null,
      artist_name: artistName,
      track_name: trackName,
    });
  }

  const missingTracks = Array.from(uniqueTracks.values());
  for (
    let offset = 0;
    offset < missingTracks.length;
    offset += TRACK_DURATION_BATCH_SIZE
  ) {
    const requestedBatch = missingTracks.slice(
      offset,
      offset + TRACK_DURATION_BATCH_SIZE
    );
    const metadata = await requestLastFmTrackDurations(requestedBatch);
    await saveTrackDurationMetadata(metadata);
    registerCachedTrackDurations(metadata);
    onBatchCompleted();
  }
}
