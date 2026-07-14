import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { ThemeColors } from '../../constants/colors';
import { elevation } from '../../constants/layout';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from '../../components/ui/PressableScale';
import { ScanAnalyzingLoader, MEAL_ICONS } from '../../components/ui/ScanAnalyzingLoader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { haptic } from '../../lib/haptics';
import { detectMeal, scaleMeal, DetectedMeal, NutriScore } from '../../services/vision';
import { macroSplit } from '../../services/nutrition';
import { usePlan, MealSlot } from '../../context/PlanContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTranslation } from 'react-i18next';

const SLOTS: { slot: MealSlot; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { slot: 'breakfast', icon: 'sunny-outline' },
  { slot: 'lunch', icon: 'restaurant-outline' },
  { slot: 'dinner', icon: 'moon-outline' },
  { slot: 'snack', icon: 'cafe-outline' },
];

const NUTRI_VARIANT: Record<NutriScore, React.ComponentProps<typeof Badge>['variant']> = {
  A: 'green',
  B: 'green',
  C: 'gold',
  D: 'orange',
  E: 'red',
};

export default function MealResultScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const MACROS = [
    { key: 'protein', color: colors.protein },
    { key: 'carbs', color: colors.carbs },
    { key: 'fat', color: colors.fat },
  ] as const;
  const { uri, slot: slotParam } = useLocalSearchParams<{ uri?: string; slot?: string }>();
  const insets = useSafeAreaInsets();
  const { logMeal } = usePlan();
  const { toast } = useFeedback();
  const { t } = useTranslation();
  const [meal, setMeal] = useState<DetectedMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [slot, setSlot] = useState<MealSlot>((slotParam as MealSlot) || 'lunch');
  const [portion, setPortion] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setMeal(await detectMeal(uri));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [uri]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const m = await detectMeal(uri);
        if (active) setMeal(m);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [uri]);

  // The AI estimate (1×) scaled to the chosen portion — one source of truth.
  const scaled = useMemo(() => (meal ? scaleMeal(meal, portion) : null), [meal, portion]);
  const split = useMemo(
    () =>
      scaled
        ? macroSplit({
            kcal: scaled.kcal,
            protein: scaled.protein,
            carbs: scaled.carbs,
            fat: scaled.fat,
          })
        : null,
    [scaled],
  );

  const handleLog = () => {
    if (!scaled) return;
    haptic.success();
    // Feed the real measured macros into the calorie tracker, not just kcal.
    logMeal(slot, scaled.kcal, {
      kcal: scaled.kcal,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
    });
    toast(t('feedback.meal.logged', { meal: t(`plan.meals.${slot}`), kcal: scaled.kcal }));
    router.replace('/(tabs)/plan');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <PressableScale
        haptic="light"
        style={styles.closeBtn}
        onPress={() => router.replace('/(tabs)/plan')}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={22} color={colors.textPrimary} />
      </PressableScale>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ScanAnalyzingLoader pool={MEAL_ICONS} />
          <Text style={styles.loadingTitle}>{t('scan.mealResult.loadingTitle')}</Text>
          <Text style={styles.stateText}>{t('scan.mealResult.loadingText')}</Text>
        </View>
      ) : error || !meal || !scaled || !split ? (
        <View style={styles.stateWrap}>
          <Ionicons name="cloud-offline-outline" size={42} color={colors.textMuted} />
          <Text style={styles.errorTitle}>{t('scan.mealResult.errorTitle')}</Text>
          <Text style={styles.stateText}>{t('scan.mealResult.errorText')}</Text>
          <PressableScale haptic="light" style={styles.retryBtn} onPress={load}>
            <Ionicons name="refresh" size={16} color={colors.green} />
            <Text style={styles.retryText}>{t('scan.mealResult.retry')}</Text>
          </PressableScale>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {uri ? <Image source={{ uri }} style={styles.photoBanner} resizeMode="cover" /> : null}
            <FadeInItem index={0} style={styles.mealHead}>
              <View style={styles.mealEmojiWrap}>
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>
                  {t(
                    `scan.mealResult.meals.${meal.name.toLowerCase().replace(/ /g, '_')}`,
                    meal.name,
                  )}
                </Text>
                <View style={styles.mealConfRow}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.green} />
                  <Text style={styles.mealConf}>
                    {t('scan.mealResult.detected')} ·{' '}
                    {t('scan.mealResult.confidence', { confidence: meal.confidence })}
                  </Text>
                </View>
              </View>
              <Badge
                label={`${t('scan.mealResult.nutriScore')} ${meal.nutriScore}`}
                variant={NUTRI_VARIANT[meal.nutriScore]}
              />
            </FadeInItem>

            {/* Health tip tied to the Nutri-Score */}
            <FadeInItem index={1} style={styles.tipRow}>
              <Ionicons name="sparkles" size={15} color={colors.green} />
              <Text style={styles.tipText}>
                {t(`scan.mealResult.nutriTips.${meal.nutriScore}`)}
              </Text>
            </FadeInItem>

            {/* Calories + portion */}
            <FadeInItem index={2} style={styles.kcalCard}>
              <View style={styles.kcalRow}>
                <Ionicons name="flame" size={22} color={colors.calorie} />
                <Text style={styles.kcalValue}>{scaled.kcal}</Text>
                <Text style={styles.kcalUnit}>kcal</Text>
              </View>

              <View style={styles.portionRow}>
                <Text style={styles.portionLabel}>{t('scan.mealResult.portion')}</Text>
                <Text style={styles.portionValue}>{portion.toFixed(1)}×</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2}
                step={0.1}
                value={portion}
                onValueChange={setPortion}
                onSlidingComplete={() => haptic.select()}
                minimumTrackTintColor={colors.orange}
                maximumTrackTintColor={colors.separator}
                thumbTintColor={colors.orange}
              />
            </FadeInItem>

            {/* Macros */}
            <FadeInItem index={3} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('scan.mealResult.macrosTitle')}</Text>
              {MACROS.map((m) => {
                const grams = scaled[m.key];
                const pct = split[m.key];
                return (
                  <View key={m.key} style={styles.macroRow}>
                    <View style={styles.macroTop}>
                      <Text style={styles.macroLabel}>{t(`plan.${m.key}`)}</Text>
                      <Text style={styles.macroVal}>
                        {grams}g <Text style={styles.macroPct}>· {pct}%</Text>
                      </Text>
                    </View>
                    <ProgressBar progress={pct / 100} color={m.color} height={8} />
                  </View>
                );
              })}

              <View style={styles.microRow}>
                <View style={styles.microItem}>
                  <Ionicons name="leaf-outline" size={16} color={colors.green} />
                  <Text style={styles.microLabel}>{t('scan.mealResult.fiber')}</Text>
                  <Text style={styles.microVal}>{scaled.fiber}g</Text>
                </View>
                <View style={styles.microDivider} />
                <View style={styles.microItem}>
                  <Ionicons name="cube-outline" size={16} color={colors.gold} />
                  <Text style={styles.microLabel}>{t('scan.mealResult.sugar')}</Text>
                  <Text style={styles.microVal}>{scaled.sugar}g</Text>
                </View>
              </View>
            </FadeInItem>

            {/* Breakdown */}
            <FadeInItem index={4} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('scan.mealResult.breakdown')}</Text>
              {scaled.items.map((it) => (
                <View key={it.id} style={styles.itemRow}>
                  <Text style={styles.itemEmoji}>{it.emoji}</Text>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {t(`scan.mealResult.items.${it.key}`, it.name)}
                  </Text>
                  <Text style={styles.itemGrams}>{it.grams}g</Text>
                  <Text style={styles.itemKcal}>{it.kcal} kcal</Text>
                </View>
              ))}
            </FadeInItem>

            {/* Slot picker */}
            <FadeInItem index={5} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('scan.mealResult.addTo')}</Text>
              <View style={styles.slotRow}>
                {SLOTS.map((s) => (
                  <PressableScale
                    key={s.slot}
                    style={[styles.slotCard, slot === s.slot && styles.slotCardActive]}
                    scaleTo={0.96}
                    onPress={() => {
                      haptic.select();
                      setSlot(s.slot);
                    }}
                  >
                    <Ionicons
                      name={s.icon}
                      size={20}
                      color={slot === s.slot ? colors.green : colors.textMuted}
                    />
                    <Text style={[styles.slotText, slot === s.slot && styles.slotTextActive]}>
                      {t(`plan.meals.${s.slot}`)}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </FadeInItem>
          </ScrollView>

          <FadeInItem
            index={4}
            direction="none"
            style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <Button
              variant="primary"
              icon={<Ionicons name="checkmark-circle" size={20} color={colors.white} />}
              label={`${t('scan.mealResult.logBtn')} · ${scaled.kcal} kcal`}
              onPress={handleLog}
            />
          </FadeInItem>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    closeBtn: {
      ...elevation(colors, 1),
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 20,
      marginBottom: 6,
    },

    photoBanner: {
      width: '100%',
      height: 190,
      borderRadius: 20,
      marginBottom: 18,
      backgroundColor: colors.surface,
    },
    scrollContent: { paddingHorizontal: 22, paddingBottom: 12 },
    stateWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 32,
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    loadingTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 17,
      color: colors.textPrimary,
      marginTop: 24,
      marginBottom: 6,
    },
    stateText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    errorTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 18,
      color: colors.textPrimary,
      marginTop: 4,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.greenLight,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 100,
      marginTop: 8,
    },
    retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.green },

    mealHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    mealEmojiWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.orangeLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mealEmoji: { fontSize: 30 },
    mealName: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: colors.textPrimary },
    mealConfRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    mealConf: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textMuted },

    tipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.greenLight,
      borderRadius: 14,
      paddingVertical: 11,
      paddingHorizontal: 14,
      marginBottom: 20,
    },
    tipText: {
      flex: 1,
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: colors.green,
      lineHeight: 18,
    },

    kcalCard: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 22,
    },
    kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    kcalValue: { fontFamily: 'Poppins_700Bold', fontSize: 30, color: colors.textPrimary },
    kcalUnit: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textMuted },
    portionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
    },
    portionLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    portionValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.orange },
    slider: { width: '100%', height: 32 },

    section: { marginBottom: 22 },
    sectionTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 14,
    },

    macroRow: { marginBottom: 14 },
    macroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    macroLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary },
    macroVal: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.textPrimary },
    macroPct: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },

    microRow: {
      ...elevation(colors, 1),
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 12,
      marginTop: 4,
    },
    microItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    microDivider: { width: StyleSheet.hairlineWidth, height: 20, backgroundColor: colors.border },
    microLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary },
    microVal: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.textPrimary },

    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separatorLight,
    },
    itemEmoji: { fontSize: 22 },
    itemName: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textPrimary },
    itemGrams: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: colors.textMuted,
      minWidth: 44,
      textAlign: 'right',
    },
    itemKcal: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 13,
      color: colors.textSecondary,
      minWidth: 64,
      textAlign: 'right',
    },

    slotRow: { flexDirection: 'row', gap: 10 },
    slotCard: {
      ...elevation(colors, 1),
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
    },
    slotCardActive: { borderColor: colors.green, backgroundColor: colors.greenLight },
    slotText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textSecondary },
    slotTextActive: { color: colors.green },

    actions: { paddingTop: 10, paddingHorizontal: 22 },
  });
