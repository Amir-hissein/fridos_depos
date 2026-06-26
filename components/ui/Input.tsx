import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Radii, Spacing } from '../../constants/layout';

interface InputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional element rendered on the right (e.g. a send button). */
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
}

/** Standard text field — dark surface, 14 radius, bordered. */
export function Input({ icon, right, containerStyle, style, ...props }: InputProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} />}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {right}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: Spacing.md,
  },
});
