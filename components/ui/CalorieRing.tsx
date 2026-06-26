import React, { useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  stroke?: number;
  /** Solid stroke color used when `gradient` is false. */
  color?: string;
  /** Use the calorie gradient (orange → gold → green → blue). Defaults to true. */
  gradient?: boolean;
}

/** Circular calorie progress ring (consumed / target). */
export function CalorieRing({
  consumed,
  target,
  size = 132,
  stroke = 12,
  color,
  gradient = true,
}: CalorieRingProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const rawId = useId();
  const gradId = `calRing-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;
  const dashOffset = circumference * (1 - ratio);
  const pct = Math.round(ratio * 100);
  const strokeColor = gradient ? `url(#${gradId})` : (color ?? colors.green);
  // Keep the centre text inside the ring on every language (e.g. FR "de l'objectif").
  const innerWidth = size - stroke * 2 - 8;
  const pctSize = Math.round(size * 0.26);
  const labelSize = Math.max(10, Math.round(size * 0.11));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {gradient && (
          <Defs>
            {/* Same gradient as the analysis ring & the straight calorie bars. */}
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.orange} />
              <Stop offset="0.4" stopColor={colors.gold} />
              <Stop offset="0.75" stopColor={colors.green} />
              <Stop offset="1" stopColor={colors.blue} />
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.separatorLight}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <View style={{ width: innerWidth, alignItems: 'center' }}>
          <Text
            style={[styles.pct, { fontSize: pctSize }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {pct}%
          </Text>
          <Text
            style={[styles.label, { fontSize: labelSize }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {t('common.ofGoal')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    fontFamily: 'Poppins_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  label: {
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginTop: -2,
    textAlign: 'center',
  },
});
