// Fridos Design System — Motion (Reanimated)
//
// One source of truth for how sections, cards and list rows *appear*, so
// everything animates in with the same rhythm and easing. Built on
// `react-native-reanimated` (v4) and consumed through the shared <FadeInItem>
// component (components/ui/FadeInItem), which every screen uses.
//
// IMPORTANT — why this is mount-driven, not `entering`-driven:
// Reanimated's `entering` prop starts the view at `opacity: 0` and relies on the
// layout-animation lifecycle to fade it in. On fast navigation / screen re-mounts
// (react-native-screens) that lifecycle can silently fail to fire, leaving whole
// screens stuck invisible ("empty view"). Driving the fade from a `useEffect`
// with a shared value guarantees the content always resolves to visible.

import { Easing } from 'react-native-reanimated';

// Decelerate curve — content settles softly into place, never mechanically.
export const MOTION_CURVE = Easing.bezier(0.22, 1, 0.36, 1);
// Distance (px) travelled during the fade — subtle, premium, not showy.
export const MOTION_OFFSET = 12;

export type MotionDirection = 'up' | 'down' | 'none';

/** Signed translateY start offset (px) for a given entrance direction. */
export function motionOffset(direction: MotionDirection = 'up'): number {
  return direction === 'down' ? -MOTION_OFFSET : direction === 'up' ? MOTION_OFFSET : 0;
}
