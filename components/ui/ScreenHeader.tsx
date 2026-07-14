import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemeColors } from '../../constants/colors';
import { Radii, Spacing, elevation } from '../../constants/layout';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from './PressableScale';
import { useTranslation } from 'react-i18next';

interface ScreenHeaderProps {
  title?: string;
  /** Back handler (defaults to router.back). Pass null to hide the back button. */
  onBack?: (() => void) | null;
  /** Optional element on the right (e.g. an action button). */
  right?: ReactNode;
  /** Title alignment — centered by default. */
  align?: 'center' | 'left';
  style?: ViewStyle;
}

const BTN = 40;

/**
 * Canonical screen header: uniform back button + title (+ optional right action).
 * Replaces the per-screen header/backBtn/headerTitle styles so every stack
 * screen shares the exact same metrics.
 */
export function ScreenHeader({ title, onBack, right, align = 'center', style }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const showBack = onBack !== null;
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.header, style]}>
      {showBack ? (
        <PressableScale
          haptic="light"
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel={t('a11y.back')}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </PressableScale>
      ) : (
        <View style={{ width: BTN }} />
      )}

      <Text
        style={[styles.title, align === 'center' ? styles.titleCenter : styles.titleLeft]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {right ? <View style={styles.right}>{right}</View> : <View style={{ width: BTN }} />}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    backBtn: {
      width: BTN,
      height: BTN,
      borderRadius: Radii.box,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...elevation(c, 1),
    },
    title: {
      flex: 1,
      fontFamily: 'Poppins_700Bold',
      fontSize: 18,
      color: c.textPrimary,
    },
    titleCenter: { textAlign: 'center' },
    titleLeft: { textAlign: 'left' },
    right: { minWidth: BTN, alignItems: 'flex-end', justifyContent: 'center' },
  });
