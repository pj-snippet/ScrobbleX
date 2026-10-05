import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AccentColor,
  BaseTheme,
  Scrobble,
  SyncState,
  UserProfile,
} from '../types/music';
import {
  DEFAULT_USER_PROFILE,
  INITIAL_SYNC_STATE,
  TRACKS_CATALOG,
} from '../data/catalog/musicCatalog';
import {
  clearLocalScrobbles,
  getAllTrackDurationMetadata,
  getAllScrobblesForAnalytics,
  getLocalDatabaseSizeBytes,
} from '../data/local/scrobbleRepository';
import {
  ACCENT_THEMES,
  BASE_THEMES,
  getEffectiveAccent,
} from '../features/themes/themeRegistry';
import { EntityDetailSheet, type SelectedEntity } from '../components/common/EntityDetailSheet';
import { ListeningStoryModal } from '../features/listening-story/ListeningStoryModal';
import type { LastFmConnection } from '../features/lastfm/api/lastfmApi';
import { registerScrobbleMetadata } from '../features/analytics/services/analyticsEngine';
import { runScrobbleSync } from '../features/sync/services/syncService';
import { useLivePlayback } from '../features/telemetry/hooks/useLivePlayback';
import { useTrackDurationBackfill } from '../features/analytics/hooks/useTrackDurationBackfill';
import {
  applyCachedTrackDurations,
  registerCachedTrackDurations,
} from '../features/analytics/services/trackDurationEnrichment';
import { AppHeader } from './components/AppHeader';
import { AppScreenRouter } from './components/AppScreenRouter';
import { MoreFeaturesMenu } from './components/MoreFeaturesMenu';
import { PrimaryNavigation } from './components/PrimaryNavigation';
import type { AppTab } from './navigation/appTabs';
import {
  logTempMeasurement,
  measureTempAsync,
  measureTempSync,
} from '../utils/tempPerformance';

const LASTFM_USERNAME_KEY = 'scrobblex_lastfm_username';
const LAST_SUCCESSFUL_SYNC_KEY_PREFIX = 'scrobblex_last_successful_sync_at:';
const AUTOMATIC_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const SYNC_RETRY_CHECK_MS = 15 * 1000;

function getLastSuccessfulSyncKey(username: string): string {
  return `${LAST_SUCCESSFUL_SYNC_KEY_PREFIX}${username.toLowerCase()}`;
}

function readLastSuccessfulSyncAt(username: string): number | null {
  const storedTimestamp = Number(localStorage.getItem(getLastSuccessfulSyncKey(username)));
  return Number.isFinite(storedTimestamp) && storedTimestamp > 0
    ? storedTimestamp
    : null;
}

function mergeScrobblesByTimestamp(
  existing: Scrobble[],
  additions: Scrobble[]
): Scrobble[] {
  if (additions.length === 0) return existing;
  const merged: Scrobble[] = [];
  let existingIndex = 0;
  let additionsIndex = 0;
  while (existingIndex < existing.length && additionsIndex < additions.length) {
    if (existing[existingIndex].timestamp >= additions[additionsIndex].timestamp) {
      merged.push(existing[existingIndex++]);
    } else {
      merged.push(additions[additionsIndex++]);
    }

  }
  return merged
    .concat(existing.slice(existingIndex), additions.slice(additionsIndex));
}

