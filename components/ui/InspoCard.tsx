import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Recipe } from '../../constants/recipes';
import { PressableScale } from './PressableScale';

interface InspoCardProps {
  recipe: Recipe;
  onPress?: () => void;
  locked?: boolean;
}

/**
 * Compact horizontal card for the "Quick inspiration" section.
 * Shows a real food photo; emoji + bgColor are the fallback.
 * When `locked`, a premium overlay is shown.
 */
export function InspoCard({ recipe, onPress, locked }: InspoCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!recipe.image && !imgFailed;

  return (
    <PressableScale style={styles.card} onPress={onPress} scaleTo={0.97} haptic="light">
      {/* Visual */}
      <View style={[styles.imgWrap, { backgroundColor: recipe.bgColor }]}>
        <Text style={styles.fallbackEmoji}>{recipe.emoji}</Text>
        {showImage && (
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        )}
        {/* Time badge */}
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={12} color={Colors.textPrimary} />
          <Text style={styles.timeText}>{recipe.time} min</Text>
        </View>
        {/* Premium lock */}
        {locked && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={16} color={Colors.white} />
            </View>
          </View>
        )}
      </View>

      {/* Infos */}
      <Text style={styles.name} numberOfLines={2}>{recipe.name}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="flame-outline" size={12} color={Colors.textMuted} />
        <Text style={styles.metaText}>{recipe.kcal} kcal</Text>
        <View style={styles.dot} />
        <Text style={styles.metaText}>{recipe.difficulty}</Text>
      </View>
    </PressableScale>
  );
}

const CARD_WIDTH = 168;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
  },
  imgWrap: {
    width: CARD_WIDTH,
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  fallbackEmoji: {
    fontSize: 48,
  },
  timeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textPrimary,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 19,
    marginBottom: 5,
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
});
