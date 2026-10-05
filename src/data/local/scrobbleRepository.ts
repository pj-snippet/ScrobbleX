import type { Scrobble } from '../../types/music';

const DATABASE_NAME = 'scrobblex-local';
const DATABASE_VERSION = 3;
const SCROBBLES_STORE = 'scrobbles';
const TRACK_METADATA_STORE = 'trackMetadata';
const PAGE_SIZE = 200;

export interface TrackDurationMetadata {
  trackId: string;
  trackMbid: string | null;
  artistName: string;
  trackName: string;
  durationSec: number | null;
  checkedAt: number;
}

export interface ImportedScrobble {
  user_id: string;
  event_id: string;
  track_id: string;
  artist_id: string;
  album_id: string | null;
  track_name: string;
  artist_name: string;
  album_name: string | null;
  track_mbid: string | null;
  artist_mbid: string | null;
  album_mbid: string | null;
  played_at: number;
  loved: boolean | null;
  artwork_url: string | null;
  source: 'lastfm';
}

export interface ScrobblePageCursor {
  timestamp: number;
  id: string;
}

export interface LocalHistoryPageOptions {
  limit?: number;
  before?: ScrobblePageCursor;
  dateFilter?: string;
  query?: string;
}

export interface ImportedScrobbleInsertResult {
  inserted: Scrobble[];
}

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in globalThis)) {
    return Promise.reject(new Error('IndexedDB is unavailable on this device.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SCROBBLES_STORE)) {
        const store = database.createObjectStore(SCROBBLES_STORE, { keyPath: 'id' });
        store.createIndex('byTimestampId', ['timestamp', 'id'], { unique: true });
        store.createIndex('byTrackTimestamp', ['trackId', 'timestamp']);
        store.createIndex('byArtistTimestamp', ['artistId', 'timestamp']);
        store.createIndex('byAlbumTimestamp', ['albumId', 'timestamp']);
        store.createIndex('byDate', 'dateKey');
      }
      if (!database.objectStoreNames.contains(TRACK_METADATA_STORE)) {
        database.createObjectStore(TRACK_METADATA_STORE, { keyPath: 'trackId' });
      }
      if (event.oldVersion < 2 && database.objectStoreNames.contains(SCROBBLES_STORE)) {
        const store = request.transaction!.objectStore(SCROBBLES_STORE);
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const row = cursor.value as Scrobble;
          if (row.durationSec === undefined || row.durationSec <= 0) {
            cursor.update({ ...row, durationSec: null });
          }
          cursor.continue();
        };
      }
      if (event.oldVersion < 3 && database.objectStoreNames.contains(SCROBBLES_STORE)) {
        const scrobbleStore = request.transaction!.objectStore(SCROBBLES_STORE);
        const metadataStore = request.transaction!.objectStore(TRACK_METADATA_STORE);
        const metadataCandidates = new Map<string, TrackDurationMetadata | null>();
        const cursorRequest = scrobbleStore.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) {
            for (const metadata of metadataCandidates.values()) {
              if (metadata) metadataStore.put(metadata);
            }
            return;
          }
          const scrobble = cursor.value as Omit<Scrobble, 'durationSec'> & {
            durationSec?: number | null;
          };
          if (scrobble.durationSec !== null && scrobble.durationSec > 0) {
            const existing = metadataCandidates.get(scrobble.trackId);
            if (existing && existing.durationSec !== scrobble.durationSec) {
              metadataCandidates.set(scrobble.trackId, null);
            } else if (!metadataCandidates.has(scrobble.trackId)) {
              metadataCandidates.set(scrobble.trackId, {
                trackId: scrobble.trackId,
                trackMbid: scrobble.trackMbid || null,
                artistName: scrobble.artistName || '',
                trackName: scrobble.trackName || '',
                durationSec: scrobble.durationSec,
                checkedAt: Date.now(),
              });
            }
          }
          const rawScrobble = { ...scrobble };
          delete rawScrobble.durationSec;
          cursor.update(rawScrobble);
          cursor.continue();
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local history.'));
    request.onblocked = () =>
      reject(new Error('Local history upgrade is blocked by another open ScrobbleX tab.'));
  });
}

