import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Flame, Clock } from 'lucide-react-native';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
import { Colors, ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { PressableScale } from '../../components/ui/PressableScale';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { InsightCard } from '../../components/ui/InsightCard';
import { progress, computeWeightTrend } from '../../services/summary';
import { buildInsights } from '../../services/insights';
import { haptic } from '../../lib/haptics';
import { useApp } from '../../context/AppContext';
import { useFeedback } from '../../context/FeedbackContext';
import { usePlan } from '../../context/PlanContext';
import { useAllergens } from '../../context/AllergenContext';
import { recommendRecipes } from '../../services/recipeFilters';
import { localizeRecipeName } from '../../services/localizeRecipe';
import { useTranslation } from 'react-i18next';
import { RECIPES } from '../../constants/recipes';
import { CalorieRing } from '../../components/ui/CalorieRing';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD = 20;                              // horizontal padding
const GRID_GAP = 12;                           // gap between meal cards
const CARD_W = (SCREEN_W - H_PAD * 2 - GRID_GAP) / 2;  // exact half

/* ─── Meal definitions ────────────────────────────────────────── */
interface MealSlotDef {
  key: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
  image: any;
  targetKcal: number;
  color: string;
}

// Une couleur d'accent par repas (tokens du thème) — barre + tinte de l'icône.
const MEALS: MealSlotDef[] = [
  { key: 'breakfast', label: 'plan.meals.breakfast', image: require('../../assets/images/breakfast_icon.png'), targetKcal: 500, color: Colors.gold },
  { key: 'lunch',     label: 'plan.meals.lunch',     image: require('../../assets/images/lunch_icon.png'),     targetKcal: 500, color: Colors.green },
  { key: 'dinner',    label: 'plan.meals.dinner',    image: require('../../assets/images/dinner_icon.png'),    targetKcal: 500, color: Colors.blue },
  { key: 'snack',     label: 'plan.meals.snack',     image: require('../../assets/images/snack_icon.png'),     targetKcal: 193, color: Colors.orange },
];

/* ─── Meal card ───────────────────────────────────────────────── */
function MealCard({
  slot,
  consumed,
  active,
  onPress,
}: {
  slot: MealSlotDef;
  consumed: number;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const mc = useThemedStyles(makeMcStyles);
  const pct = Math.min(consumed / slot.targetKcal, 1);
  const mealColor = colors[slot.key === 'breakfast' ? 'gold' : slot.key === 'lunch' ? 'green' : slot.key === 'dinner' ? 'blue' : 'orange'];

  return (
    <PressableScale
      style={[mc.card, active && mc.cardActive, { width: CARD_W }]}
      scaleTo={0.95}
      haptic="light"
      onPress={onPress}
    >
      {/* Icon + label row */}
      <View style={mc.topRow}>
        <View style={[mc.iconBox, { backgroundColor: mealColor + '22' }]}>
          <Image source={slot.image} style={{ width: 28, height: 28, tintColor: mealColor }} resizeMode="contain" />
        </View>
        <Text style={mc.label} numberOfLines={2}>{t(slot.label)}</Text>
      </View>

      {/* Kcal */}
      <View style={mc.kcalRow}>
        <Text style={mc.kcalNum}>{consumed}</Text>
        <Text style={mc.kcalOf}>/{slot.targetKcal} Kcal</Text>
      </View>

      {/* Progress bar — couleur propre au repas */}
      <View style={mc.bar}>
        {pct > 0 && (
          <View
            style={[
              mc.barFill,
              { width: `${pct * 100}%` as `${number}%`, backgroundColor: mealColor },
            ]}
          />
        )}
      </View>
    </PressableScale>
  );
}

const makeMcStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  cardActive: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  kcalNum: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  kcalOf: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    paddingBottom: 2,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separatorLight,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barDefault: { backgroundColor: colors.green },
  barActive:  { backgroundColor: colors.gold  },
});

