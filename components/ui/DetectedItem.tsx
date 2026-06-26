import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { haptic } from '../../lib/haptics';

interface DetectedItemProps {
  emoji: string;
  name: string;
  confidence: number;
  bgColor: string;
  checked?: boolean;
  onToggle?: () => void;
  initialChecked?: boolean;
}

export function DetectedItem({
  emoji,
  name,
  confidence,
  bgColor,
  checked,
  onToggle,
  initialChecked = true,
}: DetectedItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [localChecked, setLocalChecked] = useState(initialChecked);
  const isChecked = checked !== undefined ? checked : localChecked;

  const pop = useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: isChecked ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 140,
    }).start();
  }, [isChecked]);

  const handlePress = () => {
    if (isChecked) haptic.light();
    else haptic.success();
    if (onToggle) {
      onToggle();
    } else {
      setLocalChecked(c => !c);
    }
  };

  const uncertain = confidence < 75;

  const checkScale = pop.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1.15, 1],
  });

  return (
    <Pressable
      style={[styles.row, uncertain && !isChecked && styles.rowUncertain]}
      onPress={handlePress}
    >
      <View style={[styles.emojiWrap, { backgroundColor: bgColor }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.conf}>
          {confidenceLabel(confidence)} · {confidence}%
        </Text>
      </View>
      <View style={[styles.check, isChecked && styles.checkActive]}>
        <Animated.View style={{ transform: [{ scale: checkScale }], opacity: pop }}>
          <Ionicons name="checkmark" size={14} color={colors.white} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

function confidenceLabel(pct: number) {
  if (pct >= 90) return 'Detected';
  if (pct >= 75) return 'Likely';
  return 'Unsure';
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    height: 60,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  rowUncertain: { opacity: 0.55 },
  emojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  info: { flex: 1 },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  conf: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
});
