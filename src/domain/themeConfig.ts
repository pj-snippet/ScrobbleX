import { AccentColor, BaseTheme } from '../types/music';

export interface ThemeTokens {
  isDark: boolean;

  // Base Surface & Layout
  bgApp: string;
  bgCard: string;
  bgCardSub: string;
  bgCardHover: string;
  headerBg: string;
  navBg: string;
  sheetBg: string;

  // Borders & Dividers
  borderCard: string;
  borderCardSub: string;
  borderStrong: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accent & Interactive
  accentPrimary: string;
  accentHover: string;
  accentSubtle: string;
  accentGlow: string;
  accentBorder: string;
  accentText: string;
  accentContrast: string;

  // Chart Visualizations
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartGrid: string;
  chartSurface: string;
  chartText: string;

  // Heatmaps
  heatmapEmpty: string;
  heatmapEmptyBorder: string;
  heatmap1: string;
  heatmap2: string;
  heatmap3: string;
  heatmap4: string;

  // Semantic Fixed Status Colors
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
}

export interface AccentOptionDef {
  id: AccentColor;
  label: string;
  hex: string;
  description: string;
}

export interface BaseThemeOptionDef {
  id: BaseTheme;
  label: string;
  description: string;
  previewHex: string;
}

export const ACCENT_PRESETS: Record<AccentColor, AccentOptionDef> = {
  cyan: {
    id: 'cyan',
    label: 'Electric Cyan',
    hex: '#06B6D4',
    description: 'High-visibility modern telemetry cyan',
  },
  blue: {
    id: 'blue',
    label: 'Cobalt Blue',
    hex: '#3B82F6',
    description: 'Classic rich digital blue',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald Green',
    hex: '#10B981',
    description: 'Vibrant organic listening green',
  },
  purple: {
    id: 'purple',
    label: 'Neon Violet',
    hex: '#A855F7',
    description: 'Atmospheric twilight purple',
  },
  amber: {
    id: 'amber',
    label: 'Sunset Amber',
    hex: '#F59E0B',
    description: 'Warm analog glow',
  },
  rose: {
    id: 'rose',
    label: 'Crimson Rose',
    hex: '#F43F5E',
    description: 'Deep vivid passion rose',
  },
  red: {
    id: 'red',
    label: 'Signal Red',
    hex: '#EF4444',
    description: 'Bold urgent telemetry red',
  },
  teal: {
    id: 'teal',
    label: 'Mint Teal',
    hex: '#14B8A6',
    description: 'Cool crisp mint turquoise',
  },
  indigo: {
    id: 'indigo',
    label: 'Deep Indigo',
    hex: '#6366F1',
    description: 'Deep electric space indigo',
  },
  custom: {
    id: 'custom',
    label: 'Custom Hex',
    hex: '#38BDF8',
    description: 'Personal custom color choice',
  },
};

export const BASE_THEME_PRESETS: Record<BaseTheme, BaseThemeOptionDef> = {
  slate: {
    id: 'slate',
    label: 'Dark Navy Slate',
    description: 'Deep midnight blue with crisp contrast',
    previewHex: '#07090E',
  },
  oled: {
    id: 'oled',
    label: 'Obsidian OLED',
    description: 'Pure pitch black for AMOLED efficiency',
    previewHex: '#000000',
  },
  charcoal: {
    id: 'charcoal',
    label: 'Midnight Charcoal',
    description: 'Studio dark matte graphite aesthetic',
    previewHex: '#111216',
  },
  frost: {
    id: 'frost',
    label: 'Deep Titanium',
    description: 'Cool metallic blue-gray tone',
    previewHex: '#0B111A',
  },
  light: {
    id: 'light',
    label: 'Pure Day',
    description: 'Crisp light mode with high-contrast typography and subtle borders',
    previewHex: '#F8FAFC',
  },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { r: 6, g: 182, b: 212 }; // Default cyan fallback
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Adjust lightness of hex for hover / contrast states
export function adjustHexLightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)));
  const factor = 1 + percent / 100;
  const newR = clamp(r * factor);
  const newG = clamp(g * factor);
  const newB = clamp(b * factor);
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

