import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { Radii, Spacing, elevation } from '../../constants/layout';
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
    elevated ? styles.elevatedStrong : styles.elevated,
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: Radii.card,
    },
    padded: {
      padding: Spacing.lg,
    },
    // Borderless depth — resting cards get level 1, `elevated` cards level 2.
    elevated: elevation(c, 1),
    elevatedStrong: elevation(c, 2),
  });
