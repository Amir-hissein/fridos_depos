import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { Radii, Spacing, Shadows } from '../../constants/layout';
import { useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from './PressableScale';

interface CardProps {
  children: ReactNode;
  /** Adds the standard inner padding (16). Set false for edge-to-edge content. */
  padded?: boolean;
  /** Drop shadow / elevation. */
  elevated?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Standard surface card: dark surface, 20 radius, optional padding + elevation.
 * Replaces the dozens of inline card styles across screens.
 */
export function Card({ children, padded = true, elevated = false, onPress, style }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  const cardStyle = [
    styles.card,
    padded && styles.padded,
    elevated && Shadows.card,
    style,
  ];

  if (onPress) {
    return (
      <PressableScale style={cardStyle} onPress={onPress} scaleTo={0.98} haptic="light">
        {children}
      </PressableScale>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  padded: {
    padding: Spacing.lg,
  },
});
