import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { STAGGER, Durations } from '../../constants/animations';
import { MOTION_CURVE, MotionDirection, motionOffset } from '../../constants/motion';

interface FadeInItemProps {
  children: React.ReactNode;
  /** Index dans la liste — décale l'entrée (effet cascade) */
  index?: number;
  /** Décalage par item en ms (défaut = STAGGER) */
  stagger?: number;
  /** Sens de la légère translation d'entrée (défaut 'up') */
  direction?: MotionDirection;
  style?: StyleProp<ViewStyle>;
}

/**
 * Entrée douce et uniforme au montage : fondu + légère translation, décalée par
 * index pour un effet cascade discret. Sert aussi bien pour les sections d'écran
 * que pour les items de liste.
 *
 * Piloté par le **montage** (useEffect + shared value) plutôt que par le `entering`
 * de Reanimated : ce dernier peut échouer à se déclencher sur navigation rapide /
 * re-montage d'écran et laisser le contenu bloqué à `opacity: 0` (« vue vide »).
 * Ici la valeur animée finit toujours à 1 → le contenu est garanti visible.
 */
export function FadeInItem({
  children,
  index = 0,
  stagger = STAGGER,
  direction = 'up',
  style,
}: FadeInItemProps) {
  // Start hidden, then always animate to fully shown on mount.
  const progress = useSharedValue(0);
  const from = motionOffset(direction);

  useEffect(() => {
    progress.value = withDelay(
      index * stagger,
      withTiming(1, { duration: Durations.base, easing: MOTION_CURVE }),
    );
    // Mount-only: the cascade delay is captured once, like the previous behaviour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * from }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
