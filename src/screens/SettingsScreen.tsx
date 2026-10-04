import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  RefreshCw,
  Database,
  ExternalLink,
  ShieldCheck,
  Download,
  RotateCcw,
  Sliders,
  Radio,
  UserCheck,
  LogOut,
  AlertCircle,
  Link2,
} from 'lucide-react';
import {
  AccentColor,
  BaseTheme,
  SyncState,
  UserProfile,
} from '../types/music';
import {
  ACCENT_PRESETS,
  BASE_THEME_PRESETS,
} from '../domain/themeConfig';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { useTheme } from '../context/ThemeContext';

interface SettingsScreenProps {
  userProfile: UserProfile | null;
  syncState: SyncState;
  activeAccentColor?: AccentColor;
  activeBaseTheme?: BaseTheme;
  customHexColor?: string;
  onUpdateAccentColor?: (color: AccentColor, customHex?: string) => void;
  onUpdateBaseTheme?: (theme: BaseTheme) => void;
  onTriggerSync: (fullResync?: boolean) => void;
  onConnectUsername: (username: string) => Promise<void>;
  onConnectAuthUrl: () => Promise<void>;
  onDisconnectAccount: () => void;
  onResetDatabase: () => void;
  onExportData: () => void;
  syncProgress?: string | null;
  onLoadDemoData?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userProfile,
  syncState,
  onTriggerSync,
  onConnectUsername,
  onConnectAuthUrl,
  onDisconnectAccount,
  onResetDatabase,
  onExportData,
  syncProgress,
  onLoadDemoData,
}) => {
  const {
    baseTheme,
    accentColor,
    customHex,
    tokens,
    setBaseTheme,
    setAccentColor,
    setCustomHex,
  } = useTheme();

  const [tempHex, setTempHex] = useState(customHex);
  const [showCustomPicker, setShowCustomPicker] = useState(accentColor === 'custom');
  const [inputUsername, setInputUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{
    configured: boolean;
    hasCustomKey: boolean;
    hasCustomSecret: boolean;
  } | null>(null);

  React.useEffect(() => {
    fetch('/api/lastfm/status')
      .then((res) => res.json())
      .then((data) => setApiStatus(data))
      .catch(() => {});
  }, []);

  const handleCustomHexChange = (hex: string) => {
    setTempHex(hex);
    setCustomHex(hex);
    setAccentColor('custom', hex);
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await onConnectUsername(inputUsername.trim());
      setInputUsername('');
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to connect Last.fm username.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWebAuth = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await onConnectAuthUrl();
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to initialize Last.fm web authentication.');
      setIsConnecting(false);
    }
  };

  const isConnected = Boolean(userProfile && userProfile.username);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. LAST.FM ACCOUNT & CONNECTION */}
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-app pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider">
              Last.fm Account Connection
            </h3>
          </div>
          {isConnected && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="w-3 h-3" />
              <span>Connected</span>
            </span>
          )}
        </div>

        {/* Connected Profile State */}
        {isConnected && userProfile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-app-subcard border border-app">
              <div className="flex items-center gap-3 min-w-0">
                <ArtworkThumb
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  sizeClass="w-12 h-12"
                  roundedClass="rounded-full"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-app-primary truncate font-display">
                    {userProfile.displayName}
                  </p>
                  <p className="text-xs font-mono text-app-muted truncate">@{userProfile.username}</p>
                  <p className="text-[10px] text-app-muted mt-0.5">
                    {userProfile.totalScrobbles.toLocaleString()} all-time scrobbles
                  </p>
                </div>
              </div>

              <button
                onClick={onDisconnectAccount}
                className="p-2.5 rounded-xl bg-app-card hover:bg-app-hover border border-app text-app-muted hover:text-rose-400 transition-colors cursor-pointer"
                title="Disconnect Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Sync Status & Action Bar */}
            <div className="p-3.5 rounded-2xl bg-app-subcard border border-app space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-app-muted">Local Storage Cache:</span>
                <span className="font-mono font-bold text-app-primary">
                  {syncState.importedScrobblesCount.toLocaleString()} scrobbles ({syncState.databaseSizeKB} KB)
                </span>
              </div>

              {syncProgress && (
                <div className="p-2.5 rounded-xl bg-accent-subtle border border-accent-subtle text-xs font-mono text-accent flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="truncate">{syncProgress}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTriggerSync(false)}
                  disabled={syncState.status === 'syncing'}
                  style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sync Latest</span>
                </button>

                <button
                  onClick={() => onTriggerSync(true)}
                  disabled={syncState.status === 'syncing'}
                  className="py-2.5 px-3 rounded-xl bg-app-card hover:bg-app-hover border border-app text-xs font-semibold text-app-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-app-muted" />
                  <span>Full Resync</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disconnected State - Two Connection Methods */}
        {!isConnected && (
          <div className="space-y-4">
            <p className="text-xs text-app-muted leading-relaxed">
              Connect your Last.fm account to compute historical analytics, radar fingerprints,
              and circadian listening heatmaps from your scrobble telemetry.
            </p>

            {connectionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{connectionError}</span>
              </div>
            )}

            {/* Method A: Official Last.fm Authorization Link */}
            <div className="p-4 rounded-2xl bg-app-subcard border border-app space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-app-primary uppercase font-mono tracking-wider">
                  Option 1: Official Web Auth
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-app-muted">
                Authenticate with Last.fm to securely access private profile data and loved tracks.
              </p>
              <button
                onClick={handleWebAuth}
                disabled={isConnecting}
                style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting to Last.fm...' : 'Authorize via Last.fm'}</span>
              </button>
            </div>

            {/* Method B: Direct Public Username Connect */}
            <div className="p-4 rounded-2xl bg-app-subcard border border-app space-y-3">
              <h4 className="text-xs font-bold text-app-primary uppercase font-mono tracking-wider">
                Option 2: Public Username Import
              </h4>
              <p className="text-[11px] text-app-muted">
                Enter any public Last.fm username to immediately import public scrobbles without login credentials.
              </p>
              <form onSubmit={handleManualConnect} className="flex gap-2">
                <input
                  type="text"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  placeholder="Enter Last.fm username..."
                  className="flex-1 px-3 py-2 rounded-xl bg-app-card border border-app text-xs font-mono text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={isConnecting || !inputUsername.trim()}
                  className="px-4 py-2 rounded-xl bg-app-card hover:bg-app-hover border border-app text-xs font-bold text-app-primary transition-colors cursor-pointer disabled:opacity-50"
                >
                  Connect
                </button>
              </form>
            </div>

            {/* Demo Data Option */}
            {onLoadDemoData && (
              <div className="pt-1">
                <button
                  onClick={onLoadDemoData}
                  className="w-full py-2.5 px-3 rounded-xl bg-app-subcard hover:bg-app-hover border border-app text-xs font-semibold text-app-secondary flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Preview Entire App with Synthetic Demo Data</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. THEME & APPEARANCE SYSTEM */}
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-app pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-app-primary font-display uppercase tracking-wider">
              Theme & Design Tokens
            </h3>
          </div>
          <span
            style={{ backgroundColor: tokens.accentSubtle, color: tokens.accentPrimary }}
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase"
          >
            {accentColor}
          </span>
        </div>

        {/* Accent Color Palette Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-app-secondary uppercase tracking-wider font-mono">
            UI Accent Color
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {Object.entries(ACCENT_PRESETS)
              .filter(([key]) => key !== 'custom')
              .map(([key, opt]) => {
                const isSelected = accentColor === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setShowCustomPicker(false);
                      setAccentColor(key as AccentColor);
                    }}
                    style={{
                      borderColor: isSelected ? opt.hex : tokens.borderCardSub,
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-app-hover shadow-md ring-2 ring-accent'
                        : 'bg-app-subcard hover:bg-app-hover'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: opt.hex }}
                    >
                      {isSelected && (
                        <Check style={{ color: tokens.accentContrast }} className="w-4 h-4 stroke-[3] drop-shadow-md" />
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-app-secondary truncate w-full text-center">
                      {opt.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}

            {/* Custom Hex Button */}
            <button
              onClick={() => {
                setShowCustomPicker(true);
                setAccentColor('custom', tempHex);
              }}
              style={{
                borderColor: accentColor === 'custom' ? tempHex : tokens.borderCardSub,
              }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer group ${
                accentColor === 'custom'
                  ? 'bg-app-hover shadow-md ring-2 ring-accent'
                  : 'bg-app-subcard hover:bg-app-hover'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-transform group-hover:scale-110 relative overflow-hidden"
                style={{
                  background:
                    accentColor === 'custom'
                      ? tempHex
                      : 'conic-gradient(from 180deg, red, yellow, lime, aqua, blue, magenta, red)',
                }}
              >
                {accentColor === 'custom' && (
                  <Check style={{ color: tokens.accentContrast }} className="w-4 h-4 stroke-[3] drop-shadow-md" />
                )}
              </div>
              <span className="text-[10px] font-semibold text-app-secondary">Custom</span>
            </button>
          </div>
        </div>

        {/* Custom Hex Color Picker Controls */}
        {showCustomPicker && (
          <div className="p-3.5 rounded-2xl bg-app-subcard border border-app space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-app-secondary">Custom Color Chooser</span>
              <span className="font-mono text-app-primary">{tempHex.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-app shadow-inner">
                <input
                  type="color"
                  value={tempHex}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  className="absolute -inset-2 w-14 h-14 cursor-pointer opacity-100"
                />
              </div>

              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted font-mono text-xs">
                  HEX
                </span>
                <input
                  type="text"
                  value={tempHex}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  placeholder="#38BDF8"
                  className="w-full bg-app-card text-xs font-mono text-app-primary pl-12 pr-3 py-2.5 rounded-xl border border-app focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <button
                onClick={() => handleCustomHexChange('#38BDF8')}
                className="px-3 py-2 rounded-xl bg-app-card text-app-secondary text-xs font-medium hover:text-app-primary border border-app cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Base Background Surface Theme Selector */}
        <div className="space-y-2 pt-2 border-t border-app">
          <label className="text-xs font-bold text-app-secondary uppercase tracking-wider font-mono">
            Background Surface Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(BASE_THEME_PRESETS).map((t) => {
              const isSelected = baseTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setBaseTheme(t.id)}
                  style={{
                    borderColor: isSelected ? tokens.accentPrimary : tokens.borderCardSub,
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-app-hover shadow-md ring-1 ring-accent'
                      : 'bg-app-subcard hover:bg-app-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-app-primary">{t.label}</p>
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <p className="text-[10px] text-app-muted mt-0.5">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. EXPORT & RESET ACTIONS */}
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-3 shadow-xl">
        <h4 className="text-xs font-mono uppercase font-bold text-app-muted tracking-wider">
          Data Management
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onExportData}
            className="py-2.5 px-3 rounded-xl bg-app-subcard hover:bg-app-hover border border-app text-xs font-semibold text-app-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onResetDatabase}
            className="py-2.5 px-3 rounded-xl bg-app-subcard hover:bg-app-hover border border-app text-xs font-semibold text-app-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Clear Local Data</span>
          </button>
        </div>
      </div>

      {/* FOOTER CREDITS */}
      <div className="text-center space-y-1 text-app-muted font-mono text-[11px] pt-2">
        <p className="font-bold text-app-secondary">ScrobbleX · Mobile Listening Intelligence</p>
        <p className="text-[10px]">Your music. Your history. Your patterns.</p>
      </div>
    </div>
  );
};
