import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../../constants/colors';
import { useThemedStyles } from '../../context/ThemeContext';
import { Radii, Spacing } from '../../constants/layout';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Show the small grab handle at the top. */
  handle?: boolean;
  contentStyle?: ViewStyle;
}

/**
 * Reusable bottom sheet: dimmed backdrop + rounded top surface.
 * Replaces the duplicated modal sheet markup across screens.
 */
export function BottomSheet({ visible, onClose, children, handle = true, contentStyle }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, contentStyle, { paddingBottom: Spacing.xxl + insets.bottom }]}>
          {handle && <View style={styles.handle} />}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: Radii.cardLarge,
    borderTopRightRadius: Radii.cardLarge,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    marginBottom: Spacing.lg,
  },
});