// Calculate optimal readable text contrast color (WCAG compliant)
export function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0A0D14' : '#FFFFFF';
}

export function getResolvedAccentHex(color: AccentColor, customHex?: string): string {
  if (color === 'custom') {
    if (customHex && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(customHex)) {
      return customHex;
    }
    return ACCENT_PRESETS.custom.hex;
  }
  return ACCENT_PRESETS[color]?.hex || ACCENT_PRESETS.cyan.hex;
}

export function generateThemeTokens(
  baseTheme: BaseTheme,
  accentColor: AccentColor,
  customHex?: string
): ThemeTokens {
  const accentHex = getResolvedAccentHex(accentColor, customHex);
  const accentHover = adjustHexLightness(accentHex, 15);
  const accentSubtle = hexToRgba(accentHex, 0.16);
  const accentGlow = hexToRgba(accentHex, 0.35);
  const accentBorder = hexToRgba(accentHex, 0.45);
  const accentContrast = getContrastColor(accentHex);
  const isDark = baseTheme !== 'light';

  let bgApp = '#07090E';
  let bgCard = '#0C101B';
  let bgCardSub = '#080B12';
  let bgCardHover = '#121828';
  let headerBg = 'rgba(7, 9, 14, 0.94)';
  let navBg = 'rgba(9, 13, 22, 0.95)';
  let sheetBg = '#0C101B';
  let borderCard = 'rgba(148, 163, 184, 0.14)';
  let borderCardSub = 'rgba(148, 163, 184, 0.09)';
  let borderStrong = 'rgba(148, 163, 184, 0.28)';
  let textPrimary = '#F8FAFC';
  let textSecondary = '#CBD5E1';
  let textMuted = '#94A3B8';
  let chartGrid = 'rgba(148, 163, 184, 0.12)';
  let chartSurface = '#080B12';
  let heatmapEmpty = '#0B0F19';
  let heatmapEmptyBorder = 'rgba(148, 163, 184, 0.1)';

  if (baseTheme === 'light') {
    bgApp = '#F8FAFC';
    bgCard = '#FFFFFF';
    bgCardSub = '#F1F5F9';
    bgCardHover = '#E2E8F0';
    headerBg = 'rgba(248, 250, 252, 0.96)';
    navBg = 'rgba(255, 255, 255, 0.97)';
    sheetBg = '#FFFFFF';
    borderCard = 'rgba(15, 23, 42, 0.08)';
    borderCardSub = 'rgba(15, 23, 42, 0.05)';
    borderStrong = 'rgba(15, 23, 42, 0.18)';
    textPrimary = '#0F172A';
    textSecondary = '#334155';
    textMuted = '#64748B';
    chartGrid = 'rgba(15, 23, 42, 0.08)';
    chartSurface = '#F1F5F9';
    heatmapEmpty = '#E2E8F0';
    heatmapEmptyBorder = 'rgba(15, 23, 42, 0.06)';
  } else if (baseTheme === 'oled') {
    bgApp = '#000000';
    bgCard = '#09090C';
    bgCardSub = '#040406';
    bgCardHover = '#101014';
    headerBg = 'rgba(0, 0, 0, 0.96)';
    navBg = 'rgba(4, 4, 6, 0.97)';
    sheetBg = '#08080B';
    borderCard = 'rgba(255, 255, 255, 0.12)';
    borderCardSub = 'rgba(255, 255, 255, 0.07)';
    borderStrong = 'rgba(255, 255, 255, 0.22)';
    textPrimary = '#FFFFFF';
    textSecondary = '#D4D4D8';
    textMuted = '#A1A1AA';
    chartGrid = 'rgba(255, 255, 255, 0.1)';
    chartSurface = '#040406';
    heatmapEmpty = '#050508';
    heatmapEmptyBorder = 'rgba(255, 255, 255, 0.08)';
  } else if (baseTheme === 'charcoal') {
    bgApp = '#111216';
    bgCard = '#181920';
    bgCardSub = '#13141A';
    bgCardHover = '#20212A';
    headerBg = 'rgba(17, 18, 22, 0.94)';
    navBg = 'rgba(20, 21, 27, 0.96)';
    sheetBg = '#181920';
    borderCard = 'rgba(255, 255, 255, 0.11)';
    borderCardSub = 'rgba(255, 255, 255, 0.06)';
    borderStrong = 'rgba(255, 255, 255, 0.2)';
    textPrimary = '#FAFAFA';
    textSecondary = '#D4D4D8';
    textMuted = '#9CA3AF';
    chartGrid = 'rgba(255, 255, 255, 0.1)';
    chartSurface = '#13141A';
    heatmapEmpty = '#14151B';
    heatmapEmptyBorder = 'rgba(255, 255, 255, 0.08)';
  } else if (baseTheme === 'frost') {
    bgApp = '#0B111A';
    bgCard = '#111A27';
    bgCardSub = '#0D1420';
    bgCardHover = '#182436';
    headerBg = 'rgba(11, 17, 26, 0.94)';
    navBg = 'rgba(14, 21, 34, 0.96)';
    sheetBg = '#111A27';
    borderCard = 'rgba(56, 189, 248, 0.18)';
    borderCardSub = 'rgba(56, 189, 248, 0.1)';
    borderStrong = 'rgba(56, 189, 248, 0.3)';
    textPrimary = '#F0F9FF';
    textSecondary = '#BAE6FD';
    textMuted = '#7DD3FC';
    chartGrid = 'rgba(56, 189, 248, 0.14)';
    chartSurface = '#0D1420';
    heatmapEmpty = '#0D1420';
    heatmapEmptyBorder = 'rgba(56, 189, 248, 0.12)';
  }

  // Harmonic chart secondary & tertiary derived from accent hue
  const chartSecondary =
    accentColor === 'purple' || accentColor === 'indigo'
      ? '#38BDF8'
      : accentColor === 'emerald' || accentColor === 'teal'
      ? '#A855F7'
      : accentColor === 'amber' || accentColor === 'rose'
      ? '#06B6D4'
      : '#C084FC';

  const chartTertiary =
    accentColor === 'amber'
      ? '#F43F5E'
      : accentColor === 'emerald'
      ? '#F59E0B'
      : '#10B981';

  return {
    isDark,
    bgApp,
    bgCard,
    bgCardSub,
    bgCardHover,
    headerBg,
    navBg,
    sheetBg,
    borderCard,
    borderCardSub,
    borderStrong,
    textPrimary,
    textSecondary,
    textMuted,
    accentPrimary: accentHex,
    accentHover,
    accentSubtle,
    accentGlow,
    accentBorder,
    accentText: accentHex,
    accentContrast,
    chartPrimary: accentHex,
    chartSecondary,
    chartTertiary,
    chartGrid,
    chartSurface,
    chartText: textMuted,
    heatmapEmpty,
    heatmapEmptyBorder,
    heatmap1: hexToRgba(accentHex, 0.25),
    heatmap2: hexToRgba(accentHex, 0.5),
    heatmap3: hexToRgba(accentHex, 0.78),
    heatmap4: accentHex,
    // Semantic Fixed Colors (must remain consistent)
    success: '#10B981',
    successSubtle: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B',
    warningSubtle: 'rgba(245, 158, 11, 0.15)',
    danger: '#F43F5E',
    dangerSubtle: 'rgba(244, 63, 94, 0.15)',
    info: '#06B6D4',
    infoSubtle: 'rgba(6, 182, 212, 0.15)',
  };
}

