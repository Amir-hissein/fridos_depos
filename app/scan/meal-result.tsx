import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { detectMeal, DetectedMeal } from '../../services/vision';
import { usePlan, MealSlot } from '../../context/PlanContext';

const { height } = Dimensions.get('window');

const SLOTS: { slot: MealSlot; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { slot: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { slot: 'dinner', label: 'Dinner', icon: 'moon-outline' },
];

const MACROS = [
  { key: 'protein', label: 'Protein', color: Colors.green },
  { key: 'carbs', label: 'Carbs', color: Colors.gold },
  { key: 'fat', label: 'Fat', color: Colors.orange },
] as const;

export default function MealResultScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { logMeal } = usePlan();
  const [meal, setMeal] = useState<DetectedMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<MealSlot>('lunch');

  useEffect(() => {
    let active = true;
    detectMeal(uri)
      .then(m => active && setMeal(m))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [uri]);

  const handleLog = () => {
    if (!meal) return;
    haptic.success();
    logMeal(slot, meal.kcal);
    router.replace('/(tabs)/plan');
  };

  return (
    <View style={styles.container}>
      <View style={styles.bg}>
        <Text style={styles.bgEmoji1}>🍽️</Text>
        <Text style={styles.bgEmoji2}>🥗</Text>
      </View>

      <SafeAreaView style={styles.headerBar} edges={['top']}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/plan')} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {loading || !meal ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={Colors.orange} />
            <Text style={styles.stateText}>Estimating calories…</Text>
          </View>
        ) : (
          <>
            <View style={styles.mealHead}>
              <View style={styles.mealEmojiWrap}>
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealConf}>Detected · {meal.confidence}% sure</Text>
              </View>
            </View>

            <View style={styles.kcalCard}>
              <View style={styles.kcalRow}>
                <Ionicons name="flame" size={22} color={Colors.orange} />
                <Text style={styles.kcalValue}>{meal.kcal}</Text>
                <Text style={styles.kcalUnit}>kcal</Text>
              </View>
              <View style={styles.macros}>
                {MACROS.map(m => (
                  <View key={m.key} style={styles.macroItem}>
                    <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                    <Text style={styles.macroVal}>{meal[m.key]}g</Text>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.slotLabel}>Add to</Text>
            <View style={styles.slotRow}>
              {SLOTS.map(s => (
                <PressableScale
                  key={s.slot}
                  style={[styles.slotCard, slot === s.slot && styles.slotCardActive]}
                  scaleTo={0.96}
                  onPress={() => { haptic.select(); setSlot(s.slot); }}
                >
                  <Ionicons name={s.icon} size={20} color={slot === s.slot ? Colors.green : Colors.textMuted} />
                  <Text style={[styles.slotText, slot === s.slot && styles.slotTextActive]}>{s.label}</Text>
                </PressableScale>
              ))}
            </View>

            <SafeAreaView edges={['bottom']} style={styles.actions}>
              <PressableScale style={styles.logBtn} scaleTo={0.98} haptic="medium" onPress={handleLog}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.logBtnText}>Log this meal</Text>
              </PressableScale>
            </SafeAreaView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.scanBg },
  bg: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  bgEmoji1: { position: 'absolute', fontSize: 90, opacity: 0.1, top: '18%', left: '14%', transform: [{ rotate: '-12deg' }] },
  bgEmoji2: { position: 'absolute', fontSize: 80, opacity: 0.1, top: '30%', right: '12%', transform: [{ rotate: '15deg' }] },
  headerBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, zIndex: 10 },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    minHeight: height * 0.62,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 8, paddingHorizontal: 22,
  },
  sheetHandle: { width: 36, height: 5, borderRadius: 3, backgroundColor: Colors.separator, alignSelf: 'center', marginBottom: 22 },
  stateWrap: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textMuted },

  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  mealEmojiWrap: {
    width: 58, height: 58, borderRadius: 16, backgroundColor: Colors.orangeLight,
    alignItems: 'center', justifyContent: 'center',
  },
  mealEmoji: { fontSize: 30 },
  mealName: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.textPrimary },
  mealConf: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  kcalCard: {
    backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    padding: 18, marginBottom: 24,
  },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 },
  kcalValue: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: Colors.textPrimary },
  kcalUnit: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textMuted },
  macros: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroVal: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  macroLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },

  slotLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 },
  slotRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  slotCard: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border,
  },
  slotCardActive: { borderColor: Colors.green, backgroundColor: Colors.greenLight },
  slotText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  slotTextActive: { color: Colors.green },

  actions: { paddingTop: 14 },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.green, height: 56, borderRadius: 16,
    shadowColor: Colors.shadowGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 5,
  },
  logBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.white },
});
