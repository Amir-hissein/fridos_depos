import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { RecipeNutrition, MacroSet } from '../../services/nutrition';
import { PressableScale } from './PressableScale';

interface NutritionCardProps {
  nutrition: RecipeNutrition;
}

const MACROS = [
  { key: 'protein', label: 'Protein', color: Colors.green },
  { key: 'carbs', label: 'Carbs', color: Colors.gold },
  { key: 'fat', label: 'Fat', color: Colors.orange },
] as const;

export function NutritionCard({ nutrition }: NutritionCardProps) {
  const [perServing, setPerServing] = useState(true);

  // Empty state: no ingredient had nutrition data
  if (nutrition.coveredCount === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Nutrition</Text>
        <View style={styles.emptyRow}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nutrition data isn't available for this recipe yet.</Text>
        </View>
      </View>
    );
  }

  const set: MacroSet = perServing ? nutrition.perServing : nutrition.total;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <View style={styles.toggle}>
          <PressableScale
            style={[styles.toggleBtn, perServing && styles.toggleBtnActive]}
            onPress={() => setPerServing(true)}
            scaleTo={0.96}
          >
            <Text style={[styles.toggleText, perServing && styles.toggleTextActive]}>Per serving</Text>
          </PressableScale>
          <PressableScale
            style={[styles.toggleBtn, !perServing && styles.toggleBtnActive]}
            onPress={() => setPerServing(false)}
            scaleTo={0.96}
          >
            <Text style={[styles.toggleText, !perServing && styles.toggleTextActive]}>Total</Text>
          </PressableScale>
        </View>
      </View>

      {/* Calories */}
      <View style={styles.kcalRow}>
        <View style={styles.kcalIcon}>
          <Ionicons name="flame" size={20} color={Colors.orange} />
        </View>
        <Text style={styles.kcalValue}>{set.kcal}</Text>
        <Text style={styles.kcalUnit}>kcal</Text>
      </View>

      {/* Macro distribution bar (segments proportional to grams) */}
      <View style={styles.bar}>
        {MACROS.map(m => (
          <View key={m.key} style={{ flex: set[m.key], backgroundColor: m.color }} />
        ))}
      </View>

      {/* Macro values */}
      <View style={styles.macros}>
        {MACROS.map(m => (
          <View key={m.key} style={styles.macroItem}>
            <View style={styles.macroTop}>
              <View style={[styles.macroDot, { backgroundColor: m.color }]} />
              <Text style={styles.macroValue}>{set[m.key]}g</Text>
            </View>
            <Text style={styles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Partial estimate note */}
      {nutrition.partial && (
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.noteText}>
            Partial estimate · {nutrition.coveredCount}/{nutrition.totalCount} ingredients
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    shadowColor: Colors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    shadowColor: Colors.shadowBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  toggleTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 14,
  },
  kcalIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  kcalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 30,
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  kcalUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 5,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.separatorLight,
    marginBottom: 16,
  },
  macros: {
    flexDirection: 'row',
  },
  macroItem: {
    flex: 1,
    gap: 4,
  },
  macroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 14,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
});