export default function App() {
  const appInitializationStartedAt = useRef(performance.now());
  const databaseSizeBytesRef = useRef(0);
  // Theme state with localStorage persistence
  const [activeAccentColor, setActiveAccentColor] = useState<AccentColor>(() => {
    return (
      (localStorage.getItem('scrobblex_accent_color') as AccentColor) ||
      'blue'
    );
  });

  const [activeBaseTheme, setActiveBaseTheme] = useState<BaseTheme>(() => {
    return (
      (localStorage.getItem('scrobblex_base_theme') as BaseTheme) ||
      'slate'
    );
  });

  const [customHexColor, setCustomHexColor] = useState<string>(() => {
    return (
      localStorage.getItem('scrobblex_custom_hex') ||
      '#38BDF8'
    );
  });

  // Music & User state
  const [lastFmUsername, setLastFmUsername] = useState<string | null>(() => {
    return localStorage.getItem(LASTFM_USERNAME_KEY);
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const storedUsername = localStorage.getItem(LASTFM_USERNAME_KEY);
    return storedUsername
      ? { ...DEFAULT_USER_PROFILE, username: storedUsername, displayName: storedUsername }
      : DEFAULT_USER_PROFILE;
  });
  const [scrobbles, setScrobbles] = useState<Scrobble[]>([]);
  const [isLoadingLocalHistory, setIsLoadingLocalHistory] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_SYNC_STATE);
  const syncInFlight = useRef(false);
  const syncActionRef = useRef<() => Promise<void>>(async () => {});
  const lastSuccessfulSyncAtRef = useRef<number | null>(null);
  const lastAutomaticSyncAttemptAtRef = useRef<number | null>(null);
  const isLoadingLocalHistoryRef = useRef(isLoadingLocalHistory);
  isLoadingLocalHistoryRef.current = isLoadingLocalHistory;

  const [lovedTrackIds, setLovedTrackIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('scrobblex_loved_track_ids');
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          return new Set(
            parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
          );
        }
      }
    } catch {
      // Ignore corrupt storage and fall back to catalog defaults.
    }
    const ids = new Set<string>();
    TRACKS_CATALOG.forEach((t) => {
      if (t.loved) ids.add(t.id);
    });
    return ids;
  });

  useEffect(() => {
    localStorage.setItem(
      'scrobblex_loved_track_ids',
      JSON.stringify(Array.from(lovedTrackIds))
    );
  }, [lovedTrackIds]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // TEMP PERFORMANCE INSTRUMENTATION — REMOVE AFTER PROFILING
        const [localScrobbles, databaseSizeBytes, trackDurationMetadata] =
          await Promise.all([
            measureTempAsync(
              'app.startup.full_history_indexeddb_read',
              getAllScrobblesForAnalytics
            ),
            measureTempAsync('app.startup.database_size_scan', getLocalDatabaseSizeBytes),
            getAllTrackDurationMetadata(),
          ]);
        if (cancelled) return;
        databaseSizeBytesRef.current = databaseSizeBytes;
        measureTempSync(
          'app.startup.metadata_registration',
          () => registerScrobbleMetadata(localScrobbles),
          { records: localScrobbles.length }
        );
        registerCachedTrackDurations(trackDurationMetadata);
        const sortedScrobbles = measureTempSync(
          'app.startup.full_history_sort',
          () =>
            applyCachedTrackDurations(localScrobbles).sort(
              (a, b) => b.timestamp - a.timestamp
            ),
          { records: localScrobbles.length }
        );
        setScrobbles(sortedScrobbles);
        logTempMeasurement(
          'app.startup.full_history_available',
          performance.now() - appInitializationStartedAt.current,
          { records: sortedScrobbles.length }
        );
        setSyncState((previous) => ({
          ...previous,
          databaseSizeKB: Math.round(databaseSizeBytes / 1024),
        }));
      } catch (error) {
        if (!cancelled) {
          setSyncState((previous) => ({
            ...previous,
            status: 'failed',
            errorMessage:
              error instanceof Error ? error.message : 'Could not load local listening history.',
          }));
        }
      } finally {
        if (!cancelled) setIsLoadingLocalHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const { nowPlayingTrack } = useLivePlayback(
    Boolean(lastFmUsername),
    activeTab === 'home'
  );
  const refreshScrobblesFromTrackMetadata = useCallback(() => {
    setScrobbles((previous) => applyCachedTrackDurations(previous));
  }, []);
  const refreshTrackDurationBackfill = useTrackDurationBackfill(
    Boolean(lastFmUsername) && !isLoadingLocalHistory,
    scrobbles,
    refreshScrobblesFromTrackMetadata
  );

  // Secondary "More Features" modal sheet
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // My Listening Story Modal state
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [storyPreset, setStoryPreset] = useState<'2026' | '2025' | '12m' | '6m' | 'all'>('2026');

  // Entity Detail Sheet modal state
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);

  const handleTriggerSync = async () => {
    if (syncInFlight.current) return;
    const syncUsername = lastFmUsername;
    syncInFlight.current = true;
    setSyncState((previous) => ({ ...previous, status: 'syncing', errorMessage: null }));
    try {
      const result = await runScrobbleSync({
        databaseSizeBytes: databaseSizeBytesRef.current,
        onCloudRestoreProgress: (restoredCount) => {
          setSyncState((previous) => ({
            ...previous,
            status: 'syncing',
            importedScrobblesCount: restoredCount,
            errorMessage: null,
          }));
        },
        onPageAcknowledged: (state, mode) => {
          setSyncState((previous) => ({
            ...previous,
            status: state.status === 'complete' ? 'synced' : 'syncing',
            lastSyncedAt: state.last_sync_at
              ? Math.floor(new Date(state.last_sync_at).getTime() / 1000)
              : previous.lastSyncedAt,
            latestScrobbleTimestamp: state.newest_imported_at,
            importedScrobblesCount: state.imported_count,
            totalAvailableRemote: state.total_available,
            currentPage: state.current_page,
            totalPages: state.total_pages,
            isIncremental: mode === 'incremental',
            errorMessage: null,
          }));
        },
      });
      setScrobbles((previous) =>
        result.isFullHistory
          ? result.scrobbles
          : mergeScrobblesByTimestamp(previous, result.scrobbles)
      );
      databaseSizeBytesRef.current = result.databaseSizeBytes;
      const completedAt = Date.now();
      lastSuccessfulSyncAtRef.current = completedAt;
      if (syncUsername) {
        try {
          localStorage.setItem(
            getLastSuccessfulSyncKey(syncUsername),
            String(completedAt)
          );
        } catch (error) {
          console.error('Could not persist the last successful sync time.', error);
        }
      }
      setSyncState((previous) => ({
        ...previous,
        status: 'synced',
        lastSyncedAt: result.remoteState?.last_sync_at
          ? Math.floor(new Date(result.remoteState.last_sync_at).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        latestScrobbleTimestamp: result.remoteState?.newest_imported_at ?? null,
        importedScrobblesCount: result.remoteState?.imported_count ?? 0,
        totalAvailableRemote: result.remoteState?.total_available ?? 0,
        currentPage: 0,
        totalPages: result.remoteState?.total_pages ?? 0,
        isIncremental: result.mode === 'incremental',
        databaseSizeKB: Math.round(result.databaseSizeBytes / 1024),
        derivedAnalyticsUpdatedAt: Math.floor(Date.now() / 1000),
        errorMessage: null,
      }));
      refreshTrackDurationBackfill();
    } catch (error) {
      setSyncState((previous) => ({
        ...previous,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Last.fm sync failed.',
      }));
    } finally {
      syncInFlight.current = false;
    }
  };
  syncActionRef.current = handleTriggerSync;

  useEffect(() => {
    if (!lastFmUsername) return;

    lastSuccessfulSyncAtRef.current = readLastSuccessfulSyncAt(lastFmUsername);
    lastAutomaticSyncAttemptAtRef.current = null;

    let timeoutId: number | undefined;
    const clearScheduledSync = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };
    const scheduleNextSyncCheck = () => {
      clearScheduledSync();
      if (document.visibilityState !== 'visible') return;

      if (isLoadingLocalHistoryRef.current) {
        timeoutId = window.setTimeout(scheduleNextSyncCheck, 1000);
        return;
      }
      if (syncInFlight.current) {
        timeoutId = window.setTimeout(
          scheduleNextSyncCheck,
          SYNC_RETRY_CHECK_MS
        );
        return;
      }

      const lastRunAt = Math.max(
        lastSuccessfulSyncAtRef.current ?? 0,
        lastAutomaticSyncAttemptAtRef.current ?? 0
      );
      const timeUntilDue =
        lastRunAt === 0
          ? 0
          : AUTOMATIC_SYNC_INTERVAL_MS - (Date.now() - lastRunAt);
      if (timeUntilDue <= 0) {
        lastAutomaticSyncAttemptAtRef.current = Date.now();
        void syncActionRef.current();
        timeoutId = window.setTimeout(
          scheduleNextSyncCheck,
          SYNC_RETRY_CHECK_MS
        );
        return;
      }

      timeoutId = window.setTimeout(scheduleNextSyncCheck, timeUntilDue);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleNextSyncCheck();
      else clearScheduledSync();
    };

    scheduleNextSyncCheck();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearScheduledSync();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastFmUsername]);

  // Toggle loved track
  const handleToggleLoved = (trackId: string) => {
    setLovedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  // Cleanup duplicate scrobbles
  const handleCleanupDuplicates = () => {
    setScrobbles((prev) => {
      const asc = [...prev].sort((a, b) => a.timestamp - b.timestamp);
      const cleaned: Scrobble[] = [];
      for (let i = 0; i < asc.length; i++) {
        const cur = asc[i];
        if (i > 0) {
          const prevItem = asc[i - 1];
          if (
            cur.anomalyFlag === 'duplicate_timestamp' ||
            (cur.trackId === prevItem.trackId && cur.timestamp - prevItem.timestamp <= 3)
          ) {
            continue; // Skip duplicate
          }
        }
        cleaned.push(cur);
      }
      cleaned.sort((a, b) => b.timestamp - a.timestamp);
      return cleaned;
    });
  };

  // Reset only the persistent local cache; the cloud copy remains available to re-download.
  const handleResetDatabase = async () => {
    try {
      await clearLocalScrobbles();
      databaseSizeBytesRef.current = 0;
      setScrobbles([]);
      setSyncState((previous) => ({ ...previous, databaseSizeKB: 0 }));
    } catch (error) {
      setSyncState((previous) => ({
        ...previous,
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Could not clear local listening history.',
      }));
    }
  };

  // Export JSON
  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(scrobbles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scrobblex_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Theme updates with persistence
  const handleUpdateAccentColor = (color: AccentColor, customHex?: string) => {
    setActiveAccentColor(color);
    localStorage.setItem('scrobblex_accent_color', color);
    if (customHex) {
      setCustomHexColor(customHex);
      localStorage.setItem('scrobblex_custom_hex', customHex);
    }
  };

  const handleUpdateBaseTheme = (theme: BaseTheme) => {
    setActiveBaseTheme(theme);
    localStorage.setItem('scrobblex_base_theme', theme);
  };

  const handleLaunchStory = (preset: '2026' | '2025' | '12m' | '6m' | 'all' = '2026') => {
    setStoryPreset(preset);
    setIsStoryOpen(true);
  };

  const handleLastFmConnected = ({ username }: LastFmConnection) => {
    localStorage.setItem(LASTFM_USERNAME_KEY, username);
    setLastFmUsername(username);
    setUserProfile((profile) => ({
      ...profile,
      username,
      displayName: username,
    }));
  };

  const handleLastFmDisconnected = () => {
    setLastFmUsername(null);
    setUserProfile(DEFAULT_USER_PROFILE);
  };

  const currentAccent = getEffectiveAccent(activeAccentColor, customHexColor);
  const currentBase = BASE_THEMES[activeBaseTheme] || BASE_THEMES.slate;

  return (
    <div
      className={`min-h-screen ${currentBase.bgBody} text-slate-100 flex justify-center items-center font-sans antialiased selection:bg-blue-500/30 selection:text-white transition-colors duration-300`}
    >
      {/* Native Mobile Phone Viewport Shell */}
      <div
        className={`w-full max-w-md h-screen sm:h-[94vh] sm:max-h-[920px] ${currentBase.bgBody} sm:rounded-[40px] sm:border sm:border-slate-800/90 shadow-2xl flex flex-col overflow-hidden relative sm:ring-1 sm:ring-white/10`}
      >
        <AppHeader
          accent={currentAccent}
          baseTheme={currentBase}
          accentColor={activeAccentColor}
          syncStatus={syncState.status}
          onGoHome={() => setActiveTab('home')}
          onLaunchStory={() => handleLaunchStory('2026')}
          onSync={() => void handleTriggerSync()}
          onOpenMenu={() => setIsMoreMenuOpen(true)}
        />

        <AppScreenRouter
          isLoadingLocalHistory={isLoadingLocalHistory}
          scrobbles={scrobbles}
          nowPlayingTrack={nowPlayingTrack}
          activeTab={activeTab}
          onNavigateTab={setActiveTab}
          accentHex={currentAccent.hex}
          userProfile={userProfile}
          lovedTrackIds={lovedTrackIds}
          onSelectEntity={setSelectedEntity}
          accentColor={activeAccentColor}
          onToggleLoved={handleToggleLoved}
          onLaunchStory={handleLaunchStory}
          onCleanupDuplicates={handleCleanupDuplicates}
          syncState={syncState}
          lastFmUsername={lastFmUsername}
          activeBaseTheme={activeBaseTheme}
          customHexColor={customHexColor}
          onLastFmConnected={handleLastFmConnected}
          onLastFmDisconnected={handleLastFmDisconnected}
          onUpdateAccentColor={handleUpdateAccentColor}
          onUpdateBaseTheme={handleUpdateBaseTheme}
          onTriggerSync={handleTriggerSync}
          onResetDatabase={handleResetDatabase}
          onExportData={handleExportData}
        />

        <PrimaryNavigation
          activeTab={activeTab}
          accent={currentAccent}
          baseTheme={currentBase}
          onNavigate={setActiveTab}
        />

        <MoreFeaturesMenu
          isOpen={isMoreMenuOpen}
          lovedTrackCount={lovedTrackIds.size}
          onClose={() => setIsMoreMenuOpen(false)}
          onNavigate={setActiveTab}
          onLaunchStory={() => handleLaunchStory('2026')}
        />

        {/* Global Entity Detail Sheet Modal */}
        <EntityDetailSheet
          selectedEntity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          scrobbles={scrobbles}
          lovedTrackIds={lovedTrackIds}
          onToggleLoved={handleToggleLoved}
          onSelectEntity={setSelectedEntity}
          accentColor={activeAccentColor}
        />

        {/* Fullscreen Cinematic "My Listening Story" Modal */}
        <ListeningStoryModal
          isOpen={isStoryOpen}
          onClose={() => setIsStoryOpen(false)}
          scrobbles={scrobbles}
          initialPeriodPreset={storyPreset}
          accentColor={activeAccentColor}
        />
      </div>
    </div>
  );
}
