import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'auto' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'auto';
    const saved = window.localStorage.getItem('nexira.theme') as Theme | null;
    return saved || 'auto';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    try {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } catch {
      // Safari
      // @ts-ignore
      mql.addListener(handler);
      return () => {
        // @ts-ignore
        mql.removeListener(handler);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('nexira.theme', theme);
  }, [theme]);

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (theme === 'auto') return systemIsDark ? 'dark' : 'light';
    return theme;
  }, [theme, systemIsDark]);

  // When switching to auto, immediately resync with current system preference
  useEffect(() => {
    if (theme !== 'auto' || typeof window === 'undefined') return;
    try {
      setSystemIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {}
  }, [theme]);

  // Ensure Tailwind dark: variants activate by toggling the 'dark' class on <html>
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const value: ThemeContextValue = useMemo(
    () => ({ theme, setTheme, resolvedTheme, isDark: resolvedTheme === 'dark' }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

