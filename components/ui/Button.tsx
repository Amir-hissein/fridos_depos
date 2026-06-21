import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { PressableScale } from './PressableScale';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'orange' | 'premium' | 'outline';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({
  label, onPress, variant = 'primary', loading, style, textStyle, disabled,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'orange' && styles.orange,
    variant === 'premium' && styles.premium,
    variant === 'outline' && styles.outline,
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variant === 'outline' && { color: Colors.textPrimary },
    textStyle,
  ];

  return (
    <PressableScale
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      haptic={disabled || loading ? undefined : 'light'}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={labelStyle}>{label}</Text>
      }
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    backgroundColor: Colors.green,
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orange: {
    backgroundColor: Colors.orange,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  premium: {
    backgroundColor: Colors.green,
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textWhite,
  },
});