function normalizeImportedScrobble(row: ImportedScrobble): Scrobble {
  const date = new Date(row.played_at * 1000);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const jsDay = date.getUTCDay();
  return {
    id: `${row.user_id}:${row.event_id}`,
    trackId: row.track_id,
    artistId: row.artist_id,
    albumId: row.album_id || '',
    trackName: row.track_name,
    artistName: row.artist_name,
    albumName: row.album_name,
    trackMbid: row.track_mbid,
    artistMbid: row.artist_mbid,
    albumMbid: row.album_mbid,
    artworkUrl: row.artwork_url,
    timestamp: row.played_at,
    timestampUTC: date.toISOString(),
    dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    year,
    month,
    dayOfWeek: jsDay === 0 ? 6 : jsDay - 1,
    hourOfDay: date.getUTCHours(),
    durationSec: null,
    loved: row.loved || false,
    nowPlaying: false,
    source: 'lastfm-api',
  };
}

function normalizeStoredScrobble(value: Scrobble): Scrobble {
  return { ...value, durationSec: value.durationSec ?? null };
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error || new Error('Local history transaction failed.'));
    transaction.onabort = () =>
      reject(transaction.error || new Error('Local history transaction was aborted.'));
  });
}

export async function insertImportedScrobbles(
  rows: ImportedScrobble[]
): Promise<ImportedScrobbleInsertResult> {
  if (rows.length === 0) return { inserted: [] };
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SCROBBLES_STORE, 'readwrite');
    const completion = waitForTransaction(transaction);
    const store = transaction.objectStore(SCROBBLES_STORE);
    const inserted: Scrobble[] = [];
    for (const row of rows) {
      const record = normalizeImportedScrobble(row);
      const request = store.add(record);
      request.onsuccess = () => {
        inserted.push(record);
      };
      request.onerror = (event) => {
        if (request.error?.name === 'ConstraintError') {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      };
    }
    await completion;
    return { inserted };
  } finally {
    database.close();
  }
}

export async function getScrobblePage(
  limit = PAGE_SIZE,
  before?: ScrobblePageCursor
): Promise<{ items: Scrobble[]; nextCursor: ScrobblePageCursor | null }> {
  const safeLimit = Math.max(1, Math.min(PAGE_SIZE, Math.floor(limit)));
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SCROBBLES_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const store = transaction.objectStore(SCROBBLES_STORE);
    const index = store.index('byTimestampId');
    const range = before
      ? IDBKeyRange.upperBound([before.timestamp, before.id], true)
      : undefined;
    const items: Scrobble[] = [];

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range, 'prev');
      request.onerror = () =>
        reject(request.error || new Error('Could not read local listening history.'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor || items.length >= safeLimit) {
          resolve();
          return;
        }
        items.push(normalizeStoredScrobble(cursor.value as Scrobble));
        cursor.continue();
      };
    });
    await completion;
    const last = items[items.length - 1];
    return {
      items,
      nextCursor:
        items.length === safeLimit && last
          ? { timestamp: last.timestamp, id: last.id }
          : null,
    };
  } finally {
    database.close();
  }
}

