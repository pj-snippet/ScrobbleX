import {
  Album,
  Artist,
  Scrobble,
  SyncState,
  Track,
  UserProfile,
} from '../types/music';

const DB_NAME = 'ScrobbleX_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Scrobbles store
      if (!db.objectStoreNames.contains('scrobbles')) {
        const scrobblesStore = db.createObjectStore('scrobbles', { keyPath: 'id' });
        scrobblesStore.createIndex('timestamp', 'timestamp', { unique: false });
        scrobblesStore.createIndex('artistId', 'artistId', { unique: false });
        scrobblesStore.createIndex('albumId', 'albumId', { unique: false });
        scrobblesStore.createIndex('trackId', 'trackId', { unique: false });
        scrobblesStore.createIndex('dateKey', 'dateKey', { unique: false });
        scrobblesStore.createIndex('loved', 'loved', { unique: false });
      }

      // Artists store
      if (!db.objectStoreNames.contains('artists')) {
        const artistsStore = db.createObjectStore('artists', { keyPath: 'id' });
        artistsStore.createIndex('name', 'name', { unique: false });
      }

      // Albums store
      if (!db.objectStoreNames.contains('albums')) {
        const albumsStore = db.createObjectStore('albums', { keyPath: 'id' });
        albumsStore.createIndex('artistId', 'artistId', { unique: false });
        albumsStore.createIndex('title', 'title', { unique: false });
      }

      // Tracks store
      if (!db.objectStoreNames.contains('tracks')) {
        const tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
        tracksStore.createIndex('artistId', 'artistId', { unique: false });
        tracksStore.createIndex('albumId', 'albumId', { unique: false });
        tracksStore.createIndex('title', 'title', { unique: false });
      }

      // Key-value metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// User Profile
export async function dbSaveUserProfile(profile: UserProfile): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put({ key: 'user_profile', value: profile });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbLoadUserProfile(): Promise<UserProfile | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const req = store.get('user_profile');
    req.onsuccess = () => resolve(req.result ? (req.result.value as UserProfile) : null);
    req.onerror = () => reject(req.error);
  });
}

// Sync State
export async function dbSaveSyncState(state: SyncState): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put({ key: 'sync_state', value: state });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbLoadSyncState(): Promise<SyncState | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const req = store.get('sync_state');
    req.onsuccess = () => resolve(req.result ? (req.result.value as SyncState) : null);
    req.onerror = () => reject(req.error);
  });
}

// Loved Track IDs
export async function dbSaveLovedTrackIds(ids: string[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put({ key: 'loved_track_ids', value: ids });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbLoadLovedTrackIds(): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const req = store.get('loved_track_ids');
    req.onsuccess = () => resolve(req.result ? (req.result.value as string[]) : []);
    req.onerror = () => reject(req.error);
  });
}

// Batch Save Scrobbles & Entities
export async function dbSaveBatch(
  scrobbles: Scrobble[],
  artists: Artist[] = [],
  albums: Album[] = [],
  tracks: Track[] = []
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['scrobbles', 'artists', 'albums', 'tracks'], 'readwrite');

    const scrobbleStore = tx.objectStore('scrobbles');
    for (const scrobble of scrobbles) {
      scrobbleStore.put(scrobble);
    }

    const artistStore = tx.objectStore('artists');
    for (const artist of artists) {
      artistStore.put(artist);
    }

    const albumStore = tx.objectStore('albums');
    for (const album of albums) {
      albumStore.put(album);
    }

    const trackStore = tx.objectStore('tracks');
    for (const track of tracks) {
      trackStore.put(track);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Load all scrobbles sorted descending by timestamp
export async function dbLoadAllScrobbles(): Promise<Scrobble[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scrobbles', 'readonly');
    const store = tx.objectStore('scrobbles');
    const index = store.index('timestamp');
    const scrobbles: Scrobble[] = [];

    // Open cursor in prev direction (newest first)
    const request = index.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        scrobbles.push(cursor.value);
        cursor.continue();
      } else {
        resolve(scrobbles);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// Load all catalog entities (artists, albums, tracks)
export async function dbLoadCatalog(): Promise<{
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
}> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['artists', 'albums', 'tracks'], 'readonly');

    const artistsReq = tx.objectStore('artists').getAll();
    const albumsReq = tx.objectStore('albums').getAll();
    const tracksReq = tx.objectStore('tracks').getAll();

    tx.oncomplete = () => {
      resolve({
        artists: artistsReq.result || [],
        albums: albumsReq.result || [],
        tracks: tracksReq.result || [],
      });
    };

    tx.onerror = () => reject(tx.error);
  });
}

// Get total scrobbles count
export async function dbGetScrobbleCount(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scrobbles', 'readonly');
    const countReq = tx.objectStore('scrobbles').count();
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => reject(countReq.error);
  });
}

// Clear all database tables
export async function dbClearAllData(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ['scrobbles', 'artists', 'albums', 'tracks', 'metadata'],
      'readwrite'
    );
    tx.objectStore('scrobbles').clear();
    tx.objectStore('artists').clear();
    tx.objectStore('albums').clear();
    tx.objectStore('tracks').clear();
    tx.objectStore('metadata').clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
