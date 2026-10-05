import type { Scrobble } from '../../../types/music';
import { getTrackById } from '../../analytics/services/analyticsEngine';

export function getLatestScrobble(scrobbles: Scrobble[]) {
  const scrobble = scrobbles[0];
  const track = scrobble ? getTrackById(scrobble.trackId) : null;
  return { scrobble, track };
}
