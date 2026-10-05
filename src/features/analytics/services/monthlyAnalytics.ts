import { RankedEntityItem, Scrobble } from '../../../types/music';
import {
  albumsMap,
  artistsMap,
  getTrackDurationSec,
  tracksMap,
} from './analyticsCore';

export interface MonthlyBucket {
  label: string;
  monthKey: string;
  plays: number;
}

export interface MonthlyListeningSummary extends MonthlyBucket {
  year: number;
  month: number;
  durationSec: number;
  unknownDurationCount: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  uniqueTracks: number;
  activeDays: number;
  dailyAverage: number;
  topArtist: RankedEntityItem | null;
  topTrack: RankedEntityItem | null;
  topAlbum: RankedEntityItem | null;
}

export function getMonthlyListeningTimeline(
  scrobbles: Scrobble[]
): MonthlyListeningSummary[] {
  const buckets = new Map<
    string,
    {
      year: number;
      month: number;
      plays: number;
      durationSec: number;
      unknownDurationCount: number;
      dates: Set<string>;
      artists: Map<string, number>;
      albums: Map<string, number>;
      tracks: Map<string, number>;
    }
  >();

  for (const scrobble of scrobbles) {
    const key = `${scrobble.year}-${String(scrobble.month + 1).padStart(2, '0')}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        year: scrobble.year,
        month: scrobble.month,
        plays: 0,
        durationSec: 0,
        unknownDurationCount: 0,
        dates: new Set(),
        artists: new Map(),
        albums: new Map(),
        tracks: new Map(),
      };
      buckets.set(key, bucket);
    }
    bucket.plays += 1;
    const trackDurationSec = getTrackDurationSec(scrobble);
    if (trackDurationSec === null) {
      bucket.unknownDurationCount += 1;
    } else {
      bucket.durationSec += trackDurationSec;
    }
    bucket.dates.add(scrobble.dateKey);
    bucket.artists.set(
      scrobble.artistId,
      (bucket.artists.get(scrobble.artistId) || 0) + 1
    );
    bucket.tracks.set(
      scrobble.trackId,
      (bucket.tracks.get(scrobble.trackId) || 0) + 1
    );
    if (scrobble.albumId) {
      bucket.albums.set(scrobble.albumId, (bucket.albums.get(scrobble.albumId) || 0) + 1);
    }
  }

  const topEntity = (
    counts: Map<string, number>,
    type: 'artist' | 'track' | 'album',
    totalPlays: number
  ): RankedEntityItem | null => {
    const [id, plays] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] || [];
    if (!id || !plays) return null;
    let name = id;
    let subtitle = '';
    let artworkUrl = '';
    if (type === 'artist') {
      const artist = artistsMap.get(id);
      name = artist?.name || id;
      subtitle = artist?.primaryGenre || 'Artist';
      artworkUrl = artist?.artworkUrl || '';
    } else if (type === 'track') {
      const track = tracksMap.get(id);
      name = track?.title || id;
      subtitle = track?.artistName || '';
      artworkUrl = track?.artworkUrl || '';
    } else {
      const album = albumsMap.get(id);
      name = album?.title || id;
      subtitle = album?.artistName || '';
      artworkUrl = album?.artworkUrl || '';
    }
    return {
      id,
      name,
      subtitle,
      artworkUrl,
      plays,
      durationSec: 0,
      sharePercent: Number(((plays / totalPlays) * 100).toFixed(1)),
      rank: 1,
    };
  };

  return Array.from(buckets.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([monthKey, bucket]) => {
      const activeDays = bucket.dates.size;
      const monthName = new Date(Date.UTC(bucket.year, bucket.month, 1)).toLocaleString(
        'en-US',
        { month: 'long', timeZone: 'UTC' }
      );
      return {
        label: `${monthName} ${bucket.year}`,
        monthKey,
        year: bucket.year,
        month: bucket.month,
        plays: bucket.plays,
        durationSec: bucket.durationSec,
        unknownDurationCount: bucket.unknownDurationCount,
        uniqueArtists: bucket.artists.size,
        uniqueAlbums: bucket.albums.size,
        uniqueTracks: bucket.tracks.size,
        activeDays,
        dailyAverage: activeDays ? Number((bucket.plays / activeDays).toFixed(1)) : 0,
        topArtist: topEntity(bucket.artists, 'artist', bucket.plays),
        topTrack: topEntity(bucket.tracks, 'track', bucket.plays),
        topAlbum: topEntity(bucket.albums, 'album', bucket.plays),
      };
    });
}

export function buildLast12MonthsTimeline(scrobbles: Scrobble[]): MonthlyBucket[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const buckets: MonthlyBucket[] = [];
  const currentDate = new Date();
  const currentMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
  );
  const monthsSeq = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(
      Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 11 + index, 1)
    );
    return { year: month.getUTCFullYear(), month: month.getUTCMonth() };
  });

  const counts = new Map<string, number>();
  for (const s of scrobbles) {
    const k = `${s.year}-${s.month}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }

  for (const item of monthsSeq) {
    const k = `${item.year}-${item.month}`;
    buckets.push({
      label: `${monthNames[item.month]} '${String(item.year).slice(2)}`,
      monthKey: k,
      plays: counts.get(k) || 0,
    });
  }
  return buckets;
}
