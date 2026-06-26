import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { Durations, Easings, STAGGER } from '../../constants/animations';

type Direction = 'up' | 'down' | 'none';

interface FadeInItemProps {
  children: React.ReactNode;
  /** Index dans la liste — décale l'entrée (effet cascade) */
  index?: number;
  /** Décalage par item en ms (défaut = STAGGER) */
  stagger?: number;
  /** Sens de la légère translation d'entrée (défaut 'up') */
  direction?: Direction;
  style?: StyleProp<ViewStyle>;
}

const OFFSET = 12;

/**
 * Entrée douce et uniforme au montage : fondu + légère translation.
 * Décalée par index pour un effet cascade discret. Sert aussi bien pour
 * les sections d'écran que pour les items de liste.
 */
export function FadeInItem({
  children,
  index = 0,
  stagger = STAGGER,
  direction = 'up',
  style,
}: FadeInItemProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: Durations.base,
      delay: index * stagger,
      easing: Easings.out,
      useNativeDriver: true,
    }).start();
  }, []);

  const from = direction === 'down' ? -OFFSET : OFFSET;
  const transform =
    direction === 'none'
      ? []
      : [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }];

  return (
    <Animated.View style={[style, { opacity: anim, transform }]}>
      {children}
    </Animated.View>
  );
}
