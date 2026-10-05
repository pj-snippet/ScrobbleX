import type { Album, Artist, SyncState, Track, UserProfile } from '../../types/music';

export const DEFAULT_USER_PROFILE: UserProfile = {
  username: '',
  displayName: '',
  avatarUrl: '',
  memberSince: '',
  registeredTimestamp: 0,
  country: '',
  currentObsessionTrackId: '',
  pinnedTrackId: '',
};

export const ARTISTS_CATALOG: Artist[] = [];
export const ALBUMS_CATALOG: Album[] = [];
export const TRACKS_CATALOG: Track[] = [];

export const INITIAL_SYNC_STATE: SyncState = {
  status: 'disconnected',
  lastSyncedAt: null,
  latestScrobbleTimestamp: null,
  importedScrobblesCount: 0,
  totalAvailableRemote: 0,
  currentPage: 0,
  totalPages: 0,
  isIncremental: false,
  errorMessage: null,
  databaseSizeKB: 0,
  derivedAnalyticsUpdatedAt: null,
};
