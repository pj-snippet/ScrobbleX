import React, { useState } from 'react';
import { Disc3, X, Radio, Check } from 'lucide-react';
import { AccentColor, SyncStatus, TimeRangeFilter } from '../types/music';
import { useTheme } from '../context/ThemeContext';

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
        className={`${sizeClass} ${roundedClass} bg-app-subcard border border-app flex items-center justify-center shrink-0 text-app-muted overflow-hidden shadow-inner ${className}`}
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
      className={`${sizeClass} ${roundedClass} object-cover shrink-0 border border-white/5 bg-app-card shadow-md ${className}`}
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
  className = '',
}) => {
  const { tokens } = useTheme();

  const options: { id: TimeRangeFilter; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '6m', label: '6M' },
    { id: '12m', label: '1Y' },
    { id: 'all', label: 'ALL' },
  ];

  return (
    <div
      className={`flex items-center gap-1 p-1 bg-app-subcard rounded-xl border border-app max-w-full overflow-x-auto no-scrollbar ${className}`}
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              backgroundColor: isActive ? tokens.accentPrimary : 'transparent',
              color: isActive ? tokens.accentContrast : tokens.textMuted,
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all select-none whitespace-nowrap cursor-pointer hover:text-app-primary ${
              isActive ? 'font-bold shadow-xs' : ''
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
  const { tokens } = useTheme();

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
        style={{
          backgroundColor: tokens.sheetBg,
          borderColor: tokens.borderCard,
        }}
        className="relative w-full max-w-lg border-t rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing" onClick={onClose}>
          <div
            style={{ backgroundColor: tokens.borderStrong }}
            className="w-12 h-1.5 rounded-full hover:opacity-100 opacity-70 transition-opacity"
          />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div
            style={{ borderColor: tokens.borderCardSub }}
            className="flex items-center justify-between px-5 pb-3 border-b"
          >
            <div>
              {title && <h3 className="text-base font-bold text-app-primary font-display">{title}</h3>}
              {subtitle && <p className="text-xs text-app-muted mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-app-muted hover:text-app-primary bg-app-subcard hover:bg-app-hover border border-app transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto overscroll-contain space-y-4 text-app-secondary flex-1">
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
}> = ({ status, lastSyncedText = 'Synced', onClick }) => {
  const { tokens } = useTheme();

  let bgColor = tokens.successSubtle;
  let textColor = tokens.success;
  let borderColor = 'rgba(16, 185, 129, 0.3)';
  let dotColor = tokens.success;
  let label = 'Live Sync';

  if (status === 'syncing') {
    bgColor = tokens.accentSubtle;
    textColor = tokens.accentPrimary;
    borderColor = tokens.accentBorder;
    dotColor = tokens.accentPrimary;
    label = 'Syncing...';
  } else if (status === 'offline') {
    bgColor = tokens.warningSubtle;
    textColor = tokens.warning;
    borderColor = 'rgba(245, 158, 11, 0.3)';
    dotColor = tokens.warning;
    label = 'Offline Mode';
  } else if (status === 'failed') {
    bgColor = tokens.dangerSubtle;
    textColor = tokens.danger;
    borderColor = 'rgba(244, 63, 94, 0.3)';
    dotColor = tokens.danger;
    label = 'Sync Error';
  }

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: borderColor,
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
    >
      <span
        style={{ backgroundColor: dotColor }}
        className={`w-2 h-2 rounded-full ${status === 'syncing' ? 'animate-ping' : ''}`}
      />
      <span>{label}</span>
    </button>
  );
};

// Reusable Semantic Card Container
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-3xl bg-app-card border border-app shadow-xl transition-all ${
        hoverable ? 'hover:bg-app-hover cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
