import React, { useState } from 'react';
import { Disc3, X, Radio, Check } from 'lucide-react';
import { AccentColor, SyncStatus, TimeRangeFilter } from '../types/music';
import { ACCENT_THEMES } from '../domain/themeConfig';

interface ArtworkThumbProps {
  src: string;
  alt: string;
  sizeClass?: string;
  roundedClass?: string;
  className?: string;
}

export const ArtworkThumb: React.FC<ArtworkThumbProps> = ({
  src,
  alt,
  sizeClass = 'w-12 h-12',
  roundedClass = 'rounded-xl',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 text-slate-500 overflow-hidden shadow-inner ${className}`}
      >
        <Disc3 className="w-5 h-5 opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${sizeClass} ${roundedClass} object-cover shrink-0 border border-white/5 bg-slate-900 shadow-md ${className}`}
      loading="lazy"
    />
  );
};

interface TimeRangeSelectorProps {
  value: TimeRangeFilter;
  onChange: (filter: TimeRangeFilter) => void;
  accentColor?: AccentColor;
  className?: string;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  accentColor = 'blue',
  className = '',
}) => {
  const options: { id: TimeRangeFilter; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '6m', label: '6M' },
    { id: '12m', label: '1Y' },
    { id: 'all', label: 'ALL' },
  ];

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  return (
    <div
      className={`flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 max-w-full overflow-x-auto no-scrollbar ${className}`}
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all select-none whitespace-nowrap cursor-pointer ${
              isActive
                ? `${theme.primaryBg} text-white shadow-sm font-bold`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div
        className="relative w-full max-w-lg bg-[#0C101B] border-t border-slate-800 rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80 hover:bg-slate-500 transition-colors" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-800/70">
            <div>
              {title && <h3 className="text-base font-bold text-slate-100 font-display">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto overscroll-contain space-y-4 text-slate-200 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export const SyncStatusPill: React.FC<{
  status: SyncStatus;
  lastSyncedText?: string;
  accentColor?: AccentColor;
  onClick?: () => void;
}> = ({ status, lastSyncedText = 'Synced', accentColor = 'blue', onClick }) => {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let dotColor = 'bg-emerald-400';
  let label = 'Live Sync';

  if (status === 'syncing') {
    colorClasses = `${theme.subtleBg} ${theme.primaryText} ${theme.borderClass}`;
    dotColor = theme.previewBg;
    label = 'Syncing...';
  } else if (status === 'offline') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    dotColor = 'bg-amber-400';
    label = 'Offline Mode';
  } else if (status === 'failed') {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    dotColor = 'bg-rose-400';
    label = 'Sync Error';
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${colorClasses} hover:opacity-85 transition-opacity cursor-pointer`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status === 'syncing' ? 'animate-pulse' : ''}`} />
      <span className="font-mono">{label}</span>
      {lastSyncedText && status === 'synced' && (
        <span className="text-slate-500 text-[10px]">· {lastSyncedText}</span>
      )}
    </button>
  );
};
