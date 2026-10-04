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
  Wifi,
  Battery,
  ShieldCheck,
  PieChart,
  Layers,
  Menu,
  X,
  Play,
} from 'lucide-react';
import {
  AccentColor,
  BaseTheme,
  Scrobble,
  SyncState,
  UserProfile,
} from './types/music';
import {
  DEFAULT_USER_PROFILE,
  INITIAL_SYNC_STATE,
  TRACKS_CATALOG,
  buildInitialNormalizedScrobbles,
} from './data/localDatabase';
import {
  ACCENT_THEMES,
  BASE_THEMES,
  getEffectiveAccent,
} from './domain/themeConfig';
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

export default function App() {
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
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [scrobbles, setScrobbles] = useState<Scrobble[]>(() =>
    buildInitialNormalizedScrobbles(true)
  );
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_SYNC_STATE);

  const [lovedTrackIds, setLovedTrackIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    TRACKS_CATALOG.forEach((t) => {
      if (t.loved) ids.add(t.id);
    });
    return ids;
  });

  // Navigation tab: Recommended 5 Primary + Secondary views
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

  // Secondary "More Features" modal sheet
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // My Listening Story Modal state
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [storyPreset, setStoryPreset] = useState<'2026' | '2025' | '12m' | '6m' | 'all'>('2026');

  // Entity Detail Sheet modal state
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);

  // Sync simulation
  const handleTriggerSync = () => {
    setSyncState((prev) => ({ ...prev, status: 'syncing' }));
    setTimeout(() => {
      setSyncState((prev) => ({
        ...prev,
        status: 'synced',
        lastSyncedAt: Math.floor(Date.now() / 1000),
      }));
    }, 1200);
  };

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

  // Reset database cache
  const handleResetDatabase = () => {
    setScrobbles(buildInitialNormalizedScrobbles(true));
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

  const currentAccent = getEffectiveAccent(activeAccentColor, customHexColor);
  const currentBase = BASE_THEMES[activeBaseTheme] || BASE_THEMES.slate;

  // Real device clock
  const [timeString, setTimeString] = useState('9:41');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen ${currentBase.bgBody} text-slate-100 flex justify-center items-center font-sans antialiased selection:bg-blue-500/30 selection:text-white transition-colors duration-300`}
    >
      {/* Native Mobile Phone Viewport Shell */}
      <div
        className={`w-full max-w-md h-screen sm:h-[94vh] sm:max-h-[920px] ${currentBase.bgBody} sm:rounded-[40px] sm:border sm:border-slate-800/90 shadow-2xl flex flex-col overflow-hidden relative sm:ring-1 sm:ring-white/10`}
      >
        {/* Android Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs font-mono font-bold text-slate-400 select-none z-20 shrink-0">
          <span>{timeString}</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Mobile Header Bar with ScrobbleX Branding */}
        <header
          className={`px-5 py-2.5 flex items-center justify-between ${currentBase.headerBg} backdrop-blur-md border-b border-slate-800/80 z-20 shrink-0`}
        >
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
              style={{ backgroundColor: currentAccent.hex }}
            >
              <Disc3 className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white font-display">
                ScrobbleX
              </h1>
              <span className="text-[9px] font-mono text-slate-400 block -mt-1 tracking-tight">
                Your music. Your history. Your patterns.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLaunchStory('2026')}
              className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold hover:bg-purple-500/25 transition-colors cursor-pointer"
              title="Launch My Listening Story"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Story</span>
            </button>

            <SyncStatusPill
              status={syncState.status}
              accentColor={activeAccentColor}
              onClick={handleTriggerSync}
            />

            <button
              onClick={() => setIsMoreMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80 transition-colors cursor-pointer"
              title="More Features"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 no-scrollbar overscroll-contain">
          {activeTab === 'home' && (
            <HomeScreen
              scrobbles={scrobbles}
              userProfile={userProfile}
              lovedTrackIds={lovedTrackIds}
              onSelectEntity={setSelectedEntity}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              accentColor={activeAccentColor}
              onToggleLoved={handleToggleLoved}
              onLaunchStory={() => handleLaunchStory('2026')}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
              accentColor={activeAccentColor}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'charts' && (
            <ChartsScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
              onLaunchStory={handleLaunchStory}
              accentColor={activeAccentColor}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
              accentColor={activeAccentColor}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              userProfile={userProfile}
              scrobbles={scrobbles}
              lovedTrackIds={lovedTrackIds}
              onSelectEntity={setSelectedEntity}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              accentColor={activeAccentColor}
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
              accentColor={activeAccentColor}
            />
          )}

          {activeTab === 'history' && (
            <HistoryAndSearchScreen
              scrobbles={scrobbles}
              onSelectEntity={setSelectedEntity}
              accentColor={activeAccentColor}
            />
          )}

          {activeTab === 'loved' && (
            <LovedAndTrustScreen
              scrobbles={scrobbles}
              lovedTrackIds={lovedTrackIds}
              onToggleLoved={handleToggleLoved}
              onSelectEntity={setSelectedEntity}
              onCleanupDuplicates={handleCleanupDuplicates}
              accentColor={activeAccentColor}
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
              accentColor={activeAccentColor}
              initialTab="trust"
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              userProfile={userProfile}
              syncState={syncState}
              activeAccentColor={activeAccentColor}
              activeBaseTheme={activeBaseTheme}
              customHexColor={customHexColor}
              onUpdateAccentColor={handleUpdateAccentColor}
              onUpdateBaseTheme={handleUpdateBaseTheme}
              onTriggerSync={handleTriggerSync}
              onResetDatabase={handleResetDatabase}
              onExportData={handleExportData}
            />
          )}
        </main>

        {/* Native Mobile Bottom Navigation Bar (Recommended 5 Primary Tabs) */}
        <nav
          className={`absolute bottom-0 inset-x-0 ${currentBase.navBg} backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around z-30 sm:rounded-b-[40px]`}
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
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? `${currentAccent.subtleBg} ${currentAccent.primaryText} scale-110`
                      : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                    isActive ? 'font-bold text-white' : 'text-slate-400'
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
            {/* Story Banner */}
            <div
              onClick={() => {
                setIsMoreMenuOpen(false);
                handleLaunchStory('2026');
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-blue-900/30 to-slate-900 border border-purple-500/40 flex items-center justify-between cursor-pointer group hover:border-purple-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">
                    My Listening Story
                  </h4>
                  <p className="text-[10px] text-slate-300">
                    10-card cinematic audiovisual recap
                  </p>
                </div>
              </div>
              <Play className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('history');
                }}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-blue-400 mb-1.5" />
                <p className="text-xs font-bold text-white">History & Search</p>
                <p className="text-[10px] text-slate-400">Search 10k+ scrobbles</p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('rediscover');
                }}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-400 mb-1.5" />
                <p className="text-xs font-bold text-white">Rediscover</p>
                <p className="text-[10px] text-slate-400">Lost favorite gems</p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('loved');
                }}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-current mb-1.5" />
                <p className="text-xs font-bold text-white">Loved Tracks</p>
                <p className="text-[10px] text-slate-400">{lovedTrackIds.size} saved favorites</p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('integrity');
                }}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
                <p className="text-xs font-bold text-white">Listening Integrity</p>
                <p className="text-[10px] text-slate-400">Trust score & audit</p>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setActiveTab('settings');
                }}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400 mb-1.5" />
                <p className="text-xs font-bold text-white">Theme & Settings</p>
                <p className="text-[10px] text-slate-400">Colors, themes & sync</p>
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
