import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import type { AccentColor } from '../../../types/music';
import { ACCENT_THEMES } from '../../../features/themes/themeRegistry';

interface ListeningStoryBannerProps {
  accentColor: AccentColor;
  onLaunchStory: () => void;
}

export const ListeningStoryBanner: React.FC<ListeningStoryBannerProps> = ({
  accentColor,
  onLaunchStory,
}) => {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  return (
    <div
      onClick={onLaunchStory}
      className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-500/30 shadow-xl cursor-pointer group transition-all hover:border-blue-400/60"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>MY LISTENING STORY</span>
          </span>
          <h3 className="text-sm font-bold text-white font-display">
            Experience Your Music Story
          </h3>
          <p className="text-[11px] text-slate-300">
            10-card cinematic journey of your 2026 listening history
          </p>
        </div>
        <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0`}>
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
