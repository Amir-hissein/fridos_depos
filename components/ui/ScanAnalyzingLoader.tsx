// ScanAnalyzingLoader — the loader shown while a scan is being analysed by the AI
// (meal calories, or fridge ingredients).
//
// A refined, monochrome design: a faint track ring with a single "comet" arc
// (round caps) sweeping smoothly around it, and one icon at the centre that
// gently pulses and cross-fades through a short list. Minimal and premium.
//
// The accent colour and icon set are themeable so the same loader serves both
// the meal scan (orange / food) and the fridge scan (green / ingredients).
//
// Built with Reanimated (rotation, pulse, fade) + react-native-svg (crisp arc).

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const SIZE = 104;
const STROKE = 4;

export const MEAL_ICONS = ['🥗', '🍗', '🥑', '🍅', '🧀', '🥦'];
export const FRIDGE_ICONS = ['🥕', '🥦', '🍅', '🧀', '🥚', '🥬', '🍋', '🌶️'];

interface Props {
  /** Arc + accent colour. Defaults to the calorie orange. */
  tint?: string;
  /** Soft backdrop behind the centre icon. Defaults to orangeLight. */
  tintSoft?: string;
  /** Icons the centre cross-fades through. */
  pool?: string[];
}

export function ScanAnalyzingLoader({ tint, tintSoft, pool = MEAL_ICONS }: Props) {
  const { colors } = useTheme();
  const accent = tint ?? colors.calorie;
  const accentSoft = tintSoft ?? colors.orangeLight;

  const rot = useSharedValue(0);
  const scale = useSharedValue(1);
  const fade = useSharedValue(1);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Smooth, continuous sweep of the comet arc.
    rot.value = withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1, false);
    // Subtle breathing of the centre icon.
    scale.value = withRepeat(
      withTiming(1.07, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );

    // Quick cross-fade + swap to the next icon.
    const id = setInterval(() => {
      fade.value = withSequence(
        withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
      );
      setTimeout(() => setIdx(i => (i + 1) % pool.length), 180);
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length]);

  const arcStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: scale.value }] }));

  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const arcFraction = 0.32;

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Analyzing scan">
      {/* Static faint track */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke={colors.separator}
          strokeWidth={STROKE}
          fill="none"
          opacity={0.6}
        />
      </Svg>

      {/* Spinning comet arc */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, arcStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <LinearGradient id="scanCometGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity={1} />
              <Stop offset="1" stopColor={accent} stopOpacity={0.12} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            stroke="url(#scanCometGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c * arcFraction} ${c * (1 - arcFraction)}`}
          />
        </Svg>
      </Animated.View>

      {/* Centre icon */}
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <View style={[styles.iconBackdrop, { backgroundColor: accentSoft }]}>
          <Animated.Text style={[styles.icon, iconStyle]} allowFontScaling={false}>
            {pool[idx]}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  iconBackdrop: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 28 },
});
