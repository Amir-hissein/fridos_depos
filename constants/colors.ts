// Fridos Design System — Color palette (thème « Aqua Fresh »)
//
// Brand/semantic colours are theme-independent. Surfaces, text, borders,
// separators, overlays and shadows have a light + dark variant.
//
// `Colors` stays exported as the DARK palette so any not-yet-migrated style
// (StyleSheet.create at module load) keeps working unchanged. Migrated
// components read the active palette via `useTheme()` / `useThemedStyles()`.

// ── Brand & semantic (shared by both themes) ────────────────────────────────
const brand = {
  // Primary brand (teal)
  green: '#14B8A6',
  greenLight: 'rgba(20,184,166,0.16)',
  greenDark: '#0E8C7E',

  // Accent
  orange: '#FF8A5C',
  orangeLight: 'rgba(255,138,92,0.16)',

  // Premium / Gold
  gold: '#F4B740',
  goldDark: '#F2C879',
  goldLight: 'rgba(244,183,64,0.16)',
  goldBorder: 'rgba(244,183,64,0.45)',
  goldGradientEnd: '#E8A020',

  // Extended palette
  blue: '#38BDF8',
  blueLight: 'rgba(56, 189, 248, 0.16)',
  blueBorder: 'rgba(56, 189, 248, 0.30)',
  purple: '#9B59B6',
  purpleLight: 'rgba(155, 89, 182, 0.16)',
  red: '#E74C3C',
  redLight: 'rgba(231,76,60,0.12)',
  redBorder: 'rgba(231,76,60,0.28)',
  yellow: '#F39C12',
  brown: '#8E6B3E',
  beige: '#F3E1C7',

  // Macros / nutrition (semantic — use these on icons so meaning stays consistent
  // app-wide). Calorie = orange/flame, kept distinct from the gold "fat" macro.
  calorie: '#FF8A5C',
  calorieLight: 'rgba(255,138,92,0.16)',
  protein: '#4AAEEA',
  carbs: '#8CD743',
  fat: '#F4B740',

  // BMI scale
  bmiUnderweight: '#4A90D9',
  bmiNormal: '#3BA569',
  bmiOverweight: '#F4D03F',
  bmiObese: '#E53935',

  // Pure white (stays white in both themes)
  white: '#fff',
  textWhite: '#fff',

  // Scan camera is always dark (full-screen camera UI)
  scanBg: '#070D0C',
  scanOverlay: 'rgba(0,0,0,0.55)',
  overlayStrong: 'rgba(0,0,0,0.65)',
  overlayMedium: 'rgba(0,0,0,0.40)',

  // Brand shadows
  shadowGreen: 'rgba(20,184,166,0.35)',
  shadowOrange: 'rgba(255,138,92,0.34)',
};

// ── DARK theme ──────────────────────────────────────────────────────────────
export const darkColors = {
  ...brand,

  background: '#0B1413',
  backgroundAlt: '#14201E',
  backgroundDark: '#070D0C',
  backgroundDarkCard: '#14201E',

  textPrimary: '#F4F6F4',
  textSecondary: '#AEB4AE',
  textMuted: '#7C817C',
  textLight: '#565B56',
  textDarkMuted: '#c9c7bf',
  textDarkSubtle: '#7c7a72',

  surface: '#14201E',
  surfaceElevated: '#1E2D2A',
  surfaceDark: '#0F1716',
  surfaceGreen: '#0F2420',

  border: 'rgba(255,255,255,0.09)',
  borderLight: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.14)',
  separator: 'rgba(255,255,255,0.16)',
  separatorLight: 'rgba(255,255,255,0.08)',

  shadowBlack: 'rgba(0,0,0,0.40)',
  shadowCard: 'rgba(0,0,0,0.30)',
};

// ── LIGHT theme ─────────────────────────────────────────────────────────────
export const lightColors: typeof darkColors = {
  ...brand,

  background: '#F6F8F7',
  backgroundAlt: '#EDF1EF',
  backgroundDark: '#FFFFFF',
  backgroundDarkCard: '#FFFFFF',

  textPrimary: '#15201E',
  textSecondary: '#566159',
  textMuted: '#8A938C',
  textLight: '#AAB2AB',
  textDarkMuted: '#566159',
  textDarkSubtle: '#8A938C',

  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceDark: '#EEF2F0',
  surfaceGreen: '#E6F5F1',

  border: 'rgba(15,30,28,0.10)',
  borderLight: 'rgba(15,30,28,0.06)',
  borderStrong: 'rgba(15,30,28,0.16)',
  separator: 'rgba(15,30,28,0.12)',
  separatorLight: 'rgba(15,30,28,0.07)',

  shadowBlack: 'rgba(15,30,28,0.16)',
  shadowCard: 'rgba(15,30,28,0.10)',
};

export type ThemeColors = typeof darkColors;

/** Back-compat default palette (dark). Migrated UI reads the active palette
 *  through the theme context instead of importing this directly. */
export const Colors = darkColors;

export type ColorKey = keyof typeof Colors;