// Convert theme tokens into CSS Variables map for DOM injection
export function themeTokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    'color-scheme': tokens.isDark ? 'dark' : 'light',
    '--is-dark': tokens.isDark ? '1' : '0',
    '--bg-app': tokens.bgApp,
    '--bg-card': tokens.bgCard,
    '--bg-card-sub': tokens.bgCardSub,
    '--bg-card-hover': tokens.bgCardHover,
    '--header-bg': tokens.headerBg,
    '--nav-bg': tokens.navBg,
    '--sheet-bg': tokens.sheetBg,
    '--border-card': tokens.borderCard,
    '--border-card-sub': tokens.borderCardSub,
    '--border-strong': tokens.borderStrong,
    '--text-primary': tokens.textPrimary,
    '--text-secondary': tokens.textSecondary,
    '--text-muted': tokens.textMuted,
    '--accent-primary': tokens.accentPrimary,
    '--accent-hover': tokens.accentHover,
    '--accent-subtle': tokens.accentSubtle,
    '--accent-glow': tokens.accentGlow,
    '--accent-border': tokens.accentBorder,
    '--accent-text': tokens.accentText,
    '--accent-contrast': tokens.accentContrast,
    '--chart-primary': tokens.chartPrimary,
    '--chart-secondary': tokens.chartSecondary,
    '--chart-tertiary': tokens.chartTertiary,
    '--chart-grid': tokens.chartGrid,
    '--chart-surface': tokens.chartSurface,
    '--chart-text': tokens.chartText,
    '--heatmap-empty': tokens.heatmapEmpty,
    '--heatmap-empty-border': tokens.heatmapEmptyBorder,
    '--heatmap-1': tokens.heatmap1,
    '--heatmap-2': tokens.heatmap2,
    '--heatmap-3': tokens.heatmap3,
    '--heatmap-4': tokens.heatmap4,
    '--color-success': tokens.success,
    '--color-success-subtle': tokens.successSubtle,
    '--color-warning': tokens.warning,
    '--color-warning-subtle': tokens.warningSubtle,
    '--color-danger': tokens.danger,
    '--color-danger-subtle': tokens.dangerSubtle,
    '--color-info': tokens.info,
    '--color-info-subtle': tokens.infoSubtle,
  };
}

