import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { CalorieRing } from './CalorieRing';
import { PressableScale } from './PressableScale';
import { usePlan, MealSlot } from '../../context/PlanContext';
import { MEAL_PLAN } from '../../constants/recipes';
import { haptic } from '../../lib/haptics';

type IName = React.ComponentProps<typeof Ionicons>['name'];

const SLOTS: { slot: MealSlot; label: string; icon: IName }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { slot: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { slot: 'dinner', label: 'Dinner', icon: 'moon-outline' },
];

const MACROS = [
  { key: 'protein', label: 'Protein', color: Colors.green },
  { key: 'carbs', label: 'Carbs', color: Colors.gold },
  { key: 'fat', label: 'Fat', color: Colors.orange },
] as const;

const WATER_STEP = 250;

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7; // Monday = 0
}

export function DailyDashboard() {
  const { targets, intake, consumedKcal, logMeal, addWater } = usePlan();
  const todayMeals = MEAL_PLAN[todayIndex()] || [];
  const remaining = Math.max(targets.kcal - consumedKcal, 0);
  const waterRatio = targets.waterMl > 0 ? Math.min(intake.waterMl / targets.waterMl, 1) : 0;
  const mealTarget = Math.round(targets.kcal / 3);

  return (
    <View>
      {/* Calories card */}
      <View style={styles.calorieCard}>
        <View style={styles.calorieLeft}>
          <View style={styles.calorieLabelRow}>
            <Ionicons name="flame" size={16} color={Colors.orange} />
            <Text style={styles.calorieLabel}>Calories</Text>
          </View>
          <View style={styles.kcalRow}>
            <Text style={styles.kcalConsumed}>{consumedKcal}</Text>
            <Text style={styles.kcalTarget}>/ {targets.kcal} kcal</Text>
          </View>
          <View style={styles.remainingPill}>
            <Text style={styles.remainingText}>Remaining: {remaining} kcal</Text>
          </View>
        </View>
        <CalorieRing consumed={consumedKcal} target={targets.kcal} size={104} stroke={10} color={Colors.orange} />
      </View>

      {/* Macro targets strip */}
      <View style={styles.macroStrip}>
        {MACROS.map(m => (
          <View key={m.key} style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: m.color }]} />
            <Text style={styles.macroVal}>{targets[m.key]}g</Text>
            <Text style={styles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Today's meals (grid) */}
      <Text style={styles.sectionLabel}>Today's meals</Text>
      <View style={styles.mealsGrid}>
        {SLOTS.map(({ slot, label, icon }) => {
          const meal = todayMeals.find(m => m.type === slot);
          const consumed = intake[slot];
          const logged = consumed > 0;
          const ratio = mealTarget > 0 ? Math.min(consumed / mealTarget, 1) : 0;
          return (
            <PressableScale
              key={slot}
              style={[styles.mealCard, logged && styles.mealCardActive]}
              scaleTo={0.97}
              onPress={() => {
                haptic[logged ? 'light' : 'success']();
                logMeal(slot, meal ? meal.kcal : mealTarget);
              }}
            >
              <View style={styles.mealTop}>
                <View style={[styles.mealCheck, logged && styles.mealCheckDone]}>
                  <Ionicons name={logged ? 'checkmark' : icon} size={16} color={logged ? Colors.white : Colors.green} />
                </View>
                <Text style={styles.mealLabel}>{label}</Text>
              </View>
              <Text style={styles.mealKcal}>
                {consumed}<Text style={styles.mealKcalTarget}> / {mealTarget} kcal</Text>
              </Text>
              <View style={styles.mealBarBg}>
                <View style={[styles.mealBarFill, { flex: ratio }]} />
                <View style={{ flex: 1 - ratio }} />
              </View>
            </PressableScale>
          );
        })}
      </View>

      {/* Water tracking */}
      <Text style={styles.sectionLabel}>Water</Text>
      <View style={styles.waterCard}>
        <View style={styles.waterIcon}>
          <Ionicons name="water" size={22} color={Colors.green} />
        </View>
        <View style={styles.waterInfo}>
          <Text style={styles.waterValue}>
            {intake.waterMl} <Text style={styles.waterTarget}>/ {targets.waterMl} ml</Text>
          </Text>
          <View style={styles.waterBarBg}>
            <View style={[styles.waterBarFill, { flex: waterRatio }]} />
            <View style={{ flex: 1 - waterRatio }} />
          </View>
        </View>
        <PressableScale style={styles.waterBtn} scaleTo={0.9} haptic="light" onPress={() => addWater(WATER_STEP)}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </PressableScale>
      </View>
    </View>
  );
}

const CARD_GAP = 12;

const styles = StyleSheet.create({
  calorieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  calorieLeft: { flex: 1, gap: 8 },
  calorieLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calorieLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.orange,
  },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  kcalConsumed: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  kcalTarget: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  remainingPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  remainingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  macroStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroVal: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  macroLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },

  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 24,
  },
  mealCard: {
    flexGrow: 0,
    flexBasis: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  mealCardActive: {
    borderColor: Colors.green,
  },
  mealTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealCheck: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCheckDone: { backgroundColor: Colors.green },
  mealLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  mealKcal: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.textPrimary },
  mealKcalTarget: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
  mealBarBg: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.separatorLight,
  },
  mealBarFill: { backgroundColor: Colors.green },

  waterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
  },
  waterIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterInfo: { flex: 1, gap: 6 },
  waterValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  waterTarget: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted },
  waterBarBg: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.separatorLight,
  },
  waterBarFill: { backgroundColor: Colors.green },
  waterBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
