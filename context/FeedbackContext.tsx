// Fridos — Système de feedback unifié (toasts + dialogs)
// Remplace les `Alert.alert` natifs (incohérents avec le thème sombre) par
// une couche d'alertes pro, stylée au design system, uniforme dans toute l'app.
//
//   const { toast, alert, confirm } = useFeedback();
//   toast('Recette enregistrée');                       // succès par défaut
//   toast('Connexion perdue', { variant: 'error' });
//   await confirm({ title: 'Supprimer ?', destructive: true });
//   alert({ title: 'Champ manquant', message: '…' });
//
// Le provider rend l'overlay des toasts + le modal de dialog au-dessus de
// toute l'app (monté à la racine).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Radii, Shadows, Spacing } from '../constants/layout';
import { Durations, Easings, Springs } from '../constants/animations';
import { haptic } from '../lib/haptics';
import { PressableScale } from '../components/ui/PressableScale';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/* ───────────────────────── Types ───────────────────────── */

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info';
type DialogVariant = FeedbackVariant | 'question';

interface ToastOptions {
  variant?: FeedbackVariant;
  /** Durée d'affichage en ms (défaut 2600). */
  duration?: number;
}

export interface DialogButton {
  label: string;
  /** `cancel` = neutre/secondaire, `destructive` = rouge, sinon action principale. */
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  variant?: DialogVariant;
  /** Icône personnalisée — sinon dérivée de la variante. */
  icon?: IoniconName;
  /** Boutons. Si omis : un seul bouton « OK ». */
  buttons?: DialogButton[];
}

interface ConfirmOptions {
  title: string;
  message?: string;
  variant?: DialogVariant;
  icon?: IoniconName;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Le bouton de confirmation devient rouge. */
  destructive?: boolean;
}

interface FeedbackApi {
  /** Bannière transitoire en haut de l'écran. */
  toast: (message: string, options?: ToastOptions) => void;
  /** Dialog modal avec boutons personnalisés. */
  alert: (options: DialogOptions) => void;
  /** Confirmation oui/non — résout `true` si confirmé. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

/* ──────────────── Config visuelle par variante ──────────────── */

const VARIANT_STYLE: Record<
  DialogVariant,
  { color: string; tint: string; icon: IoniconName }
> = {
  success: { color: Colors.green, tint: Colors.greenLight, icon: 'checkmark-circle' },
  error: { color: Colors.red, tint: Colors.redLight, icon: 'alert-circle' },
  warning: { color: Colors.orange, tint: Colors.orangeLight, icon: 'warning' },
  info: { color: Colors.blue, tint: Colors.blueLight, icon: 'information-circle' },
  question: { color: Colors.gold, tint: Colors.goldLight, icon: 'help-circle' },
};

/* ───────────────────────── Contexte ───────────────────────── */

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within <FeedbackProvider>');
  return ctx;
}

/* ───────────────────────── Provider ───────────────────────── */

interface ToastState {
  id: number;
  message: string;
  variant: FeedbackVariant;
  duration: number;
}

interface DialogState extends DialogOptions {
  id: number;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((message: string, options?: ToastOptions) => {
    const variant = options?.variant ?? 'success';
    if (variant === 'error') haptic.medium();
    else haptic.success();
    setToastState({
      id: ++idRef.current,
      message,
      variant,
      duration: options?.duration ?? 2600,
    });
  }, []);