/* ─── Tracker row ─────────────────────────────────────────────── */
function Tracker({
  icon,
  title,
  subParts,
  last,
  onPress,
}: {
  icon: MCIName;
  title: string;
  subParts: Array<{ text: string; bold?: boolean }>;
  last?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const tr = useThemedStyles(makeTrStyles);

  let iconColor = colors.gold;
  let bg = colors.backgroundAlt;

  if (icon === 'cup-water') {
    iconColor = colors.blue;
    bg = colors.blueLight;
  } else if (icon === 'walk') {
    iconColor = colors.orange;
    bg = colors.orangeLight;
  } else if (icon === 'scale-bathroom') {
    iconColor = colors.green;
    bg = colors.greenLight;
  }

  return (
    <PressableScale
      style={[tr.row, !last && tr.border]}
      scaleTo={0.98}
      haptic="light"
      onPress={onPress}
    >
      <View style={[tr.iconBox, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={26} color={iconColor} />
      </View>
      <View style={tr.body}>
        <Text style={tr.title}>{title}</Text>
        <Text style={tr.sub}>
          {subParts.map((p, i) =>
            p.bold
              ? <Text key={i} style={tr.bold}>{p.text}</Text>
              : <Text key={i}>{p.text}</Text>
          )}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
    </PressableScale>
  );
}

const makeTrStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  bold: {
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    fontSize: 12,
  },
});

/* ─── Main screen ─────────────────────────────────────────────── */
export default function PlanScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const months = t('plan.months', { returnObjects: true }) as string[];
  const weekdays = t('plan.weekdays', { returnObjects: true }) as string[];
  const { isPremium, userName } = useApp();
  const { toast } = useFeedback();
  const { userAllergens } = useAllergens();
  const {
    profile,
    targets,
    intake,
    consumedKcal,
    consumedMacros,
    weeklyIntake,
    selectedDayIndex,
    setSelectedDayIndex,
    logMeal,
    addWater,
    updateSteps,
    updateProfile,
  } = usePlan();

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calendrier : on part toujours de la vraie date du jour (00:00 pour comparer).
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentYearMonth, setCurrentYearMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  // Active tracker bottom sheet state ('water' | 'steps' | 'weight' | null)
  const [activeTracker, setActiveTracker] = useState<'water' | 'steps' | 'weight' | null>(null);

  React.useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: activeTracker !== null ? 'none' : 'flex' },
    });
  }, [activeTracker, navigation]);

  // Temporary control values for bottom sheets
  const [tempWater, setTempWater] = useState(0);
  const [tempSteps, setTempSteps] = useState(0);
  const [tempWeight, setTempWeight] = useState(75.0);

  // Tracker goals come from the profile/targets (not hard-coded).
  const waterGoal = targets.waterMl;
  const stepsGoal = profile.dailySteps;
  const trackerGoal =
    activeTracker === 'water' ? waterGoal :
    activeTracker === 'steps' ? stepsGoal : 0;
  const trackerCurrent =
    activeTracker === 'water' ? tempWater :
    activeTracker === 'steps' ? tempSteps : tempWeight;
  const trackerUnit =
    activeTracker === 'water' ? 'ml' :
    activeTracker === 'steps' ? t('plan.trackers.step') : 'kg';
  const trackerProgress = trackerGoal > 0 ? progress(trackerCurrent, trackerGoal) : null;

  // Dynamic calendar cell generator
  const calendarCells = useMemo(() => {
    const { year, month } = currentYearMonth;
    const firstDay = new Date(year, month, 1);
    
    // Day of week for June 1st (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to: 0 = Monday, ..., 6 = Sunday
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, month, year });
    }
    return cells;
  }, [currentYearMonth]);

  const handlePrevMonth = () => {
    setCurrentYearMonth(prev => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return { year: y, month: m };
    });
  };

  const handleNextMonth = () => {
    setCurrentYearMonth(prev => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      return { year: y, month: m };
    });
  };

  // Statut calorique d'un jour → pilote les pastilles couleur + la légende.
  const STATUS_COLOR = { full: colors.green, partial: colors.gold, over: colors.red } as const;
  const getDayStatus = (
    year: number,
    month: number,
    day: number,
  ): keyof typeof STATUS_COLOR | null => {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    if (cellDate.getTime() > today.getTime()) return null; // pas de suivi pour le futur
    const wd = (cellDate.getDay() + 6) % 7; // 0 = Lun … 6 = Dim
    const di = weeklyIntake[wd];
    if (!di) return null;
    const consumed = di.breakfast + di.lunch + di.dinner + di.snack;
    if (consumed <= 0) return null;
    const target = targets.kcal || 1;
    if (consumed > target) return 'over';
    if (consumed >= target * 0.85) return 'full';
    return 'partial';
  };

  const isCurrentMonth =
    currentYearMonth.month === today.getMonth() &&
    currentYearMonth.year === today.getFullYear();

  const goToToday = () => {
    haptic.light();
    setCurrentYearMonth({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDate(new Date(today));
    setSelectedDayIndex((today.getDay() + 6) % 7);
  };

  const activeDateStr = `${selectedDate.getDate()} ${months[selectedDate.getMonth()]}`;

  const calorieGoal = targets.kcal;
  const totalConsumed = consumedKcal;
  const remaining = Math.max(calorieGoal - totalConsumed, 0);

  // Macros mesurées (scans IA) + estimation diète pour le reste des calories.
  // Centralisé dans PlanContext.consumedMacros.
  const consumedProtein = Math.round(consumedMacros.protein);
  const consumedCarbs = Math.round(consumedMacros.carbs);
  const consumedFat = Math.round(consumedMacros.fat);

  const waterMl = intake.waterMl;
  const recipes = recommendRecipes(RECIPES, { diet: profile.diet, allergens: userAllergens, limit: 6 });

  // Contextual insights — only meaningful for the day actually being lived.
  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);
  const isToday = selectedDayIndex === todayIndex;
  const insights = useMemo(() => {
    if (!isToday) return [];
    const weights = Object.keys(weeklyIntake)
      .sort((a, b) => Number(a) - Number(b))
      .map(k => weeklyIntake[Number(k)]?.weight ?? 0);
    const trend = computeWeightTrend(weights);
    return buildInsights({
      hour: new Date().getHours(),
      consumedKcal: totalConsumed,
      targetKcal: calorieGoal,
      consumedProtein,
      targetProtein: targets.protein,
      waterMl,
      waterGoalMl: waterGoal,
      steps: intake.steps || 0,
      stepsGoal,
      meals: {
        breakfast: intake.breakfast,
        lunch: intake.lunch,
        dinner: intake.dinner,
        snack: intake.snack,
      },
      weightDeltaKg: trend.delta,
    }).slice(0, 2);
  }, [isToday, weeklyIntake, totalConsumed, calorieGoal, consumedProtein, targets.protein, waterMl, waterGoal, intake, stepsGoal]);

  /* ── Premium gate ── */
  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <Ionicons name="calendar" size={40} color={colors.gold} />
          </View>
          <Text style={styles.gateTitle}>{t('plan.gate.title')}</Text>
          <Text style={styles.gateSub}>{t('plan.gate.subtitle')}</Text>
          <PressableScale
            style={styles.gateBtn}
            scaleTo={0.97}
            haptic="medium"
            onPress={() => router.push('/(tabs)/pro')}
          >
            <Ionicons name="star" size={16} color={colors.textWhite} />
            <Text style={styles.gateBtnTxt}>{t('plan.gate.unlock')}</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      
      {/* ══ TRACKER BOTTOM SHEETS OVERLAYS ══════════════════════ */}
      {activeTracker !== null && (
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveTracker(null)}
          />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <MaterialCommunityIcons
                  name={
                    activeTracker === 'water' ? 'cup-water' :
                    activeTracker === 'steps' ? 'walk' : 'scale-bathroom'
                  }
                  size={22}
                  color={colors.beige}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sheetTitle}>
                  {activeTracker === 'water' ? t('plan.trackers.water') :
                   activeTracker === 'steps' ? t('plan.trackers.steps') : t('plan.trackers.weight')}
                </Text>
              </View>
              <PressableScale haptic="light" onPress={() => setActiveTracker(null)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </PressableScale>
            </View>

            {/* Description */}
            <Text style={styles.sheetDesc}>
              {activeTracker === 'water' && t('plan.trackers.waterDesc')}
              {activeTracker === 'steps' && t('plan.trackers.stepsDesc')}
              {activeTracker === 'weight' && t('plan.trackers.weightDesc')}
            </Text>

            {/* Controls Row */}
            <View style={styles.controlRow}>
              <PressableScale haptic="light"
                style={styles.controlBtn}
                onPress={() => {
                  haptic.light();
                  if (activeTracker === 'water') setTempWater(w => Math.max(0, w - 250));
                  else if (activeTracker === 'steps') setTempSteps(s => Math.max(0, s - 1000));
                  else setTempWeight(wt => Math.max(30, +(wt - 0.1).toFixed(1)));
                }}
              >
                <Ionicons name="remove" size={22} color={colors.textWhite} />
              </PressableScale>

              <View style={styles.controlValueWrap}>
                <Text style={styles.controlValue}>
                  {activeTracker === 'weight' ? tempWeight.toFixed(1) : trackerCurrent}
                  <Text style={styles.controlUnit}> {trackerUnit}</Text>
                </Text>
                {trackerGoal > 0 && (
                  <Text style={styles.controlGoal}>/ {trackerGoal} {trackerUnit}</Text>
                )}
              </View>

              <PressableScale haptic="light"
                style={[styles.controlBtn, styles.controlBtnAdd]}
                onPress={() => {
                  haptic.light();
                  if (activeTracker === 'water') setTempWater(w => w + 250);
                  else if (activeTracker === 'steps') setTempSteps(s => s + 1000);
                  else setTempWeight(wt => +(wt + 0.1).toFixed(1));
                }}
              >
                <Ionicons name="add" size={22} color={colors.textWhite} />
              </PressableScale>
            </View>

            {/* Progress / Goal */}
            {trackerProgress ? (
              <View style={styles.sheetProgressWrap}>
                <ProgressBar progress={trackerProgress.ratio} />
                <Text style={styles.sheetProgressLabel}>
                  {t('plan.trackers.remainingGoal', { percent: trackerProgress.percent, remaining: trackerProgress.remaining, unit: trackerUnit })}
                </Text>
              </View>
            ) : (
              <Text style={styles.weightGoalText}>
                {t('plan.trackers.weightToGo', { kg: Math.max(0, tempWeight - profile.targetWeight).toFixed(1) })}
              </Text>
            )}

            {/* Save Button */}
            <PressableScale haptic="light"
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={() => {
                haptic.success();
                if (activeTracker === 'water') {
                  const delta = tempWater - waterMl;
                  addWater(delta);
                  if (tempWater >= waterGoal) {
                    toast(t('feedback.water.goalReached'));
                  } else if (delta !== 0) {
                    toast(
                      t(delta > 0 ? 'feedback.water.added' : 'feedback.water.removed', {
                        ml: Math.abs(delta),
                        total: tempWater,
                        goal: waterGoal,
                      }),
                    );
                  }
                } else if (activeTracker === 'steps') {
                  updateSteps(tempSteps);
                  toast(
                    tempSteps >= stepsGoal
                      ? t('feedback.steps.goalReached')
                      : t('feedback.steps.saved', { steps: tempSteps }),
                  );
                } else {
                  updateProfile({ weight: tempWeight });
                  toast(t('feedback.weight.saved', { weight: tempWeight.toFixed(1) }));
                }
                setActiveTracker(null);
              }}
            >
              <Text style={styles.saveBtnText}>{t('plan.trackers.save')}</Text>
            </PressableScale>
          </View>
        </View>
      )}

      {/* ══ MAIN SCROLLABLE CONTENT ═════════════════════════════ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!calendarOpen && activeTracker === null}
      >
        {/* ══ 1 · HEADER & CALENDAR ═══════════════════════════════ */}
        <View style={{ zIndex: 100 }}>
          <View style={[styles.header, { zIndex: 105 }]}>
            <Text style={[styles.greeting, calendarOpen && { opacity: 0 }]}>{t('plan.greeting', { name: userName ? userName.split(' ')[0] : '' })}</Text>
            
            <PressableScale
              style={[styles.datePill, calendarOpen && { backgroundColor: colors.surface, borderColor: colors.gold }]}
              scaleTo={0.95}
              haptic="light"
              onPress={() => {
                haptic.light();
                setCalendarOpen(!calendarOpen);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={calendarOpen ? colors.gold : colors.textPrimary} />
              <Text style={[styles.dateStr, calendarOpen && { color: colors.gold }]}>{activeDateStr}</Text>
              <Ionicons name={calendarOpen ? "chevron-up" : "chevron-down"} size={14} color={calendarOpen ? colors.gold : colors.textMuted} />
            </PressableScale>
          </View>

          {/* ══ DROPDOWN CALENDAR OVERLAY ═══════════════════════════ */}
          {calendarOpen && (
            <>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: -1000, bottom: -1000, left: -1000, right: -1000,
                  backgroundColor: 'transparent',
                  zIndex: 90,
                }}
                activeOpacity={1}
                onPress={() => setCalendarOpen(false)}
              />
              <View style={[styles.calendarDropdownCard, { top: 50, left: 0, right: 0, zIndex: 110 }]}>
                {/* Nav Row */}
                <View style={styles.calNavRow}>
                  <PressableScale haptic="light" onPress={handlePrevMonth} style={styles.calNavBtn}>
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                  </PressableScale>
                  <View style={styles.calHeaderTitleWrap}>
                    <Text style={styles.calMonthName}>
                      {months[currentYearMonth.month]}
                    </Text>
                    <Text style={styles.calYearName}>
                      {currentYearMonth.year}
                    </Text>
                  </View>
                  <PressableScale haptic="light" onPress={handleNextMonth} style={styles.calNavBtn}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
                  </PressableScale>
                </View>

                {/* Days Header */}
                <View style={styles.calDaysHeaderRow}>
                  {weekdays.map((day, i) => (
                    <Text key={day} style={[styles.calDayHeaderTxt, (i === 5 || i === 6) && styles.calDayHeaderTxtWeekend]}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Cells Grid */}
                <View style={styles.calGrid}>
                  {calendarCells.map((cell, idx) => {
                    if (!cell) {
                      return <View key={`empty-${idx}`} style={styles.calCellEmpty} />;
                    }

                    const isSelected =
                      selectedDate.getDate() === cell.day &&
                      selectedDate.getMonth() === cell.month &&
                      selectedDate.getFullYear() === cell.year;
                    const isToday =
                      today.getDate() === cell.day &&
                      today.getMonth() === cell.month &&
                      today.getFullYear() === cell.year;
                    const cellDate = new Date(cell.year, cell.month, cell.day);
                    cellDate.setHours(0, 0, 0, 0);
                    const isFuture = cellDate.getTime() > today.getTime();
                    const status = getDayStatus(cell.year, cell.month, cell.day);

                    return (
                      <PressableScale haptic="light"
                        key={`cell-${idx}`}
                        style={[
                          styles.calCellBtn,
                          isToday && !isSelected && styles.calCellBtnToday,
                          isSelected && styles.calCellBtnSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          haptic.select();
                          const dateObj = new Date(cell.year, cell.month, cell.day);
                          setSelectedDate(dateObj);
                          // Sync selectedDayIndex for intake loading (0-6)
                          const dayOfWeek = (dateObj.getDay() + 6) % 7;
                          setSelectedDayIndex(dayOfWeek);
                          setCalendarOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.calCellText,
                            isFuture && styles.calCellTextFuture,
                            isToday && !isSelected && styles.calCellTextToday,
                            isSelected && styles.calCellTextSelected,
                          ]}
                        >
                          {cell.day}
                        </Text>
                        {status && (
                          <View
                            style={[
                              styles.calCellDot,
                              { backgroundColor: isSelected ? colors.backgroundDarkCard : STATUS_COLOR[status] },
                            ]}
                          />
                        )}
                      </PressableScale>
                    );
                  })}
                </View>

                {/* Retour à aujourd'hui (si on a navigué ailleurs) */}
                {!isCurrentMonth && (
                  <PressableScale haptic="light" style={styles.calTodayBtn} onPress={goToToday}>
                    <Ionicons name="today-outline" size={14} color={colors.gold} />
                    <Text style={styles.calTodayBtnTxt}>{t('plan.today')}</Text>
                  </PressableScale>
                )}

                {/* Color Legend */}
                <View style={styles.calLegendRow}>
                  <View style={styles.calLegendItem}>
                    <View style={[styles.calLegendDot, { backgroundColor: colors.green }]} />
                    <Text style={styles.calLegendTxt}>{t('plan.legendFull')}</Text>
                  </View>
                  <View style={styles.calLegendItem}>
                    <View style={[styles.calLegendDot, { backgroundColor: colors.gold }]} />
                    <Text style={styles.calLegendTxt}>{t('plan.legendPartial')}</Text>
                  </View>
                  <View style={styles.calLegendItem}>
                    <View style={[styles.calLegendDot, { backgroundColor: colors.red }]} />
                    <Text style={styles.calLegendTxt}>{t('plan.legendOver')}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ══ 2 · CALORIE CARD ════════════════════════════════════ */}
        <FadeInItem index={1}>
          <View style={styles.calorieWrap}>
            {/* top section */}
            <View style={styles.calorieTop}>
              <View style={styles.calorieLeft}>
                {/* orange label row */}
                <View style={styles.calorieLabelRow}>
                  <Flame size={17} color={colors.orange} strokeWidth={2.2} />
                  <Text style={styles.calorieLabel}>{t('plan.calorie')}</Text>
                </View>
                {/* big number */}
                <View style={styles.calorieNumRow}>
                  <Text style={styles.calorieNum}>{totalConsumed}</Text>
                  <Text style={styles.calorieGoal}> /{calorieGoal} kcal</Text>
                </View>
                {/* remaining pill */}
                <View style={styles.remainPill}>
                  <Text style={styles.remainTxt}>{t('plan.remaining', { n: remaining })}</Text>
                </View>
              </View>
              {/* ring */}
              <CalorieRing consumed={totalConsumed} target={calorieGoal} size={90} stroke={8} />
            </View>

            {/* divider + expanded macros */}
            {detailsExpanded && (
              <View style={styles.expandedMacros}>
                <View style={styles.expandedDivider} />
                <View style={styles.macroProgressRow}>
                  <View style={styles.macroProgressInfo}>
                    <Text style={styles.macroProgressLabel}>{t('plan.carbs')}</Text>
                    <Text style={styles.macroProgressValue}>{consumedCarbs} / {targets.carbs}g</Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View style={[styles.macroProgressBarFill, { width: `${Math.min(consumedCarbs / targets.carbs * 100, 100)}%` as `${number}%` }]} />
                  </View>
                </View>

                <View style={styles.macroProgressRow}>
                  <View style={styles.macroProgressInfo}>
                    <Text style={styles.macroProgressLabel}>{t('plan.protein')}</Text>
                    <Text style={styles.macroProgressValue}>{consumedProtein} / {targets.protein}g</Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View style={[styles.macroProgressBarFill, { width: `${Math.min(consumedProtein / targets.protein * 100, 100)}%` as `${number}%` }]} />
                  </View>
                </View>

                <View style={styles.macroProgressRow}>
                  <View style={styles.macroProgressInfo}>
                    <Text style={styles.macroProgressLabel}>{t('plan.fat')}</Text>
                    <Text style={styles.macroProgressValue}>{consumedFat} / {targets.fat}g</Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View style={[styles.macroProgressBarFill, { width: `${Math.min(consumedFat / targets.fat * 100, 100)}%` as `${number}%` }]} />
                  </View>
                </View>
              </View>
            )}

            {/* divider + footer */}
            <View style={styles.calorieDivider} />
            <PressableScale
              style={styles.calorieFooter}
              scaleTo={0.97}
              haptic="light"
              onPress={() => {
                haptic.light();
                setDetailsExpanded(!detailsExpanded);
              }}
            >
              <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={11} color={colors.textMuted} />
              <Text style={styles.calorieFooterTxt}>
                {detailsExpanded ? t('plan.hideDetails') : t('plan.showDetails')}
              </Text>
              <Text style={styles.calorieDot}>  •  </Text>
              <Text style={styles.calorieFooterTxt}>{t('plan.macroValues')}</Text>
            </PressableScale>
          </View>
        </FadeInItem>

        {/* ══ 2.5 · INSIGHTS ══════════════════════════════════════ */}
        {insights.length > 0 && (
          <FadeInItem index={2}>
            <Text style={styles.sectionTitle}>{t('insights.title')}</Text>
            <View style={styles.insightsWrap}>
              {insights.map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          </FadeInItem>
        )}

        {/* ══ 3 · MY MEALS ════════════════════════════════════════ */}
        <FadeInItem index={2}>
          <Text style={styles.sectionTitle}>{t('plan.myMeals')}</Text>
          <View style={styles.mealGrid}>
            {MEALS.map(slot => (
              <MealCard
                key={slot.key}
                slot={slot}
                consumed={intake[slot.key] ?? 0}
                active={false}
                onPress={() => {
                  haptic.select();
                  router.push(`/meal-detail?meal=${slot.key}`);
                }}
              />
            ))}
          </View>
        </FadeInItem>

        {/* ══ 4 · TRACKERS ════════════════════════════════════════ */}
        <FadeInItem index={3}>
          <View style={styles.trackCard}>
            <Tracker
              icon="cup-water"
              title={t('plan.trackers.water')}
              subParts={[{ text: `${waterMl} ml`, bold: true }, { text: ` / ${waterGoal} ml.` }]}
              onPress={() => {
                haptic.light();
                setTempWater(waterMl);
                setActiveTracker('water');
              }}
            />
            <Tracker
              icon="walk"
              title={t('plan.trackers.steps')}
              subParts={[{ text: `${intake.steps || 0} ${t('plan.trackers.step')}`, bold: true }, { text: ` / ${stepsGoal} ${t('plan.trackers.step')}.` }]}
              onPress={() => {
                haptic.light();
                setTempSteps(intake.steps || 0);
                setActiveTracker('steps');
              }}
            />
            <Tracker
              icon="scale-bathroom"
              title={t('plan.trackers.weight')}
              subParts={[
                { text: t('plan.trackers.weightToGo', { kg: Math.max(0, profile.weight - profile.targetWeight).toFixed(1) }), bold: true },
              ]}
              onPress={() => {
                haptic.light();
                setTempWeight(profile.weight);
                setActiveTracker('weight');
              }}
              last
            />
          </View>
        </FadeInItem>

        {/* ══ 5 · RECIPES FOR YOU ═════════════════════════════════ */}
        <FadeInItem index={4}>
          <Text style={styles.sectionTitle}>{t('plan.forYou')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesRow}
          >
            {recipes.map(r => (
              <PressableScale
                key={r.id}
                style={styles.recipeCard}
                scaleTo={0.96}
                haptic="light"
                onPress={() => router.push(`/recipe/${r.id}`)}
              >
                {/* photo */}
                {r.image
                  ? <Image source={{ uri: r.image }} style={styles.recipeImg} resizeMode="cover" />
                  : (
                    <View style={[styles.recipeImg, styles.recipeImgFallback]}>
                      <Text style={{ fontSize: 38 }}>{r.emoji}</Text>
                    </View>
                  )
                }
                {/* info */}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={2}>{localizeRecipeName(r, t)}</Text>
                  <View style={styles.recipeMeta}>
                    <Flame size={12} color={colors.orange} strokeWidth={2.2} />
                    <Text style={styles.recipeMetaTxt}>{r.kcal} kcal</Text>
                    <Clock size={12} color={colors.textMuted} strokeWidth={2.2} />
                    <Text style={styles.recipeMetaTxt}>{r.time} {t('plan.min')}</Text>
                  </View>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </FadeInItem>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 120 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 10,
    lineHeight: 28,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateStr: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Calendar Dropdown Overlay
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
  calendarDropdownCard: {
    position: 'absolute',
    top: 70, // right below the header
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    zIndex: 100,
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  calNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calHeaderTitleWrap: {
    alignItems: 'center',
  },
  calMonthName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  calYearName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -2,
  },
  calDaysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calDayHeaderTxt: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    width: '13%',
    textAlign: 'center',
  },
  calDayHeaderTxtWeekend: {
    color: colors.gold,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 18,
  },
  calCellEmpty: {
    width: '13%',
    aspectRatio: 1,
  },
  calCellBtn: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calCellBtnSelected: {
    backgroundColor: colors.orangeLight,
  },
  calCellBtnToday: {
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  calCellText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  calCellTextSelected: {
    color: colors.backgroundDarkCard,
    fontFamily: 'Poppins_700Bold',
  },
  calCellTextToday: {
    color: colors.gold,
  },
  calCellTextFuture: {
    color: colors.textLight,
  },
  calCellDot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  calTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: colors.goldLight,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 14,
  },
  calTodayBtnTxt: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.gold,
  },
  calLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    paddingTop: 14,
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calLegendTxt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Tracker Bottom Sheets Overlay
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.separatorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnAdd: {
    backgroundColor: colors.green,
  },
  controlValueWrap: {
    flex: 1,
    alignItems: 'center',
  },
  controlValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 30,
    color: colors.textPrimary,
  },
  controlUnit: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textSecondary,
  },
  controlGoal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    marginBottom: 16,
  },
  sheetProgressWrap: {
    gap: 8,
    marginBottom: 24,
  },
  sheetProgressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sheetProgressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.separatorLight,
    overflow: 'hidden',
    marginBottom: 22,
  },
  sheetProgressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  weightGoalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  weightGoalBold: {
    fontFamily: 'Inter_700Bold',
    color: colors.gold,
  },
  saveBtn: {
    backgroundColor: colors.green,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.backgroundDarkCard,
  },

  // Calorie card — single rounded card with divider inside
  calorieWrap: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 22,
    overflow: 'hidden',
  },
  calorieTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  calorieLeft: { flex: 1, paddingRight: 16 },
  calorieLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  calorieLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.orange,
  },
  calorieNumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  calorieNum: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 30,
    color: colors.textPrimary,
    lineHeight: 46,
  },
  calorieGoal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    paddingBottom: 5,
  },
  remainPill: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  remainTxt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  calorieDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginHorizontal: 20,
  },
  calorieFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  calorieFooterTxt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  calorieDot: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textLight,
  },

  // Expanded macros styles
  expandedMacros: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  expandedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginBottom: 4,
  },
  macroProgressRow: {
    gap: 6,
  },
  macroProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroProgressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  macroProgressValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.gold,
  },
  macroProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.separatorLight,
    overflow: 'hidden',
  },
  macroProgressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.gold,
  },

  // Section title
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 14,
  },

  // Insights
  insightsWrap: {
    gap: 10,
    marginBottom: 22,
  },

  // Meal grid (2 × 2, exact pixel width)
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: 22,
  },

  // Tracker card
  trackCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    marginBottom: 22,
    overflow: 'hidden',
  },

  // Recipe cards
  recipesRow: {
    gap: 14,
    paddingBottom: 6,
  },
  recipeCard: {
    width: 186,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  recipeImg: {
    width: '100%',
    height: 130,
  },
  recipeImgFallback: {
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    padding: 12,
    gap: 6,
  },
  recipeName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaTxt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 6,
  },

  // Premium gate
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  gateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  gateTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  gateSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  gateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 14,
  },
  gateBtnTxt: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.white,
  },
});
