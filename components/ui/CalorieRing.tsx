import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  stroke?: number;
  color?: string;
}

/** Circular calorie progress ring (consumed / target). */
export function CalorieRing({ consumed, target, size = 132, stroke = 12, color = Colors.green }: CalorieRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;
  const dashOffset = circumference * (1 - ratio);
  const pct = Math.round(ratio * 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.separatorLight}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.pct}>{pct}%</Text>
        <Text style={styles.label}>of goal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -2,
  },
});
