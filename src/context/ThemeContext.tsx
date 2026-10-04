import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AccentColor, BaseTheme } from '../types/music';
import {
  ThemeTokens,
  generateThemeTokens,
  themeTokensToCssVars,
  ACCENT_PRESETS,
  BASE_THEME_PRESETS,
} from '../domain/themeConfig';

interface ThemeContextValue {
  baseTheme: BaseTheme;
  accentColor: AccentColor;
  customHex: string;
  tokens: ThemeTokens;
  setBaseTheme: (theme: BaseTheme) => void;
  setAccentColor: (color: AccentColor, customHex?: string) => void;
  setCustomHex: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseTheme, setBaseThemeState] = useState<BaseTheme>(() => {
    return (localStorage.getItem('scrobblex_base_theme') as BaseTheme) || 'slate';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('scrobblex_accent_color') as AccentColor) || 'cyan';
  });

  const [customHex, setCustomHexState] = useState<string>(() => {
    return localStorage.getItem('scrobblex_custom_hex') || '#38BDF8';
  });

  const tokens = useMemo(() => {
    return generateThemeTokens(baseTheme, accentColor, customHex);
  }, [baseTheme, accentColor, customHex]);

  // Inject CSS variables into :root DOM on theme changes
  useEffect(() => {
    const cssVars = themeTokensToCssVars(tokens);
    const root = document.documentElement;
    root.setAttribute('data-theme', tokens.isDark ? 'dark' : 'light');
    root.setAttribute('data-base-theme', baseTheme);
    root.style.colorScheme = tokens.isDark ? 'dark' : 'light';
    Object.entries(cssVars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  }, [tokens, baseTheme]);

  const setBaseTheme = (theme: BaseTheme) => {
    setBaseThemeState(theme);
    localStorage.setItem('scrobblex_base_theme', theme);
  };

  const setAccentColor = (color: AccentColor, newCustomHex?: string) => {
    setAccentColorState(color);
    localStorage.setItem('scrobblex_accent_color', color);
    if (newCustomHex) {
      setCustomHexState(newCustomHex);
      localStorage.setItem('scrobblex_custom_hex', newCustomHex);
    }
  };

  const setCustomHex = (hex: string) => {
    setCustomHexState(hex);
    localStorage.setItem('scrobblex_custom_hex', hex);
  };

  const value: ThemeContextValue = {
    baseTheme,
    accentColor,
    customHex,
    tokens,
    setBaseTheme,
    setAccentColor,
    setCustomHex,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    const fallbackTokens = generateThemeTokens('slate', 'cyan');
    return {
      baseTheme: 'slate',
      accentColor: 'cyan',
      customHex: '#38BDF8',
      tokens: fallbackTokens,
      setBaseTheme: () => {},
      setAccentColor: () => {},
      setCustomHex: () => {},
    };
  }
  return context;
}
