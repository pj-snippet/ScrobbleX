import { AccentColor, BaseTheme } from '../../types/music';

export interface AccentThemeDef {
  id: AccentColor;
  label: string;
  hex: string;
  previewBg: string;
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  lightText: string;
  subtleBg: string;
  borderClass: string;
  ringClass: string;
  heatHighClass: string;
  gradientFrom: string;
  gradientTo: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentThemeDef> = {
  blue: {
    id: 'blue',
    label: 'Cobalt Blue',
    hex: '#3B82F6',
    previewBg: 'bg-blue-500',
    primaryBg: 'bg-blue-600',
    primaryHoverBg: 'hover:bg-blue-500',
    primaryText: 'text-blue-400',
    lightText: 'text-blue-300',
    subtleBg: 'bg-blue-500/15',
    borderClass: 'border-blue-500/40',
    ringClass: 'ring-blue-500',
    heatHighClass: 'bg-blue-500 border-blue-400',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-indigo-600',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald Green',
    hex: '#10B981',
    previewBg: 'bg-emerald-500',
    primaryBg: 'bg-emerald-600',
    primaryHoverBg: 'hover:bg-emerald-500',
    primaryText: 'text-emerald-400',
    lightText: 'text-emerald-300',
    subtleBg: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/40',
    ringClass: 'ring-emerald-500',
    heatHighClass: 'bg-emerald-500 border-emerald-400',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-600',
  },
  cyan: {
    id: 'cyan',
    label: 'Electric Cyan',
    hex: '#06B6D4',
    previewBg: 'bg-cyan-500',
    primaryBg: 'bg-cyan-600',
    primaryHoverBg: 'hover:bg-cyan-500',
    primaryText: 'text-cyan-400',
    lightText: 'text-cyan-300',
    subtleBg: 'bg-cyan-500/15',
    borderClass: 'border-cyan-500/40',
    ringClass: 'ring-cyan-500',
    heatHighClass: 'bg-cyan-500 border-cyan-400',
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-blue-600',
  },
  purple: {
    id: 'purple',
    label: 'Neon Violet',
    hex: '#A855F7',
    previewBg: 'bg-purple-500',
    primaryBg: 'bg-purple-600',
    primaryHoverBg: 'hover:bg-purple-500',
    primaryText: 'text-purple-400',
    lightText: 'text-purple-300',
    subtleBg: 'bg-purple-500/15',
    borderClass: 'border-purple-500/40',
    ringClass: 'ring-purple-500',
    heatHighClass: 'bg-purple-500 border-purple-400',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-600',
  },
  amber: {
    id: 'amber',
    label: 'Sunset Amber',
    hex: '#F59E0B',
    previewBg: 'bg-amber-500',
    primaryBg: 'bg-amber-600',
    primaryHoverBg: 'hover:bg-amber-500',
    primaryText: 'text-amber-400',
    lightText: 'text-amber-300',
    subtleBg: 'bg-amber-500/15',
    borderClass: 'border-amber-500/40',
    ringClass: 'ring-amber-500',
    heatHighClass: 'bg-amber-500 border-amber-400',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-orange-600',
  },
  rose: {
    id: 'rose',
    label: 'Crimson Rose',
    hex: '#F43F5E',
    previewBg: 'bg-rose-500',
    primaryBg: 'bg-rose-600',
    primaryHoverBg: 'hover:bg-rose-500',
    primaryText: 'text-rose-400',
    lightText: 'text-rose-300',
    subtleBg: 'bg-rose-500/15',
    borderClass: 'border-rose-500/40',
    ringClass: 'ring-rose-500',
    heatHighClass: 'bg-rose-500 border-rose-400',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-pink-600',
  },
  red: {
    id: 'red',
    label: 'Signal Red',
    hex: '#EF4444',
    previewBg: 'bg-red-500',
    primaryBg: 'bg-red-600',
    primaryHoverBg: 'hover:bg-red-500',
    primaryText: 'text-red-400',
    lightText: 'text-red-300',
    subtleBg: 'bg-red-500/15',
    borderClass: 'border-red-500/40',
    ringClass: 'ring-red-500',
    heatHighClass: 'bg-red-500 border-red-400',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-rose-600',
  },
  teal: {
    id: 'teal',
    label: 'Mint Teal',
    hex: '#14B8A6',
    previewBg: 'bg-teal-500',
    primaryBg: 'bg-teal-600',
    primaryHoverBg: 'hover:bg-teal-500',
    primaryText: 'text-teal-400',
    lightText: 'text-teal-300',
    subtleBg: 'bg-teal-500/15',
    borderClass: 'border-teal-500/40',
    ringClass: 'ring-teal-500',
    heatHighClass: 'bg-teal-500 border-teal-400',
    gradientFrom: 'from-teal-600',
    gradientTo: 'to-emerald-600',
  },
  indigo: {
    id: 'indigo',
    label: 'Deep Indigo',
    hex: '#6366F1',
    previewBg: 'bg-indigo-500',
    primaryBg: 'bg-indigo-600',
    primaryHoverBg: 'hover:bg-indigo-500',
    primaryText: 'text-indigo-400',
    lightText: 'text-indigo-300',
    subtleBg: 'bg-indigo-500/15',
    borderClass: 'border-indigo-500/40',
    ringClass: 'ring-indigo-500',
    heatHighClass: 'bg-indigo-500 border-indigo-400',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-blue-600',
  },
  custom: {
    id: 'custom',
    label: 'Custom Color',
    hex: '#38BDF8',
    previewBg: 'bg-sky-400',
    primaryBg: 'bg-sky-500',
    primaryHoverBg: 'hover:bg-sky-400',
    primaryText: 'text-sky-400',
    lightText: 'text-sky-300',
    subtleBg: 'bg-sky-500/15',
    borderClass: 'border-sky-500/40',
    ringClass: 'ring-sky-500',
    heatHighClass: 'bg-sky-500 border-sky-400',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-indigo-500',
  },
};

export interface BaseThemeDef {
  id: BaseTheme;
  label: string;
  description: string;
  bgBody: string;
  bgCard: string;
  bgSubCard: string;
  borderCard: string;
  borderSub: string;
  headerBg: string;
  navBg: string;
}

export const BASE_THEMES: Record<BaseTheme, BaseThemeDef> = {
  slate: {
    id: 'slate',
    label: 'Dark Navy Slate',
    description: 'Deep midnight blue with crisp contrast',
    bgBody: 'bg-[#07090E]',
    bgCard: 'bg-[#0C101B]',
    bgSubCard: 'bg-[#080B12]',
    borderCard: 'border-slate-800/80',
    borderSub: 'border-slate-800/60',
    headerBg: 'bg-[#07090E]/92',
    navBg: 'bg-[#090D16]/95',
  },
  oled: {
    id: 'oled',
    label: 'Obsidian OLED',
    description: 'Pure pitch black for AMOLED battery efficiency',
    bgBody: 'bg-[#000000]',
    bgCard: 'bg-[#09090C]',
    bgSubCard: 'bg-[#040406]',
    borderCard: 'border-neutral-800/90',
    borderSub: 'border-neutral-900',
    headerBg: 'bg-[#000000]/95',
    navBg: 'bg-[#040406]/98',
  },
  charcoal: {
    id: 'charcoal',
    label: 'Midnight Charcoal',
    description: 'Studio dark matte graphite aesthetic',
    bgBody: 'bg-[#111216]',
    bgCard: 'bg-[#181920]',
    bgSubCard: 'bg-[#13141A]',
    borderCard: 'border-zinc-800',
    borderSub: 'border-zinc-800/60',
    headerBg: 'bg-[#111216]/92',
    navBg: 'bg-[#14151B]/95',
  },
  frost: {
    id: 'frost',
    label: 'Deep Titanium',
    description: 'Cool metallic blue-gray tone',
    bgBody: 'bg-[#0B111A]',
    bgCard: 'bg-[#111A27]',
    bgSubCard: 'bg-[#0D1420]',
    borderCard: 'border-sky-950/80',
    borderSub: 'border-sky-950/50',
    headerBg: 'bg-[#0B111A]/92',
    navBg: 'bg-[#0E1522]/95',
  },
};

export function getEffectiveAccent(color: AccentColor, customHex?: string): AccentThemeDef {
  const base = ACCENT_THEMES[color] || ACCENT_THEMES.blue;
  if (color === 'custom' && customHex) {
    return {
      ...base,
      hex: customHex,
      label: `Custom (${customHex.toUpperCase()})`,
    };
  }
  return base;
}
