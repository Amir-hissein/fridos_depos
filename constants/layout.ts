// Fridos Design System — Layout tokens (radii, spacing, shadows)
// Canonical values shared across screens and UI primitives so that
// nothing reinvents border-radius / padding / elevation locally.

import { ViewStyle } from 'react-native';
import { Colors, ThemeColors } from './colors';

// Border radii
export const Radii = {
  box: 12, // emoji / icon boxes
  input: 14, // text inputs
  button: 16, // buttons (primary CTA)
  card: 16, // standard cards
  pill: 20, // chips, badges (full-round look at our heights)
  cardLarge: 24, // modals, bottom sheets, hero cards
  full: 999, // circles
};

// Spacing scale (base 4)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  gutter: 22, // horizontal screen margin
};

/**
 * Cross-platform elevation — the professional, borderless way to separate a
 * card from its background. Pass the active palette so it adapts to light/dark:
 *   • Light: soft, realistic drop shadow (iOS / Material standard).
 *   • Dark: subtle shadow; cards also read via their lighter surface colour.
 *
 * Levels: 1 = resting cards · 2 = raised (hero, FAB, popovers) · 3 = sheets/modals.
 *
 * Usage inside a themed StyleSheet:
 *   const makeStyles = (c: ThemeColors) =>
 *     StyleSheet.create({ card: { backgroundColor: c.surface, ...elevation(c, 1) } });
 */
export function elevation(c: ThemeColors, level: 1 | 2 | 3 = 1): ViewStyle {
  const geom = {
    1: { height: 3, radius: 10, elevation: 3 },
    2: { height: 8, radius: 20, elevation: 8 },
    3: { height: 16, radius: 28, elevation: 16 },
  }[level];
  const opacity = c.isDark
    ? { 1: 0.4, 2: 0.5, 3: 0.6 }[level]
    : { 1: 0.1, 2: 0.14, 3: 0.18 }[level];
  return {
    shadowColor: c.shadowBase,
    shadowOffset: { width: 0, height: geom.height },
    shadowOpacity: opacity,
    shadowRadius: geom.radius,
    elevation: geom.elevation,
  };
}

// Elevation presets (tuned for the dark UI)
export const Shadows: Record<'card' | 'green' | 'orange' | 'soft', ViewStyle> = {
  card: {
    shadowColor: Colors.shadowCard,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  green: {
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orange: {
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  soft: {
    shadowColor: Colors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
};
