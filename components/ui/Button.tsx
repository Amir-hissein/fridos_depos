import React, { ReactNode } from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/layout';
import { useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from './PressableScale';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'orange' | 'premium' | 'outline';
  /** Optional element rendered before the label (e.g. an icon). */
  icon?: ReactNode;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  style,
  textStyle,
  disabled,
}: ButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'orange' && styles.orange,
    variant === 'premium' && styles.premium,
    variant === 'outline' && styles.outline,
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [styles.label, variant === 'outline' && styles.outlineLabel, textStyle];

  return (
    <PressableScale
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      haptic={disabled || loading ? undefined : 'light'}
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon}
          <Text style={labelStyle}>{label}</Text>
        </>
      )}
    </PressableScale>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    base: {
      height: 52,
      borderRadius: Radii.button,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    primary: {
      backgroundColor: c.green,
      ...Shadows.green,
    },
    orange: {
      backgroundColor: c.orange,
      ...Shadows.orange,
    },
    premium: {
      backgroundColor: c.green,
      ...Shadows.green,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: c.textWhite,
    },
    outlineLabel: { color: c.textPrimary },
  });
