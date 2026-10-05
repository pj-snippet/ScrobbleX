import React from 'react';
import type { AccentColor, RankedEntityItem } from '../../../types/music';
import type { HomeRankingTab } from '../hooks/useHomeData';
import { ACCENT_THEMES } from '../../../features/themes/themeRegistry';
import { ArtworkThumb } from '../../../components/ui/MobilePrimitives';
import type { SelectedEntity } from '../../../components/common/EntityDetailSheet';

interface TopRankingsProps {
  items: RankedEntityItem[];
  tab: HomeRankingTab;
  accentColor: AccentColor;
  onTabChange: (tab: HomeRankingTab) => void;
  onSelectEntity: (entity: SelectedEntity) => void;
}

export const TopRankings: React.FC<TopRankingsProps> = ({
  items,
  tab,
  accentColor,
  onTabChange,
  onSelectEntity,
}) => {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          {(['artists', 'tracks', 'albums'] as const).map((nextTab) => (
            <button
              key={nextTab}
              onClick={() => onTabChange(nextTab)}
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                tab === nextTab
                  ? `${theme.subtleBg} ${theme.primaryText}`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top {nextTab}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-slate-500">Top {items.length}</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectEntity({ type: tab.slice(0, -1) as 'artist' | 'track' | 'album', id: item.id })}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 text-center font-mono text-xs font-black text-slate-500 group-hover:text-slate-300">
                {item.rank}
              </span>
              <ArtworkThumb
                src={item.artworkUrl}
                alt={item.name}
                sizeClass="w-11 h-11"
                roundedClass={tab === 'artists' ? 'rounded-full' : 'rounded-xl'}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate group-hover:text-white font-display">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </div>

            <div className="text-right shrink-0 ml-3">
              <p className="text-xs font-mono font-bold text-slate-200">
                {item.plays.toLocaleString()} <span className="text-[10px] text-slate-500">plays</span>
              </p>
              <p className="text-[10px] font-mono text-slate-400">{item.sharePercent}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