  const alert = useCallback((options: DialogOptions) => {
    haptic.light();
    setDialogState({ ...options, id: ++idRef.current });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    haptic.light();
    return new Promise<boolean>((resolve) => {
      setDialogState({
        id: ++idRef.current,
        title: options.title,
        message: options.message,
        variant: options.variant ?? (options.destructive ? 'warning' : 'question'),
        icon: options.icon,
        buttons: [
          {
            label: options.cancelLabel ?? 'Annuler',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            label: options.confirmLabel ?? 'Confirmer',
            style: options.destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
        ],
      });
    });
  }, []);

  const api = useMemo<FeedbackApi>(() => ({ toast, alert, confirm }), [toast, alert, confirm]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <ToastHost toast={toastState} onHide={() => setToastState(null)} />
      <DialogHost dialog={dialogState} onClose={() => setDialogState(null)} />
    </FeedbackContext.Provider>
  );
}

/* ───────────────────────── Toast ───────────────────────── */

function ToastHost({ toast, onHide }: { toast: ToastState | null; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [current, setCurrent] = useState<ToastState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Anime la sortie puis libère le toast.
  const dismiss = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: Durations.fast,
      easing: Easings.in,
      useNativeDriver: true,
    }).start(() => {
      setCurrent(null);
      onHide();
    });
  }, [anim, onHide]);

  useEffect(() => {
    if (!toast) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setCurrent(toast);
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, ...Springs.gentle }).start();
    hideTimer.current = setTimeout(dismiss, toast.duration);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [toast, anim, dismiss]);

  if (!current) return null;

  const { color, tint, icon } = VARIANT_STYLE[current.variant];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.toastWrap,
        { top: insets.top + Spacing.sm },
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
          ],
        },
      ]}
    >
      <Pressable onPress={dismiss} style={[styles.toast, { borderColor: color + '40' }]}>
        <View style={[styles.toastIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.toastText} numberOfLines={2}>
          {current.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ───────────────────────── Dialog ───────────────────────── */

function DialogHost({ dialog, onClose }: { dialog: DialogState | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dialog) {
      setVisible(true);
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, ...Springs.bouncy }).start();
    }
  }, [dialog, anim]);

  const close = useCallback(
    (action?: () => void) => {
      haptic.light();
      Animated.timing(anim, {
        toValue: 0,
        duration: Durations.fast,
        easing: Easings.in,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onClose();
        action?.();
      });
    },
    [anim, onClose],
  );

  if (!dialog) return null;

  const variant = dialog.variant ?? 'info';
  const { color, tint, icon } = VARIANT_STYLE[variant];
  const buttons: DialogButton[] = dialog.buttons?.length
    ? dialog.buttons
    : [{ label: 'OK', style: 'default' }];
  // 2 boutons exactement → côte à côte, sinon empilés.
  const horizontal = buttons.length === 2;

  return (
    <Modal visible={visible} transparent statusBarTranslucent onRequestClose={() => close()}>
      <View style={styles.dialogRoot}>
        <Animated.View style={[styles.dialogBackdrop, { opacity: anim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
        </Animated.View>

        <Animated.View
          style={[
            styles.dialogCard,
            {
              opacity: anim,
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
              ],
            },
          ]}
        >
          <View style={[styles.dialogIcon, { backgroundColor: tint }]}>
            <Ionicons name={dialog.icon ?? icon} size={30} color={color} />
          </View>

          <Text style={styles.dialogTitle}>{dialog.title}</Text>
          {!!dialog.message && <Text style={styles.dialogMessage}>{dialog.message}</Text>}

          <View style={[styles.dialogButtons, horizontal && styles.dialogButtonsRow]}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isCancel;
              return (
                <PressableScale
                  key={i}
                  haptic="light"
                  style={[
                    styles.dialogBtn,
                    horizontal && styles.dialogBtnFlex,
                    isCancel && styles.dialogBtnCancel,
                    isDestructive && styles.dialogBtnDestructive,
                    isPrimary && !isDestructive && { backgroundColor: color },
                  ]}
                  onPress={() => close(btn.onPress)}
                >
                  <Text
                    style={[
                      styles.dialogBtnText,
                      isCancel && styles.dialogBtnTextCancel,
                    ]}
                  >
                    {btn.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Styles ───────────────────────── */

const styles = StyleSheet.create({
  /* Toast */
  toastWrap: {
    position: 'absolute',
    left: Spacing.gutter,
    right: Spacing.gutter,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...Shadows.card,
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: Radii.box,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 19,
  },

  /* Dialog */
  dialogRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayStrong,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radii.cardLarge,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  dialogIcon: {
    width: 60,
    height: 60,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  dialogTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 19,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  dialogMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  dialogButtons: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
  },
  dialogBtn: {
    height: 50,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.green,
  },
  dialogBtnFlex: {
    flex: 1,
  },
  dialogBtnCancel: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  dialogBtnDestructive: {
    backgroundColor: Colors.red,
  },
  dialogBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textWhite,
  },
  dialogBtnTextCancel: {
    color: Colors.textSecondary,
  },
});
