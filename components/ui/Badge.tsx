import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Radii, Spacing } from '../../constants/layout';

type BadgeVariant = 'green' | 'orange' | 'gold' | 'neutral' | 'red';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** Filled (colored background) vs tinted (translucent background, colored text). */
  filled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/** Small status pill — replaces the inline premium/free/status badges. */
export function Badge({
  label,
  variant = 'green',
  filled = true,
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const { colors } = useTheme();
  const FILL: Record<BadgeVariant, string> = {
    green: colors.green,
    orange: colors.orange,
    gold: colors.gold,
    neutral: colors.surfaceElevated,
    red: colors.red,
  };
  const TINT_BG: Record<BadgeVariant, string> = {
    green: colors.greenLight,
    orange: colors.orangeLight,
    gold: colors.goldLight,
    neutral: colors.surfaceElevated,
    red: colors.redLight,
  };
  const TINT_FG: Record<BadgeVariant, string> = {
    green: colors.green,
    orange: colors.orange,
    gold: colors.goldDark,
    neutral: colors.textSecondary,
    red: colors.red,
  };
  const bg = filled ? FILL[variant] : TINT_BG[variant];
  const fg = filled ? colors.textWhite : TINT_FG[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon && <Ionicons name={icon} size={12} color={fg} style={styles.icon} />}
      <Text style={[styles.label, { color: fg }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
