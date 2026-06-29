import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Radii } from '../../constants/layout';
import { PressableScale } from './PressableScale';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Red, destructive styling (e.g. delete account). */
  destructive?: boolean;
  /** Icon shown in the badge at the top. */
  icon?: IconName;
  /** Disables buttons + shows a spinner on the confirm action. */
  loading?: boolean;
}

/**
 * Themed, centered confirmation dialog — a polished replacement for the native
 * Alert. Matches the app's design system (surface, radii, tokens) and supports a
 * destructive variant for irreversible actions.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive,
  icon,
  loading,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const accent = destructive ? colors.red : colors.green;
  const badgeIcon: IconName = icon ?? (destructive ? 'trash-can-outline' : 'help-circle-outline');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={loading ? undefined : onCancel} />
      <View style={s.center} pointerEvents="box-none">
        <View style={s.card}>
          <View style={[s.iconBadge, { backgroundColor: destructive ? colors.redLight : colors.greenLight }]}>
            <MaterialCommunityIcons name={badgeIcon} size={26} color={accent} />
          </View>

          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>

          <View style={s.actions}>
            <PressableScale
              style={s.cancelBtn}
              scaleTo={0.97}
              haptic="light"
              onPress={onCancel}
              disabled={loading}
              accessibilityLabel={cancelLabel}
            >
              <Text style={s.cancelText}>{cancelLabel}</Text>
            </PressableScale>

            <PressableScale
              style={[s.confirmBtn, { backgroundColor: accent }]}
              scaleTo={0.97}
              haptic="medium"
              onPress={onConfirm}
              disabled={loading}
              accessibilityLabel={confirmLabel}
            >
              {loading
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={s.confirmText}>{confirmLabel}</Text>}
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: Radii.cardLarge,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: Radii.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.white,
  },
});
