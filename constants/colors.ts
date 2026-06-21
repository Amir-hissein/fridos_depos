// Fridos Design System — Color palette (DARK MODE)
// Semantic tokens: surfaces are dark, text is light, brand stays green/orange/gold.
// `white` / `textWhite` are kept as TRUE white for text & icons placed on colored fills.

export const Colors = {
  // Primary brand
  green: '#3BA569',
  greenLight: 'rgba(59,165,105,0.16)',
  greenDark: '#2E7D52',

  // Accent
  orange: '#FF8A5C',
  orangeLight: 'rgba(255,138,92,0.16)',

  // Premium / Gold
  gold: '#F4B740',
  goldDark: '#F2C879', // light gold — used as text/icon on dark gold tint
  goldLight: 'rgba(244,183,64,0.16)',

  // Backgrounds
  background: '#0F1211',
  backgroundAlt: '#1A1E1C',
  backgroundDark: '#0A0C0B',
  backgroundDarkCard: '#1A1E1C',

  // Text
  textPrimary: '#F4F6F4',
  textSecondary: '#AEB4AE',
  textMuted: '#7C817C',
  textLight: '#565B56',
  textWhite: '#fff',
  textDarkMuted: '#c9c7bf',
  textDarkSubtle: '#7c7a72',

  // Surface
  white: '#fff',
  surface: '#1A1E1C',
  surfaceElevated: '#262B28',
  surfaceDark: '#15110F',
  border: 'rgba(255,255,255,0.09)',
  borderLight: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Separator
  separator: 'rgba(255,255,255,0.16)',
  separatorLight: 'rgba(255,255,255,0.08)',

  // Scan screen
  scanBg: '#0A0C0B',
  scanOverlay: 'rgba(0,0,0,0.55)',

  // Shadows (barely visible on dark, kept for elevation on light surfaces)
  shadowGreen: 'rgba(59,165,105,0.35)',
  shadowOrange: 'rgba(255,138,92,0.34)',
  shadowBlack: 'rgba(0,0,0,0.40)',
  shadowCard: 'rgba(0,0,0,0.30)',
};

export type ColorKey = keyof typeof Colors;