export async function getLocalHistoryPage({
  limit = PAGE_SIZE,
  before,
  dateFilter = '',
  query = '',
}: LocalHistoryPageOptions = {}): Promise<{
  items: Scrobble[];
  nextCursor: ScrobblePageCursor | null;
}> {
  const safeLimit = Math.max(1, Math.min(PAGE_SIZE, Math.floor(limit)));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SCROBBLES_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const index = transaction.objectStore(SCROBBLES_STORE).index('byTimestampId');
    const range = before
      ? IDBKeyRange.upperBound([before.timestamp, before.id], true)
      : undefined;
    const matched: Scrobble[] = [];
    let hasMore = false;

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range, 'prev');
      request.onerror = () =>
        reject(request.error || new Error('Could not search local listening history.'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        const scrobble = normalizeStoredScrobble(cursor.value as Scrobble);
        const matchesDate = !dateFilter || scrobble.dateKey.startsWith(dateFilter);
        const searchableText = [
          scrobble.trackName,
          scrobble.artistName,
          scrobble.albumName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();
        if (matchesDate && (!normalizedQuery || searchableText.includes(normalizedQuery))) {
          if (matched.length === safeLimit) {
            hasMore = true;
            resolve();
            return;
          }
          matched.push(scrobble);
        }
        cursor.continue();
      };
    });
    await completion;
    const last = matched[matched.length - 1];
    return {
      items: matched,
      nextCursor:
        hasMore && last ? { timestamp: last.timestamp, id: last.id } : null,
    };
  } finally {
    database.close();
  }
}

export async function getScrobbleCount(): Promise<number> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SCROBBLES_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const count = await new Promise<number>((resolve, reject) => {
      const request = transaction.objectStore(SCROBBLES_STORE).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error || new Error('Could not count local scrobbles.'));
    });
    await completion;
    return count;
  } finally {
    database.close();
  }
}

export async function getLocalDatabaseSizeKB(): Promise<number> {
  const sizeBytes = await getLocalDatabaseSizeBytes();
  return Math.round(sizeBytes / 1024);
}

export async function getLocalDatabaseSizeBytes(): Promise<number> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SCROBBLES_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const sizeBytes = await new Promise<number>((resolve, reject) => {
      let totalBytes = 0;
      const request = transaction.objectStore(SCROBBLES_STORE).openCursor();
      request.onerror = () =>
        reject(request.error || new Error('Could not measure local listening history.'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(totalBytes);
          return;
        }
        totalBytes += new TextEncoder().encode(JSON.stringify(cursor.value)).byteLength;
        cursor.continue();
      };
    });
    await completion;
    return sizeBytes;
  } finally {
    database.close();
  }
}

export async function getAllScrobblesForAnalytics(): Promise<Scrobble[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SCROBBLES_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const rows = await new Promise<Scrobble[]>((resolve, reject) => {
      const request = transaction.objectStore(SCROBBLES_STORE).getAll();
      request.onsuccess = () =>
        resolve((request.result as Scrobble[]).map(normalizeStoredScrobble));
      request.onerror = () =>
        reject(request.error || new Error('Could not load local listening history.'));
    });
    await completion;
    return rows;
  } finally {
    database.close();
  }
}

export async function getAllTrackDurationMetadata(): Promise<TrackDurationMetadata[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(TRACK_METADATA_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const rows = await new Promise<TrackDurationMetadata[]>((resolve, reject) => {
      const request = transaction
        .objectStore(TRACK_METADATA_STORE)
        .getAll();
      request.onsuccess = () => resolve(request.result as TrackDurationMetadata[]);
      request.onerror = () =>
        reject(request.error || new Error('Could not read cached track metadata.'));
    });
    await completion;
    return rows;
  } finally {
    database.close();
  }
}

export async function saveTrackDurationMetadata(
  rows: TrackDurationMetadata[]
): Promise<void> {
  if (rows.length === 0) return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(TRACK_METADATA_STORE, 'readwrite');
    const completion = waitForTransaction(transaction);
    const store = transaction.objectStore(TRACK_METADATA_STORE);
    for (const row of rows) store.put(row);
    await completion;
  } finally {
    database.close();
  }
}

export async function clearLocalScrobbles(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SCROBBLES_STORE, 'readwrite');
    const completion = waitForTransaction(transaction);
    transaction.objectStore(SCROBBLES_STORE).clear();
    await completion;
  } finally {
    database.close();
  }
}
