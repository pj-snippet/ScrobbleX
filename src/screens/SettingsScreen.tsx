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
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import {
  AccentColor,
  BaseTheme,
  SyncState,
  UserProfile,
} from '../types/music';
import {
  ACCENT_THEMES,
  BASE_THEMES,
  getEffectiveAccent,
} from '../domain/themeConfig';

interface SettingsScreenProps {
  userProfile: UserProfile;
  syncState: SyncState;
  activeAccentColor: AccentColor;
  activeBaseTheme: BaseTheme;
  customHexColor?: string;
  onUpdateAccentColor: (color: AccentColor, customHex?: string) => void;
  onUpdateBaseTheme: (theme: BaseTheme) => void;
  onTriggerSync: () => void;
  onResetDatabase: () => void;
  onExportData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userProfile,
  syncState,
  activeAccentColor,
  activeBaseTheme,
  customHexColor = '#38BDF8',
  onUpdateAccentColor,
  onUpdateBaseTheme,
  onTriggerSync,
  onResetDatabase,
  onExportData,
}) => {
  const [tempHex, setTempHex] = useState(customHexColor);
  const [showCustomPicker, setShowCustomPicker] = useState(activeAccentColor === 'custom');

  const currentAccent = getEffectiveAccent(activeAccentColor, tempHex);
  const currentBase = BASE_THEMES[activeBaseTheme] || BASE_THEMES.slate;

  const handleCustomHexChange = (hex: string) => {
    setTempHex(hex);
    onUpdateAccentColor('custom', hex);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SCREEN HEADER */}
      <div>
        <h3 className="text-base font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
          <Palette className={`w-5 h-5 ${currentAccent.primaryText}`} />
          <span>App Settings & Themes</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Customize UI accent colors, display themes, and data synchronization
        </p>
      </div>

      {/* 1. THEME & COLOR CUSTOMIZATION (FOCUSED HIGHLIGHT) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Theme Accent Color</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select your preferred accent color or pick a custom shade
            </p>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-white shadow-xs"
            style={{ backgroundColor: currentAccent.hex }}
          >
            {currentAccent.label}
          </span>
        </div>

        {/* Color Palette Grid */}
        <div className="grid grid-cols-5 gap-2.5">
          {(
            [
              'blue',
              'emerald',
              'cyan',
              'purple',
              'amber',
              'rose',
              'red',
              'teal',
              'indigo',
            ] as AccentColor[]
          ).map((colorKey) => {
            const themeDef = ACCENT_THEMES[colorKey];
            const isSelected = activeAccentColor === colorKey;
            return (
              <button
                key={colorKey}
                onClick={() => {
                  setShowCustomPicker(false);
                  onUpdateAccentColor(colorKey);
                }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-800/90 border-white/40 ring-2 ring-white/20 scale-105'
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: themeDef.hex }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </div>
                <span className="text-[10px] font-semibold text-slate-300 truncate max-w-full">
                  {themeDef.label.split(' ')[0]}
                </span>
              </button>
            );
          })}

          {/* Custom Color Button */}
          <button
            onClick={() => {
              setShowCustomPicker(true);
              onUpdateAccentColor('custom', tempHex);
            }}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer group ${
              activeAccentColor === 'custom'
                ? 'bg-slate-800/90 border-white/40 ring-2 ring-white/20 scale-105'
                : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div
              className="w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-transform group-hover:scale-110 relative overflow-hidden"
              style={{
                background:
                  activeAccentColor === 'custom'
                    ? tempHex
                    : 'conic-gradient(from 180deg, red, yellow, lime, aqua, blue, magenta, red)',
              }}
            >
              {activeAccentColor === 'custom' && (
                <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-md" />
              )}
            </div>
            <span className="text-[10px] font-semibold text-slate-300">Custom</span>
          </button>
        </div>

        {/* Custom Hex Color Picker Controls */}
        {showCustomPicker && (
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Custom Color Chooser</span>
              <span className="font-mono text-slate-400">{tempHex.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                <input
                  type="color"
                  value={tempHex}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  className="absolute -inset-2 w-14 h-14 cursor-pointer opacity-100"
                />
              </div>

              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                  HEX
                </span>
                <input
                  type="text"
                  value={tempHex}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  placeholder="#38BDF8"
                  className="w-full bg-slate-900 text-xs font-mono text-white pl-12 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:border-white/40"
                />
              </div>

              <button
                onClick={() => handleCustomHexChange('#38BDF8')}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:text-white cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Base Background Theme Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Background Surface Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'slate', name: 'Dark Navy Slate', desc: 'Midnight deep blue' },
                { id: 'oled', name: 'Obsidian OLED', desc: 'True pitch black' },
                { id: 'charcoal', name: 'Midnight Charcoal', desc: 'Dark studio matte' },
                { id: 'frost', name: 'Deep Titanium', desc: 'Cool steel gray' },
              ] as const
            ).map((t) => {
              const isSelected = activeBaseTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onUpdateBaseTheme(t.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-white/30 ring-1 ring-white/20'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-100">{t.name}</p>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Live Theme Preview Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
            Live UI Preview (Selected Accent & Theme)
          </span>

          <div className="flex items-center justify-between">
            <button
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
              style={{ backgroundColor: currentAccent.hex }}
            >
              Primary Action
            </button>

            <span
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border"
              style={{
                color: currentAccent.hex,
                borderColor: `${currentAccent.hex}40`,
                backgroundColor: `${currentAccent.hex}15`,
              }}
            >
              Active Filter #1
            </span>

            <div className="flex items-center gap-1">
              <span
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: currentAccent.hex }}
              />
              <span
                className="w-1.5 h-6 rounded-full"
                style={{ backgroundColor: currentAccent.hex }}
              />
              <span
                className="w-1.5 h-3 rounded-full"
                style={{ backgroundColor: currentAccent.hex }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. LAST.FM SYNC & LOCAL DATABASE */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Last.fm Account & Storage</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Synchronized scrobble cache and offline indexes
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {syncState.status.toUpperCase()}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Account Handle:</span>
            <span className="font-mono text-white font-bold">{userProfile.username}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Local Database Footprint:</span>
            <span className="font-mono text-white">~{syncState.databaseSizeKB} KB</span>
          </div>

          <button
            onClick={onTriggerSync}
            disabled={syncState.status === 'syncing'}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span>
              {syncState.status === 'syncing' ? 'Syncing Scrobbles...' : 'Sync Fresh Scrobbles Now'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. EXPORT & RESET ACTIONS */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
        <h4 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
          Data Management
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onExportData}
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onResetDatabase}
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Rebuild Cache</span>
          </button>
        </div>
      </div>

      {/* FOOTER CREDITS */}
      <div className="text-center space-y-1 text-slate-500 font-mono text-[11px] pt-2">
        <p className="font-bold text-slate-400">ScrobbleX · v1.0.0</p>
        <p className="text-[10px]">Your music. Your history. Your patterns.</p>
      </div>
    </div>
  );
};
