import React from 'react';
import { Disc3, Menu, Sparkles } from 'lucide-react';
import type { AccentColor, SyncStatus } from '../../types/music';
import type { AccentThemeDef, BaseThemeDef } from '../../features/themes/themeRegistry';
import { SyncStatusPill } from '../../components/ui/MobilePrimitives';

interface AppHeaderProps {
  accent: AccentThemeDef;
  baseTheme: BaseThemeDef;
  accentColor: AccentColor;
  syncStatus: SyncStatus;
  onGoHome: () => void;
  onLaunchStory: () => void;
  onSync: () => void;
  onOpenMenu: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  accent,
  baseTheme,
  accentColor,
  syncStatus,
  onGoHome,
  onLaunchStory,
  onSync,
  onOpenMenu,
}) => (
  <header
    className={`px-5 py-2.5 flex items-center justify-between ${baseTheme.headerBg} backdrop-blur-md border-b border-slate-800/80 z-20 shrink-0`}
  >
    <div onClick={onGoHome} className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
        style={{ backgroundColor: accent.hex }}
      >
        <Disc3 className="w-4 h-4 text-white stroke-[2.5]" />
      </div>
      <div>
        <h1 className="text-base font-black tracking-tight text-white font-display">ScrobbleX</h1>
        <span className="text-[9px] font-mono text-slate-400 block -mt-1 tracking-tight">
          Your music. Your history. Your patterns.
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={onLaunchStory}
        className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold hover:bg-purple-500/25 transition-colors cursor-pointer"
        title="Launch My Listening Story"
      >
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Story</span>
      </button>
      <SyncStatusPill
        status={syncStatus}
        accentColor={accentColor}
        lastSyncedText=""
        onClick={onSync}
        title="Sync Now: synchronize recent Last.fm scrobbles"
      />
      <button
        onClick={onOpenMenu}
        className="p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80 transition-colors cursor-pointer"
        title="More Features"
      >
        <Menu className="w-4 h-4" />
      </button>
    </div>
  </header>
);
