import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
  StyleSheet,
} from 'react-native';
import { haptic, HapticKind } from '../../lib/haptics';
import { Springs } from '../../constants/animations';

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  /** Échelle cible au press (défaut 0.96 — style subtil & premium) */
  scaleTo?: number;
  /** Retour haptique déclenché au press */
  haptic?: HapticKind;
  disabled?: boolean;
  hitSlop?: number | { top?: number; left?: number; bottom?: number; right?: number };
  /** Accepté pour compatibilité (migration depuis TouchableOpacity) — ignoré. */
  activeOpacity?: number;
  /** Libellé lu par les lecteurs d'écran (indispensable sur les boutons icône-seule). */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Rôle d'accessibilité (défaut « button » dès qu'un onPress est fourni). */
  accessibilityRole?: 'button' | 'link' | 'none' | 'image' | 'text';
}

/**
 * Wrapper réutilisable : applique un léger ressort de scale au toucher
 * (enfoncement doux) + retour haptique optionnel.
 * Remplace les TouchableOpacity statiques de l'app.
 */
export function PressableScale({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  haptic: hapticKind,
  disabled,
  hitSlop,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number) => {
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      ...Springs.press,
    }).start();
  };

  // Split layout and non-layout styles
  const flatStyle = (StyleSheet.flatten(style) || {}) as any;
  const layoutStyle: any = {};
  const innerStyle: any = {};

  const LAYOUT_KEYS = new Set([
    'position', 'top', 'bottom', 'left', 'right',
    'flex', 'flexGrow', 'flexShrink', 'flexBasis',
    'alignSelf',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    'zIndex'
  ]);

  for (const key of Object.keys(flatStyle)) {
    if (LAYOUT_KEYS.has(key)) {
      layoutStyle[key] = flatStyle[key];
    } else {
      innerStyle[key] = flatStyle[key];
    }
  }

  // Ensure inner view expands if layout styles are applied
  const innerSizing: ViewStyle = {};
  if (layoutStyle.flex !== undefined || layoutStyle.alignSelf === 'stretch') {
    innerSizing.flex = 1;
    innerSizing.width = '100%';
  }
  if (layoutStyle.width !== undefined) {
    innerSizing.width = '100%';
  }
  if (layoutStyle.height !== undefined) {
    innerSizing.height = '100%';
  }

  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) {
          animateTo(scaleTo);
          if (hapticKind) haptic[hapticKind]();
        }
      }}
      onPressOut={() => {
        if (!disabled) {
          animateTo(1);
        }
      }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={layoutStyle}
      accessible
      accessibilityRole={accessibilityRole ?? (onPress ? 'button' : undefined)}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[innerSizing, innerStyle, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
