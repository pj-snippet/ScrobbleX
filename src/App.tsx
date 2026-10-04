import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Compass,
  Disc3,
  Heart,
  History,
  Palette,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  ShieldCheck,
  PieChart,
  Layers,
  Menu,
  X,
  Play,
  Radio,
  RefreshCw,
} from 'lucide-react';
import {
  AccentColor,
  BaseTheme,
  Scrobble,
  SyncState,
  UserProfile,
} from './types/music';
import {
  dbLoadAllScrobbles,
  dbLoadCatalog,
  dbLoadLovedTrackIds,
  dbLoadSyncState,
  dbLoadUserProfile,
  dbSaveLovedTrackIds,
  dbSaveSyncState,
  dbSaveUserProfile,
  dbSaveBatch,
  dbClearAllData,
} from './data/indexedDb';
import {
  DEFAULT_USER_PROFILE,
  INITIAL_SYNC_STATE,
  buildInitialNormalizedScrobbles,
  ARTISTS_CATALOG,
  ALBUMS_CATALOG,
  TRACKS_CATALOG,
} from './data/localDatabase';
import {
  connectLastFmUsername,
  exchangeSessionToken,
  getLastFmAuthUrl,
  syncLastFmScrobbles,
  syncLovedTracks,
} from './data/lastfmService';
import { registerEntities } from './domain/analyticsEngine';
import { SyncStatusPill, BottomSheetModal } from './components/MobilePrimitives';
import {
  EntityDetailSheet,
  SelectedEntity,
} from './components/EntityDetailSheet';
import { HomeScreen } from './screens/HomeScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { ChartsScreen } from './screens/ChartsScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { RediscoverScreen } from './screens/RediscoverScreen';
import { HistoryAndSearchScreen } from './screens/HistoryAndSearchScreen';
import { LovedAndTrustScreen } from './screens/LovedAndTrustScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ListeningStoryModal } from './components/ListeningStoryModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const DEFAULT_DISCONNECTED_SYNC_STATE: SyncState = {
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

function ScrobbleXApp() {
  const { tokens } = useTheme();

  // Music & User state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [scrobbles, setScrobbles] = useState<Scrobble[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(DEFAULT_DISCONNECTED_SYNC_STATE);
  const [lovedTrackIds, setLovedTrackIds] = useState<Set<string>>(new Set());
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'home'
    | 'activity'
    | 'charts'
    | 'timeline'
    | 'profile'
    | 'rediscover'
    | 'history'
    | 'loved'
    | 'integrity'
    | 'settings'
  >('home');

  // Modals state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [storyPreset, setStoryPreset] = useState<'2026' | '2025' | '12m' | '6m' | 'all'>('2026');
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);

  // 1. Initialize data from IndexedDB on startup
  useEffect(() => {
    async function initData() {
      try {
        const [savedProfile, savedSync, savedScrobbles, savedLoved, catalog] = await Promise.all([
          dbLoadUserProfile(),
          dbLoadSyncState(),
          dbLoadAllScrobbles(),
          dbLoadLovedTrackIds(),
          dbLoadCatalog(),
        ]);

        if (catalog.artists.length > 0 || catalog.albums.length > 0 || catalog.tracks.length > 0) {
          registerEntities(catalog);
        }

        if (savedProfile) {
          setUserProfile(savedProfile);
        }
        if (savedSync) {
          setSyncState(savedSync);
        }
        if (savedScrobbles && savedScrobbles.length > 0) {
          setScrobbles(savedScrobbles);
        }
        if (savedLoved && savedLoved.length > 0) {
          setLovedTrackIds(new Set(savedLoved));
        }
      } catch (err) {
        console.error('Failed to initialize local IndexedDB:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    initData();
  }, []);

  // 2. Handle return from Last.fm official Web Auth (callback URL with ?token=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleExchangeAuthToken(token);
    }
  }, []);

  // Exchange auth token for authenticated session
  const handleExchangeAuthToken = async (token: string) => {
    setSyncProgress('Exchanging authentication with Last.fm...');
    try {
      const { username, userProfile: profile } = await exchangeSessionToken(token);
      setUserProfile(profile);
      await dbSaveUserProfile(profile);

      const initialSync: SyncState = {
        ...DEFAULT_DISCONNECTED_SYNC_STATE,
        status: 'syncing',
      };
      setSyncState(initialSync);
      await dbSaveSyncState(initialSync);

      // Perform initial scrobble sync
      await runSync(username, false);
      setActiveTab('home');
    } catch (err: any) {
      console.error('Auth token exchange failed:', err);
      setSyncState((prev) => ({
        ...prev,
        status: 'failed',
        errorMessage: err.message || 'Authentication exchange failed.',
      }));
    } finally {
      setSyncProgress(null);
    }
  };

  // Connect via Last.fm username directly
  const handleConnectUsername = async (username: string) => {
    setSyncProgress(`Verifying account @${username} on Last.fm...`);
    try {
      const profile = await connectLastFmUsername(username);
      setUserProfile(profile);
      await dbSaveUserProfile(profile);

      const initialSync: SyncState = {
        ...DEFAULT_DISCONNECTED_SYNC_STATE,
        status: 'syncing',
      };
      setSyncState(initialSync);
      await dbSaveSyncState(initialSync);

      await runSync(username, false);
    } catch (err: any) {
      console.error('Username connect failed:', err);
      throw err;
    } finally {
      setSyncProgress(null);
    }
  };

  // Open Last.fm official authorization URL
  const handleConnectAuthUrl = async () => {
    const authUrl = await getLastFmAuthUrl();
    window.location.href = authUrl;
  };

  // Disconnect Last.fm account and reset storage
  const handleDisconnectAccount = async () => {
    await dbClearAllData();
    setUserProfile(null);
    setScrobbles([]);
    setLovedTrackIds(new Set());
    setSyncState(DEFAULT_DISCONNECTED_SYNC_STATE);
  };

  // Load rich synthetic demo dataset for testing or exploration
  const handleLoadDemoData = async () => {
    setSyncProgress('Loading rich demo catalog & listening history...');
    try {
      const demoScrobbles = buildInitialNormalizedScrobbles(true);
      registerEntities({
        artists: ARTISTS_CATALOG,
        albums: ALBUMS_CATALOG,
        tracks: TRACKS_CATALOG,
      });

      await dbSaveBatch(demoScrobbles, ARTISTS_CATALOG, ALBUMS_CATALOG, TRACKS_CATALOG);
      await dbSaveUserProfile(DEFAULT_USER_PROFILE);

      const demoLovedIds = TRACKS_CATALOG.filter((t) => t.loved).map((t) => t.id);
      await dbSaveLovedTrackIds(demoLovedIds);

      const count = demoScrobbles.length;
      const sizeEstimateKB = Math.round((count * 180) / 1024);

      const demoSync: SyncState = {
        ...INITIAL_SYNC_STATE,
        status: 'synced',
        importedScrobblesCount: count,
        totalAvailableRemote: count,
        databaseSizeKB: sizeEstimateKB,
      };
      await dbSaveSyncState(demoSync);

      setUserProfile(DEFAULT_USER_PROFILE);
      setScrobbles(demoScrobbles);
      setLovedTrackIds(new Set(demoLovedIds));
      setSyncState(demoSync);
      setActiveTab('home');
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setSyncProgress(null);
    }
  };

  // Core synchronization execution
  const runSync = async (username: string, fullResync = false) => {
    setSyncState((prev) => ({ ...prev, status: 'syncing', errorMessage: null }));

    try {
      const fromTs = fullResync ? undefined : (syncState.latestScrobbleTimestamp || undefined);
      const result = await syncLastFmScrobbles(username, {
        fromTimestamp: fromTs,
        onProgress: (p) => {
          setSyncProgress(`${p.statusText} (${p.importedCount} saved)`);
        },
      });

      // Synchronize loved tracks list
      const lovedIds = await syncLovedTracks(username);
      if (lovedIds.length > 0) {
        setLovedTrackIds(new Set(lovedIds));
        await dbSaveLovedTrackIds(lovedIds);
      }

      // Reload scrobbles from IndexedDB
      const allScrobbles = await dbLoadAllScrobbles();
      setScrobbles(allScrobbles);

      const count = allScrobbles.length;
      const sizeEstimateKB = Math.round((count * 180) / 1024);

      const newSyncState: SyncState = {
        status: 'synced',
        lastSyncedAt: Math.floor(Date.now() / 1000),
        latestScrobbleTimestamp:
          result.latestTimestamp ||
          syncState.latestScrobbleTimestamp ||
          (allScrobbles[0]?.timestamp ?? null),
        importedScrobblesCount: count,
        totalAvailableRemote: userProfile?.totalScrobbles || count,
        currentPage: 1,
        totalPages: 1,
        isIncremental: !fullResync,
        errorMessage: null,
        databaseSizeKB: sizeEstimateKB,
        derivedAnalyticsUpdatedAt: Math.floor(Date.now() / 1000),
      };

      setSyncState(newSyncState);
      await dbSaveSyncState(newSyncState);
    } catch (err: any) {
      console.error('Scrobble sync failed:', err);
      setSyncState((prev) => ({
        ...prev,
        status: 'failed',
        errorMessage: err.message || 'Sync failed. Please check your network connection.',
      }));
    } finally {
      setSyncProgress(null);
    }
  };

  const handleTriggerSync = (fullResync = false) => {
    if (!userProfile?.username) {
      setActiveTab('settings');
      return;
    }
    runSync(userProfile.username, fullResync);
  };

  // Toggle loved track locally
  const handleToggleLoved = (trackId: string) => {
    setLovedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      dbSaveLovedTrackIds(Array.from(next));
      return next;
    });
  };

  // Cleanup duplicates from local scrobbles
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
            (cur.trackId === prevItem.trackId && Math.abs(cur.timestamp - prevItem.timestamp) <= 3)
          ) {
            continue;
          }
        }
        cleaned.push(cur);
      }
      cleaned.sort((a, b) => b.timestamp - a.timestamp);
      return cleaned;
    });
  };

  // Reset local database
  const handleResetDatabase = async () => {
    await dbClearAllData();
    setScrobbles([]);
    setLovedTrackIds(new Set());
    setSyncState((prev) => ({
      ...prev,
      importedScrobblesCount: 0,
      databaseSizeKB: 0,
      latestScrobbleTimestamp: null,
      lastSyncedAt: null,
    }));
  };

  // Export JSON of real scrobbles
  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(scrobbles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `scrobblex_${userProfile?.username || 'export'}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLaunchStory = (preset: '2026' | '2025' | '12m' | '6m' | 'all' = '2026') => {
    setStoryPreset(preset);
    setIsStoryOpen(true);
  };

  return (
    <div
      style={{ backgroundColor: tokens.bgApp }}
      className="min-h-screen text-app-primary flex justify-center items-center font-sans antialiased transition-colors duration-300"
    >
      {/* Native Mobile Phone Viewport Shell */}
      <div
        style={{
          backgroundColor: tokens.bgApp,
          borderColor: tokens.borderCard,
        }}
        className="w-full max-w-md h-screen sm:h-[94vh] sm:max-h-[920px] sm:rounded-[36px] sm:border shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Safe Area Spacer for Native Notch / Status Bar */}
        <div className="h-[env(safe-area-inset-top,0px)] w-full shrink-0" />

        {/* Mobile Header Bar with ScrobbleX Branding */}
        <header
          style={{
            backgroundColor: tokens.headerBg,
            borderColor: tokens.borderCardSub,
          }}
          className="px-5 py-3 flex items-center justify-between backdrop-blur-md border-b z-20 shrink-0"
        >
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
              style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
            >
              <Disc3 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-app-primary font-display">
                ScrobbleX
              </h1>
              <span className="text-[9px] font-mono text-app-muted block -mt-1 tracking-tight">
                {userProfile ? `@${userProfile.username}` : 'Your music. Your history.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scrobbles.length > 0 && (
              <button
                onClick={() => handleLaunchStory('2026')}
                style={{
                  backgroundColor: tokens.accentSubtle,
                  color: tokens.accentPrimary,
                  borderColor: tokens.accentBorder,
                }}
                className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-mono font-bold hover:brightness-110 transition-all cursor-pointer"
                title="Launch My Listening Story"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Story</span>
              </button>
            )}

            <SyncStatusPill
              status={syncState.status}
              onClick={() => handleTriggerSync(false)}
            />

            <button
              onClick={() => setIsMoreMenuOpen(true)}
              className="p-2 rounded-xl bg-app-subcard text-app-muted hover:text-app-primary border border-app transition-colors cursor-pointer"
              title="More Features"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sync Progress Live Toast */}
        {syncProgress && (
          <div
            style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
            className="px-4 py-2 text-xs font-mono flex items-center justify-between z-30 shadow-md"
          >
            <div className="flex items-center gap-2 truncate">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="truncate">{syncProgress}</span>
            </div>
          </div>
        )}

        {/* Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 no-scrollbar overscroll-contain">
          {activeTab === 'home' && (
            <HomeScreen
              scrobbles={scrobbles}
              userProfile={userProfile}
              lovedTrackIds={lovedTrackIds}
              onSelectEntity={setSelectedEntity}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onToggleLoved={handleToggleLoved}
              onLaunchStory={() => handleLaunchStory('2026')}
              onLoadDemoData={handleLoadDemoData}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'charts' && (
            <ChartsScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
              onLaunchStory={handleLaunchStory}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              userProfile={userProfile}
              scrobbles={scrobbles}
              lovedTrackIds={lovedTrackIds}
              onSelectEntity={setSelectedEntity}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onLaunchStory={handleLaunchStory}
            />
          )}

          {/* Secondary Views (Accessed from More menu or shortcuts) */}
          {activeTab === 'rediscover' && (
            <RediscoverScreen
              scrobbles={scrobbles}
              lovedTrackIds={lovedTrackIds}
              onToggleLoved={handleToggleLoved}
              onSelectEntity={setSelectedEntity}
            />
          )}

          {activeTab === 'history' && (
            <HistoryAndSearchScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
            />
          )}

          {activeTab === 'loved' && (
            <LovedAndTrustScreen
              scrobbles={scrobbles}
              lovedTrackIds={lovedTrackIds}
              onToggleLoved={handleToggleLoved}
              onSelectEntity={setSelectedEntity}
              onCleanupDuplicates={handleCleanupDuplicates}
              initialTab="loved"
            />
          )}

          {activeTab === 'integrity' && (
            <LovedAndTrustScreen
              scrobbles={scrobbles}
              lovedTrackIds={lovedTrackIds}
              onToggleLoved={handleToggleLoved}
              onSelectEntity={setSelectedEntity}
              onCleanupDuplicates={handleCleanupDuplicates}
              initialTab="trust"
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              userProfile={userProfile}
              syncState={syncState}
              onTriggerSync={handleTriggerSync}
              onConnectUsername={handleConnectUsername}
              onConnectAuthUrl={handleConnectAuthUrl}
              onDisconnectAccount={handleDisconnectAccount}
              onResetDatabase={handleResetDatabase}
              onExportData={handleExportData}
              syncProgress={syncProgress}
              onLoadDemoData={handleLoadDemoData}
            />
          )}
        </main>

        {/* Native Mobile Bottom Navigation Bar */}
        <nav
          style={{
            backgroundColor: tokens.navBg,
            borderColor: tokens.borderCardSub,
          }}
          className="absolute bottom-0 inset-x-0 backdrop-blur-lg border-t px-2 py-1.5 flex items-center justify-around z-30 sm:rounded-b-[36px]"
        >
          {[
            { id: 'home' as const, label: 'Home', icon: Disc3 },
            { id: 'activity' as const, label: 'Activity', icon: Activity },
            { id: 'charts' as const, label: 'Charts', icon: PieChart },
            { id: 'timeline' as const, label: 'Timeline', icon: TrendingUp },
            { id: 'profile' as const, label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-app-primary' : 'text-app-muted hover:text-app-secondary'
                }`}
              >
                <div
                  style={{
                    backgroundColor: isActive ? tokens.accentSubtle : 'transparent',
                    color: isActive ? tokens.accentPrimary : tokens.textMuted,
                  }}
                  className={`p-1 rounded-xl transition-all ${isActive ? 'scale-110' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  style={{ color: isActive ? tokens.accentPrimary : tokens.textMuted }}
                  className={`text-[10px] mt-0.5 tracking-tight ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Secondary Features "More" Drawer Modal */}
        <BottomSheetModal
          isOpen={isMoreMenuOpen}
          onClose={() => setIsMoreMenuOpen(false)}
          title="ScrobbleX Library & Tools"
          subtitle="Your music. Your history. Your patterns."
        >
          <div className="space-y-4">
            {scrobbles.length > 0 && (
              <div
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  handleLaunchStory('2026');
                }}
                style={{
                  borderColor: tokens.accentBorder,
                }}
                className="p-3.5 rounded-2xl bg-app-card border flex items-center justify-between cursor-pointer group hover:bg-app-hover transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-app-primary font-display">
                      My Listening Story
                    </h4>
                    <p className="text-[10px] text-app-muted">
                      10-card cinematic audiovisual recap
                    </p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform" />
              </div>
            )}

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('history');
                }}
                className="p-3 rounded-2xl bg-app-subcard hover:bg-app-hover border border-app text-left transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-accent mb-1.5" />
                <p className="text-xs font-bold text-app-primary">History & Search</p>
                <p className="text-[10px] text-app-muted">
                  {scrobbles.length.toLocaleString()} scrobbles
                </p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('rediscover');
                }}
                className="p-3 rounded-2xl bg-app-subcard hover:bg-app-hover border border-app text-left transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-accent mb-1.5" />
                <p className="text-xs font-bold text-app-primary">Rediscover</p>
                <p className="text-[10px] text-app-muted">Lost favorite gems</p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('loved');
                }}
                className="p-3 rounded-2xl bg-app-subcard hover:bg-app-hover border border-app text-left transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-current mb-1.5" />
                <p className="text-xs font-bold text-app-primary">Loved Tracks</p>
                <p className="text-[10px] text-app-muted">{lovedTrackIds.size} saved favorites</p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('integrity');
                }}
                className="p-3 rounded-2xl bg-app-subcard hover:bg-app-hover border border-app text-left transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
                <p className="text-xs font-bold text-app-primary">Listening Integrity</p>
                <p className="text-[10px] text-app-muted">Trust score & audit</p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('settings');
                }}
                className="p-3 rounded-2xl bg-app-subcard hover:bg-app-hover border border-app text-left transition-colors cursor-pointer col-span-2"
              >
                <Settings className="w-4 h-4 text-app-muted mb-1.5" />
                <p className="text-xs font-bold text-app-primary">Theme & Settings</p>
                <p className="text-[10px] text-app-muted">Last.fm connection, colors & sync</p>
              </button>
            </div>
          </div>
        </BottomSheetModal>

        {/* Global Entity Detail Sheet Modal */}
        <EntityDetailSheet
          selectedEntity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          scrobbles={scrobbles}
          lovedTrackIds={lovedTrackIds}
          onToggleLoved={handleToggleLoved}
          onSelectEntity={setSelectedEntity}
        />

        {/* Fullscreen Cinematic "My Listening Story" Modal */}
        <ListeningStoryModal
          isOpen={isStoryOpen}
          onClose={() => setIsStoryOpen(false)}
          scrobbles={scrobbles}
          initialPeriodPreset={storyPreset}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ScrobbleXApp />
    </ThemeProvider>
  );
}
