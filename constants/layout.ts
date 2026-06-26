// Fridos Design System — Layout tokens (radii, spacing, shadows)
// Canonical values shared across screens and UI primitives so that
// nothing reinvents border-radius / padding / elevation locally.

import { ViewStyle } from 'react-native';
import { Colors } from './colors';

// Border radii
export const Radii = {
  box: 12,        // emoji / icon boxes
  input: 14,      // text inputs
  button: 16,     // buttons (primary CTA)
  card: 16,       // standard cards
  pill: 20,       // chips, badges (full-round look at our heights)
  cardLarge: 24,  // modals, bottom sheets, hero cards
  full: 999,      // circles
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
