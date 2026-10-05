import React from 'react';
import { Activity, Disc3, PieChart, TrendingUp, User } from 'lucide-react';
import type { AccentThemeDef, BaseThemeDef } from '../../features/themes/themeRegistry';
import type { PrimaryAppTab } from '../navigation/appTabs';

interface PrimaryNavigationProps {
  activeTab: string;
  accent: AccentThemeDef;
  baseTheme: BaseThemeDef;
  onNavigate: (tab: PrimaryAppTab) => void;
}

const PRIMARY_TABS = [
  { id: 'home', label: 'Home', icon: Disc3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'charts', label: 'Charts', icon: PieChart },
  { id: 'timeline', label: 'Timeline', icon: TrendingUp },
  { id: 'profile', label: 'Profile', icon: User },
] as const satisfies readonly { id: PrimaryAppTab; label: string; icon: typeof Disc3 }[];

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({
  activeTab,
  accent,
  baseTheme,
  onNavigate,
}) => (
  <nav
    className={`absolute bottom-0 inset-x-0 ${baseTheme.navBg} backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around z-30 sm:rounded-b-[40px]`}
  >
    {PRIMARY_TABS.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              isActive
                ? `${accent.subtleBg} ${accent.primaryText} scale-110`
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
);