// Backward-compatibility wrapper for any legacy component calling getEffectiveAccent
export function getEffectiveAccent(color: AccentColor, customHex?: string) {
  const hex = getResolvedAccentHex(color, customHex);
  return {
    id: color,
    label: ACCENT_PRESETS[color]?.label || 'Accent',
    hex,
    previewBg: '',
    primaryBg: '',
    primaryHoverBg: '',
    primaryText: '',
    lightText: '',
    subtleBg: '',
    borderClass: '',
    ringClass: '',
    heatHighClass: '',
    gradientFrom: '',
    gradientTo: '',
  };
}

// Backward-compatibility export for legacy BASE_THEMES
export const BASE_THEMES = {
  slate: { id: 'slate', bgBody: 'bg-[#07090E]', headerBg: 'bg-[#07090E]/94', navBg: 'bg-[#090D16]/95' },
  oled: { id: 'oled', bgBody: 'bg-[#000000]', headerBg: 'bg-[#000000]/96', navBg: 'bg-[#040406]/97' },
  charcoal: { id: 'charcoal', bgBody: 'bg-[#111216]', headerBg: 'bg-[#111216]/94', navBg: 'bg-[#14151B]/96' },
  frost: { id: 'frost', bgBody: 'bg-[#0B111A]', headerBg: 'bg-[#0B111A]/94', navBg: 'bg-[#0E1522]/96' },
  light: { id: 'light', bgBody: 'bg-[#F8FAFC]', headerBg: 'bg-[#F8FAFC]/96', navBg: 'bg-[#FFFFFF]/97' },
};

export const ACCENT_THEMES = ACCENT_PRESETS as any;
