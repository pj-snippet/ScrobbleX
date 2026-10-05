export type TimeRangeFilter = '7d' | '30d' | '90d' | '6m' | '12m' | 'all';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'failed' | 'disconnected';

export type CalendarMetric = 'plays' | 'duration' | 'uniqueArtists' | 'uniqueTracks';
export type HeatmapMetric = 'plays' | 'duration' | 'uniqueTracks';
export type HeatmapGranularity = 1 | 3 | 6;

export type AccentColor =
  | 'blue'
  | 'emerald'
  | 'cyan'
  | 'purple'
  | 'amber'
  | 'rose'
  | 'red'
  | 'teal'
  | 'indigo'
  | 'custom';
export type BaseTheme = 'slate' | 'oled' | 'charcoal' | 'frost';

export interface UserProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  memberSince: string;
  registeredTimestamp: number;
  country: string;
  currentObsessionTrackId: string;
  pinnedTrackId: string;
}

export interface Artist {
  id: string;
  name: string;
  artworkUrl: string;
  primaryGenre: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  artworkUrl: string;
  releaseYear: number;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  artworkUrl: string;
  durationSec: number | null;
  loved: boolean;
  lovedAt?: number;
}

export interface Scrobble {
  id: string;
  trackId: string;
  artistId: string;
  albumId: string;
  trackName?: string;
  artistName?: string;
  albumName?: string | null;
  trackMbid?: string | null;
  artistMbid?: string | null;
  albumMbid?: string | null;
  artworkUrl?: string | null;
  timestamp: number;
  timestampUTC: string;
  dateKey: string;
  year: number;
  month: number;
  dayOfWeek: number;
  hourOfDay: number;
  durationSec: number | null;
  nowPlaying?: boolean;
  loved: boolean;
  source: 'lastfm-api' | 'incremental-sync' | 'historical-import';
  anomalyFlag?: 'duplicate_timestamp' | 'rapid_interval' | 'dense_burst';
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  latestScrobbleTimestamp: number | null;
  importedScrobblesCount: number;
  totalAvailableRemote: number;
  currentPage: number;
  totalPages: number;
  isIncremental: boolean;
  errorMessage: string | null;
  databaseSizeKB: number;
  derivedAnalyticsUpdatedAt: number | null;
}

export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

export interface DailyActivitySummary {
  dateKey: string;
  timestamp: number;
  plays: number;
  durationSec: number;
  unknownDurationCount: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  uniqueTracks: number;
  topArtist: { id: string; name: string; plays: number } | null;
  topTrack: { id: string; title: string; artistName: string; plays: number; artworkUrl: string } | null;
  firstPlayTime: string | null;
  lastPlayTime: string | null;
  intensityLevel: IntensityLevel;
}

export interface WeeklyHeatmapCell {
  dayOfWeek: number;
  dayName: string;
  startHour: number;
  endHour: number;
  label: string;
  plays: number;
  durationSec: number;
  unknownDurationCount: number;
  uniqueTracks: number;
  intensity: number;
  topArtists: { id: string; name: string; plays: number }[];
  topTracks: { id: string; title: string; artistName: string; plays: number }[];
}

export interface ListeningSession {
  id: string;
  startTimestamp: number;
  endTimestamp: number;
  durationSec: number;
  trackCount: number;
  dateKey: string;
  topArtistName: string;
}

export interface SessionAnalyticsSummary {
  inactivityThresholdMinutes: number;
  totalSessions: number;
  avgSessionDurationMin: number;
  avgSessionDurationSec: number;
  avgSessionUnknownDurationCount: number;
  longestSessionMin: number;
  longestSessionDurationSec: number;
  longestSessionUnknownDurationCount: number;
  longestSessionDate: string;
  longestSessionTracks: number;
  avgTracksPerSession: number;
  busiestSessionWindow: string;
}

export interface DerivedInsight {
  id: string;
  category: 'rhythm' | 'session' | 'peak' | 'weekend' | 'concentration';
  statement: string;
  supportingDetail: string;
  metricBadge: string;
}

export interface RankedEntityItem {
  id: string;
  name: string;
  subtitle: string;
  artworkUrl: string;
  plays: number;
  durationSec: number;
  sharePercent: number;
  rank: number;
}

export interface TimelineComparisonItem {
  id: string;
  name: string;
  subtitle: string;
  artworkUrl: string;
  periodARank: number | null;
  periodBRank: number | null;
  periodAPlays: number;
  periodBPlays: number;
  rankDelta: number | null;
  playDelta: number;
  status: 'rose' | 'fell' | 'steady' | 'new' | 'dropped';
}

export type RediscoverCategory = 'forgotten_favorites' | 'old_obsessions' | 'fading_favorites' | 'recently_returned';

export interface RediscoverCandidate {
  trackId: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  artworkUrl: string;
  totalHistoricalPlays: number;
  daysSinceLastPlay: number;
  lastPlayedDate: string;
  peakPeriodLabel: string;
  peakPeriodPlays: number;
  concentrationRatio: number;
  recentPlaysLast14d: number;
  category: RediscoverCategory;
  score: number;
  evidenceExplanation: string;
  loved: boolean;
}

export interface IntegritySignal {
  id: string;
  label: string;
  detail: string;
  valueLabel: string;
}

export interface IntegrityAnomalyRecord {
  scrobbleId: string;
  trackTitle: string;
  artistName: string;
  timestampFormatted: string;
  reason: string;
  deltaSeconds?: number;
}

export interface IntegrityIssue {
  id: string;
  severity: 'low' | 'moderate' | 'elevated';
  label: string;
  detail: string;
  affectedCount: number;
  percentage: number;
  samples: IntegrityAnomalyRecord[];
}

export interface TrustAnalysisReport {
  score: number;
  confidenceLevel: 'High Confidence' | 'Moderate Confidence' | 'Review Recommended';
  evaluatedScrobbles: number;
  timeSpanDays: number;
  positiveSignals: IntegritySignal[];
  potentialIssues: IntegrityIssue[];
  duplicateRatioPercent: number;
  rapidIntervalRatioPercent: number;
  denseBurstDaysCount: number;
  normalIntervalPercent: number;
}

export interface AppSettings {
  accentColor: AccentColor;
  baseTheme: BaseTheme;
  compactLists: boolean;
  reduceAnimations: boolean;
  sessionGapMinutes: 15 | 25 | 45;
  notifySyncComplete: boolean;
  notifySyncFailed: boolean;
  notifyIntegrityAlert: boolean;
  offlineSimulation: boolean;
  accountDatasetMode: 'full_history' | 'new_account' | 'empty_account';
}
