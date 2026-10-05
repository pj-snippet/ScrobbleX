import React from 'react';
import { ChevronRight, Clock, Radio, Sparkles, TrendingUp } from 'lucide-react';

interface QuickNavigationProps {
  onNavigateTab: (tabId: string) => void;
}

export const QuickNavigation: React.FC<QuickNavigationProps> = ({ onNavigateTab }) => (
  <div className="grid grid-cols-4 gap-1.5">
    <button
      onClick={() => onNavigateTab('charts')}
      className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between text-slate-400 group-hover:text-cyan-400">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <ChevronRight className="w-3 h-3 opacity-60" />
      </div>
      <p className="text-xs font-bold text-slate-200 mt-2 font-display">Charts</p>
      <p className="text-[9px] text-slate-400 truncate">Ratios &amp; Clock</p>
    </button>

    <button
      onClick={() => onNavigateTab('activity')}
      className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400">
        <Radio className="w-4 h-4 text-emerald-400" />
        <ChevronRight className="w-3 h-3 opacity-60" />
      </div>
      <p className="text-xs font-bold text-slate-200 mt-2 font-display">Activity</p>
      <p className="text-[9px] text-slate-400 truncate">Heatmaps</p>
    </button>

    <button
      onClick={() => onNavigateTab('timeline')}
      className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-400">
        <Clock className="w-4 h-4 text-blue-400" />
        <ChevronRight className="w-3 h-3 opacity-60" />
      </div>
      <p className="text-xs font-bold text-slate-200 mt-2 font-display">Timeline</p>
      <p className="text-[9px] text-slate-400 truncate">Trends</p>
    </button>

    <button
      onClick={() => onNavigateTab('rediscover')}
      className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-left transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-400">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <ChevronRight className="w-3 h-3 opacity-60" />
      </div>
      <p className="text-xs font-bold text-slate-200 mt-2 font-display">Rediscover</p>
      <p className="text-[9px] text-slate-400 truncate">Gems</p>
    </button>
  </div>
);
