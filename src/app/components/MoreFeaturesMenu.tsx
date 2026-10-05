import React from 'react';
import { Heart, History, Play, Settings, ShieldCheck, Sparkles } from 'lucide-react';
import { BottomSheetModal } from '../../components/ui/MobilePrimitives';
import type { AppTab } from '../navigation/appTabs';

interface MoreFeaturesMenuProps {
  isOpen: boolean;
  lovedTrackCount: number;
  onClose: () => void;
  onNavigate: (tab: AppTab) => void;
  onLaunchStory: () => void;
}

export const MoreFeaturesMenu: React.FC<MoreFeaturesMenuProps> = ({
  isOpen,
  lovedTrackCount,
  onClose,
  onNavigate,
  onLaunchStory,
}) => {
  const navigateAndClose = (tab: AppTab) => {
    onClose();
    onNavigate(tab);
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="ScrobbleX Library & Tools"
      subtitle="Your music. Your history. Your patterns."
    >
      <div className="space-y-4">
        <div
          onClick={() => {
            onClose();
            onLaunchStory();
          }}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-blue-900/30 to-slate-900 border border-purple-500/40 flex items-center justify-between cursor-pointer group hover:border-purple-400"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-display">My Listening Story</h4>
              <p className="text-[10px] text-slate-300">10-card cinematic audiovisual recap</p>
            </div>
          </div>
          <Play className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigateAndClose('history')}
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-blue-400 mb-1.5" />
            <p className="text-xs font-bold text-white">History &amp; Search</p>
            <p className="text-[10px] text-slate-400">Search 10k+ scrobbles</p>
          </button>

          <button
            onClick={() => navigateAndClose('rediscover')}
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-400 mb-1.5" />
            <p className="text-xs font-bold text-white">Rediscover</p>
            <p className="text-[10px] text-slate-400">Lost favorite gems</p>
          </button>

          <button
            onClick={() => navigateAndClose('loved')}
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4 text-rose-500 fill-current mb-1.5" />
            <p className="text-xs font-bold text-white">Loved Tracks</p>
            <p className="text-[10px] text-slate-400">{lovedTrackCount} saved favorites</p>
          </button>

          <button
            onClick={() => navigateAndClose('integrity')}
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
            <p className="text-xs font-bold text-white">Listening Integrity</p>
            <p className="text-[10px] text-slate-400">Trust score &amp; audit</p>
          </button>

          <button
            onClick={() => navigateAndClose('settings')}
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400 mb-1.5" />
            <p className="text-xs font-bold text-white">Theme &amp; Settings</p>
            <p className="text-[10px] text-slate-400">Colors, themes &amp; sync</p>
          </button>
        </div>
      </div>
    </BottomSheetModal>
  );
};
