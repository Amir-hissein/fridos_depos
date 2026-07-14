import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../constants/colors';

export type ThemeMode = 'light' | 'dark';
/** Resolved colour scheme — identical to {@link ThemeMode} now that there is no
 * "system" option. Kept as a distinct alias for screens that style per scheme. */
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'app.theme';

interface ThemeContextType {
  /** User preference: light · dark. */
  mode: ThemeMode;
  /** Active scheme applied right now (same as `mode`). */
  scheme: ResolvedScheme;
  /** Active colour palette for the current mode. */
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  /** True once the saved preference has been read from storage. Lets the root
   *  hold the splash so a returning light-mode user never sees a dark flash. */
  hydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to dark: a brand-new user (no saved preference) opens straight into
  // dark mode, and stays there until they explicitly switch.
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved preference once on mount (legacy 'system' falls back to
  // the dark default). Marking `hydrated` afterwards unblocks the first render.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      })
      .finally(() => setHydrated(true));
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const colors = mode === 'light' ? lightColors : darkColors;

  const value = useMemo<ThemeContextType>(
    () => ({ mode, scheme: mode, colors, setMode, hydrated }),
    [mode, colors, hydrated],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/**
 * Build a memoised StyleSheet from the active palette.
 * Usage:
 *   const makeStyles = (c: ThemeColors) => StyleSheet.create({ box: { backgroundColor: c.surface } });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (c: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}
