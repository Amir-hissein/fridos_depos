// Fridos Design System — Animation tokens
// One source of truth for timing, easing and spring physics so every
// transition (taps, screen/section entrances, list changes) feels the same.

import { Easing, LayoutAnimation, LayoutAnimationConfig, Platform, UIManager } from 'react-native';

// Durations (ms)
export const Durations = {
  fast: 160, // micro-feedback (toggles, small fades)
  base: 240, // standard entrance / transition
  slow: 360, // emphasised / large surfaces
};

// Easing curves
export const Easings = {
  out: Easing.out(Easing.cubic), // decelerate — entrances
  in: Easing.in(Easing.cubic), // accelerate — exits
  inOut: Easing.inOut(Easing.cubic), // symmetric — moves
};

// Spring presets (react-native Animated.spring)
export const Springs = {
  /** Subtle press depress — buttons, cards. */
  press: { friction: 7, tension: 80 },
  /** Snappy, lively — FAB, emphasised taps. */
  bouncy: { friction: 6, tension: 140 },
  /** Smooth settle — progress bars, value changes. */
  gentle: { friction: 8, tension: 60 },
};

// Standard stagger between list items (ms)
export const STAGGER = 55;

// ── LayoutAnimation (smooth add/remove/reorder of native layout) ──
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Uniform layout transition preset (opacity + scale, base duration). */
export const LayoutPreset: LayoutAnimationConfig = {
  duration: Durations.base,
  create: {
    type: LayoutAnimation.Types.easeOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    type: LayoutAnimation.Types.easeIn,
    property: LayoutAnimation.Properties.opacity,
  },
};

/**
 * Call right before a setState that mutates a list/layout so React Native
 * animates the resulting layout change. Keeps every list (shopping, fridge,
 * recipe steps…) animating identically.
 */
export function animateLayout(config: LayoutAnimationConfig = LayoutPreset) {
  LayoutAnimation.configureNext(config);
}
