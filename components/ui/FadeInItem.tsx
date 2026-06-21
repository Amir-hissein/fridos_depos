import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle, Easing } from 'react-native';

interface FadeInItemProps {
  children: React.ReactNode;
  /** Index dans la liste — décale l'entrée (effet cascade) */
  index?: number;
  /** Décalage par item en ms (défaut 60) */
  stagger?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Entrée douce au montage : fondu + légère remontée (translateY 12 → 0).
 * Décalée par index pour un effet cascade discret (≤ 400ms au total).
 */
export function FadeInItem({ children, index = 0, stagger = 60, style }: FadeInItemProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: index * stagger,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
