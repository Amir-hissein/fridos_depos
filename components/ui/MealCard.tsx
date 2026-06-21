import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PressableScale } from './PressableScale';

interface MealCardProps {
  emoji: string;
  name: string;
  time: number;
  kcal: number;
  bg: string;
  onPress?: () => void;
}

export function MealCard({ emoji, name, time, kcal, bg, onPress }: MealCardProps) {
  return (
    <PressableScale style={styles.card} onPress={onPress} scaleTo={0.98} haptic="light">
      <View style={[styles.img, { backgroundColor: bg }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{time} min</Text>
          <View style={styles.dot} />
          <Ionicons name="flame-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{kcal} kcal</Text>
        </View>
      </View>
      <View style={styles.handle}>
        <View style={styles.handleLine} />
        <View style={styles.handleLine} />
        <View style={styles.handleLine} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  img: {
    width: 58,
    height: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 30 },
  info: { flex: 1 },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textLight,
    marginHorizontal: 2,
  },
  handle: {
    gap: 4,
    paddingRight: 4,
  },
  handleLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textLight,
  },
});
