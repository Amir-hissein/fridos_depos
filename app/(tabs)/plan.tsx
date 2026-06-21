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
const TRACKER_ICON_COLOR = '#F3E1C7';
import { Colors } from '../../constants/colors';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { useApp } from '../../context/AppContext';
import { usePlan } from '../../context/PlanContext';
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
  icon: MCIName;
  targetKcal: number;
  iconBg: string;
  iconColor: string;
}

const MEALS: MealSlotDef[] = [
  { key: 'breakfast', label: 'Kahvaltı',      icon: 'egg-fried',    targetKcal: 500, iconBg: '#2B2000', iconColor: '#F4B740' },
  { key: 'lunch',     label: 'Öğle',          icon: 'food',         targetKcal: 500, iconBg: '#00172A', iconColor: '#6C9EFF' },
  { key: 'dinner',    label: 'Akşam Yemeği',  icon: 'room-service', targetKcal: 500, iconBg: '#001525', iconColor: '#5BB5FF' },
  { key: 'snack',     label: 'Ara Öğün',      icon: 'cookie',       targetKcal: 193, iconBg: '#1C002E', iconColor: '#C47FFF' },
];

const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
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
  const pct = Math.min(consumed / slot.targetKcal, 1);
  return (
    <PressableScale
      style={[mc.card, active && mc.cardActive, { width: CARD_W }]}
      scaleTo={0.95}
      haptic="light"
      onPress={onPress}
    >
      {/* Icon + label row */}
      <View style={mc.topRow}>
        <View style={[mc.iconBox, { backgroundColor: slot.iconBg }]}>
          <MaterialCommunityIcons name={slot.icon} size={26} color={slot.iconColor} />
        </View>
        <Text style={mc.label} numberOfLines={2}>{slot.label}</Text>
      </View>

      {/* Kcal */}
      <View style={mc.kcalRow}>
        <Text style={mc.kcalNum}>{consumed}</Text>
        <Text style={mc.kcalOf}>/{slot.targetKcal} Kcal</Text>
      </View>

      {/* Progress bar */}
      <View style={mc.bar}>
        {pct > 0 && (
          <View
            style={[
              mc.barFill,
              { width: `${pct * 100}%` as `${number}%` },
              active ? mc.barActive : mc.barDefault,
            ]}
          />
        )}
      </View>
    </PressableScale>
  );
}

const mc = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  cardActive: {
    borderColor: Colors.gold,
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  kcalOf: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    paddingBottom: 2,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barDefault: { backgroundColor: Colors.green },
  barActive:  { backgroundColor: Colors.gold  },
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
  return (
    <PressableScale
      style={[tr.row, !last && tr.border]}
      scaleTo={0.98}
      haptic="light"
      onPress={onPress}
    >
      <View style={tr.iconBox}>
        <MaterialCommunityIcons name={icon} size={26} color={TRACKER_ICON_COLOR} />
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
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </PressableScale>
  );
}

const tr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.gold,
    marginBottom: 3,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bold: {
    fontFamily: 'Inter_700Bold',
    color: Colors.gold,
    fontSize: 12,
  },
});

/* ─── Main screen ─────────────────────────────────────────────── */
export default function PlanScreen() {
  const navigation = useNavigation();
  const { isPremium } = useApp();
  const {
    profile,
    targets,
    intake,
    consumedKcal,
    selectedDayIndex,
    setSelectedDayIndex,
    logMeal,
    addWater,
    updateSteps,
    updateWeight,
  } = usePlan();

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // States for calendar month navigation
  const [currentYearMonth, setCurrentYearMonth] = useState({
    year: 2026,
    month: 5, // June (0-indexed)
  });

  const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 22)); // Default selected date matches screenshot (22 June)

  // Active tracker bottom sheet state ('water' | 'steps' | 'weight' | null)
  const [activeTracker, setActiveTracker] = useState<'water' | 'steps' | 'weight' | null>(null);

  React.useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: (activeTracker !== null || calendarOpen) ? 'none' : 'flex' },
    });
  }, [activeTracker, calendarOpen, navigation]);

  // Temporary control values for bottom sheets
  const [tempWater, setTempWater] = useState(0);
  const [tempSteps, setTempSteps] = useState(0);
  const [tempWeight, setTempWeight] = useState(75.0);

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

  const activeDateStr = `${selectedDate.getDate()} ${TURKISH_MONTHS[selectedDate.getMonth()]}`;

  const calorieGoal = targets.kcal;
  const totalConsumed = consumedKcal;
  const remaining = Math.max(calorieGoal - totalConsumed, 0);

  const consumedProtein = Math.round((totalConsumed * 0.25) / 4);
  const consumedCarbs = Math.round((totalConsumed * 0.50) / 4);
  const consumedFat = Math.round((totalConsumed * 0.25) / 9);

  const waterMl = intake.waterMl;
  const recipes = RECIPES.slice(0, 6);

  /* ── Premium gate ── */
  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <Ionicons name="calendar" size={40} color={Colors.gold} />
          </View>
          <Text style={styles.gateTitle}>Haftalık Yemek Planları</Text>
          <Text style={styles.gateSub}>
            Tüm haftanızı planlayın ve bir daha akşam yemeğinde{'\n'}ne yiyeceğinizi düşünmeyin.
          </Text>
          <PressableScale
            style={styles.gateBtn}
            scaleTo={0.97}
            haptic="medium"
            onPress={() => router.push('/(tabs)/pro')}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.gateBtnTxt}>Premium ile Kilidi Aç</Text>
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
            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <MaterialCommunityIcons
                  name={
                    activeTracker === 'water' ? 'cup-water' :
                    activeTracker === 'steps' ? 'walk' : 'scale-bathroom'
                  }
                  size={24}
                  color="#FFE8D1"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sheetTitle}>
                  {activeTracker === 'water' ? 'Su Takibi' :
                   activeTracker === 'steps' ? 'Adım takibi' : 'Kilo takibi'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveTracker(null)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={styles.sheetDesc}>
              {activeTracker === 'water' && 'Metabolik süreçlerin kusursuz işlemesi için yeterince su tüketmelisin. Belirlenen günlük miktara ulaştığından emin ol.'}
              {activeTracker === 'steps' && 'Günlük hareket miktarını artırmak sağlığın için önemlidir. Hedeflenen adım sayısına ulaşmak için yürümeye devam et.'}
              {activeTracker === 'weight' && 'Hedef kilonuza ulaşmak için kilonuzu düzenli olarak kaydedin. Değişimleri takip ederek motivasyonunuzu koruyun.'}
            </Text>

            {/* Controls Row */}
            <View style={styles.controlRow}>
              {/* Minus Button */}
              <TouchableOpacity
                style={styles.controlBtn}
                activeOpacity={0.8}
                onPress={() => {
                  haptic.light();
                  if (activeTracker === 'water') {
                    setTempWater(w => Math.max(0, w - 250));
                  } else if (activeTracker === 'steps') {
                    setTempSteps(s => Math.max(0, s - 1000));
                  } else {
                    setTempWeight(wt => Math.max(30, wt - 0.1));
                  }
                }}
              >
                <Ionicons name="remove" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Display Value */}
              <Text style={styles.controlValue}>
                {activeTracker === 'water' && `${tempWater}/2500ml`}
                {activeTracker === 'steps' && `${tempSteps}/10.000 adım`}
                {activeTracker === 'weight' && `${tempWeight.toFixed(1)} kg`}
              </Text>

              {/* Plus Button */}
              <TouchableOpacity
                style={[styles.controlBtn, styles.controlBtnAdd]}
                activeOpacity={0.8}
                onPress={() => {
                  haptic.light();
                  if (activeTracker === 'water') {
                    setTempWater(w => w + 250);
                  } else if (activeTracker === 'steps') {
                    setTempSteps(s => s + 1000);
                  } else {
                    setTempWeight(wt => wt + 0.1);
                  }
                }}
              >
                <Ionicons name="add" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Progress Bar / Goal Info */}
            {activeTracker === 'water' && (
              <View style={styles.sheetProgressBarBg}>
                <View style={[styles.sheetProgressBarFill, { width: `${Math.min(tempWater / 2500 * 100, 100)}%` as `${number}%` }]} />
              </View>
            )}

            {activeTracker === 'steps' && (
              <View style={styles.sheetProgressBarBg}>
                <View style={[styles.sheetProgressBarFill, { width: `${Math.min(tempSteps / 10000 * 100, 100)}%` as `${number}%` }]} />
              </View>
            )}

            {activeTracker === 'weight' && (
              <Text style={styles.weightGoalText}>
                Hedefinize <Text style={styles.weightGoalBold}>{Math.max(0, tempWeight - profile.targetWeight).toFixed(1)} kilo</Text> kaldı.
              </Text>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={() => {
                haptic.success();
                if (activeTracker === 'water') {
                  addWater(tempWater - waterMl);
                } else if (activeTracker === 'steps') {
                  updateSteps(tempSteps);
                } else {
                  updateWeight(tempWeight);
                }
                setActiveTracker(null);
              }}
            >
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
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
            <Text style={[styles.greeting, calendarOpen && { opacity: 0 }]}>Merhaba Amir Hissein Abakar</Text>
            
            <PressableScale
              style={[styles.datePill, calendarOpen && { backgroundColor: Colors.surface, borderColor: Colors.gold }]}
              scaleTo={0.95}
              haptic="light"
              onPress={() => {
                haptic.light();
                setCalendarOpen(!calendarOpen);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={calendarOpen ? Colors.gold : Colors.textPrimary} />
              <Text style={[styles.dateStr, calendarOpen && { color: Colors.gold }]}>{activeDateStr}</Text>
              <Ionicons name={calendarOpen ? "chevron-up" : "chevron-down"} size={14} color={calendarOpen ? Colors.gold : Colors.textMuted} />
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
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                    <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.calHeaderTitleWrap}>
                    <Text style={styles.calMonthName}>
                      {TURKISH_MONTHS[currentYearMonth.month]}
                    </Text>
                    <Text style={styles.calYearName}>
                      {currentYearMonth.year}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Days Header */}
                <View style={styles.calDaysHeaderRow}>
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
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

                    return (
                      <TouchableOpacity
                        key={`cell-${idx}`}
                        style={[
                          styles.calCellBtn,
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
                        <Text style={[styles.calCellText, isSelected && styles.calCellTextSelected]}>
                          {cell.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Color Legend */}
                <View style={styles.calLegendRow}>
                  <View style={styles.calLegendItem}>
                    <View style={[styles.calLegendDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.calLegendTxt}>Dolu</Text>
                  </View>
                  <View style={styles.calLegendItem}>
                    <View style={[styles.calLegendDot, { backgroundColor: '#FFB300' }]} />
                    <Text style={styles.calLegendTxt}>Kısmi</Text>
                  </View>
                  <View style={styles.calLegendItem}>
                    <View style={[styles.calLegendDot, { backgroundColor: '#F44336' }]} />
                    <Text style={styles.calLegendTxt}>Fazla</Text>
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
                  <Flame size={17} color={Colors.orange} strokeWidth={2.2} />
                  <Text style={styles.calorieLabel}>Kalori</Text>
                </View>
                {/* big number */}
                <View style={styles.calorieNumRow}>
                  <Text style={styles.calorieNum}>{totalConsumed}</Text>
                  <Text style={styles.calorieGoal}> /{calorieGoal} kcal</Text>
                </View>
                {/* remaining pill */}
                <View style={styles.remainPill}>
                  <Text style={styles.remainTxt}>Kalan: {remaining} kcal</Text>
                </View>
              </View>
              {/* ring */}
              <CalorieRing consumed={totalConsumed} target={calorieGoal} size={90} stroke={8} color={Colors.gold} />
            </View>

            {/* divider + expanded macros */}
            {detailsExpanded && (
              <View style={styles.expandedMacros}>
                <View style={styles.expandedDivider} />
                <View style={styles.macroProgressRow}>
                  <View style={styles.macroProgressInfo}>
                    <Text style={styles.macroProgressLabel}>Karbonhidrat</Text>
                    <Text style={styles.macroProgressValue}>{consumedCarbs} / {targets.carbs}g</Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View style={[styles.macroProgressBarFill, { width: `${Math.min(consumedCarbs / targets.carbs * 100, 100)}%` as `${number}%` }]} />
                  </View>
                </View>

                <View style={styles.macroProgressRow}>
                  <View style={styles.macroProgressInfo}>
                    <Text style={styles.macroProgressLabel}>Protein</Text>
                    <Text style={styles.macroProgressValue}>{consumedProtein} / {targets.protein}g</Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View style={[styles.macroProgressBarFill, { width: `${Math.min(consumedProtein / targets.protein * 100, 100)}%` as `${number}%` }]} />
                  </View>
                </View>

                <View style={styles.macroProgressRow}>
                  <View style={styles.macroProgressInfo}>
                    <Text style={styles.macroProgressLabel}>Yağ</Text>
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
              <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={11} color={Colors.textMuted} />
              <Text style={styles.calorieFooterTxt}>
                {detailsExpanded ? "DETAYLARI GİZLE" : "DETAYLARI GÖR"}
              </Text>
              <Text style={styles.calorieDot}>  •  </Text>
              <Text style={styles.calorieFooterTxt}>Makro Değerleri</Text>
            </PressableScale>
          </View>
        </FadeInItem>

        {/* ══ 3 · MY MEALS ════════════════════════════════════════ */}
        <FadeInItem index={2}>
          <Text style={styles.sectionTitle}>Öğünlerim</Text>
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
              title="Su Takibi"
              subParts={[{ text: `${waterMl} ml` }, { text: ' / 2500 ml.' }]}
              onPress={() => {
                haptic.light();
                setTempWater(waterMl);
                setActiveTracker('water');
              }}
            />
            <Tracker
              icon="walk"
              title="Adım takibi"
              subParts={[{ text: `${intake.steps || 0} adım` }, { text: ' / 10.000 adım.' }]}
              onPress={() => {
                haptic.light();
                setTempSteps(intake.steps || 0);
                setActiveTracker('steps');
              }}
            />
            <Tracker
              icon="scale-bathroom"
              title="Kilo takibi"
              subParts={[
                { text: 'Hedefinize ' },
                { text: `${Math.max(0, intake.weight - profile.targetWeight).toFixed(1)} kilo`, bold: true },
                { text: ' kaldı.' },
              ]}
              onPress={() => {
                haptic.light();
                setTempWeight(intake.weight || profile.weight);
                setActiveTracker('weight');
              }}
              last
            />
          </View>
        </FadeInItem>

        {/* ══ 5 · RECIPES FOR YOU ═════════════════════════════════ */}
        <FadeInItem index={4}>
          <Text style={styles.sectionTitle}>Sana Uygun Tarifler</Text>
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
                      <Text style={{ fontSize: 44 }}>{r.emoji}</Text>
                    </View>
                  )
                }
                {/* info */}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={2}>{r.name}</Text>
                  <View style={styles.recipeMeta}>
                    <Flame size={12} color={Colors.orange} strokeWidth={2.2} />
                    <Text style={styles.recipeMetaTxt}>{r.kcal} kcal</Text>
                    <Clock size={12} color={Colors.textMuted} strokeWidth={2.2} />
                    <Text style={styles.recipeMetaTxt}>{r.time} dk</Text>
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
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
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
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: 10,
    lineHeight: 28,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateStr: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
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
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    zIndex: 100,
    shadowColor: '#000',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calHeaderTitleWrap: {
    alignItems: 'center',
  },
  calMonthName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  calYearName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.textMuted,
    width: '13%',
    textAlign: 'center',
  },
  calDayHeaderTxtWeekend: {
    color: Colors.gold,
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
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calCellBtnSelected: {
    backgroundColor: '#FFE8D1',
  },
  calCellText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  calCellTextSelected: {
    color: '#000',
    fontFamily: 'Poppins_700Bold',
  },
  calLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
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
    color: Colors.textSecondary,
  },

  // Tracker Bottom Sheets Overlay
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheetContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnAdd: {
    backgroundColor: '#2dbbb0',
  },
  controlValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  sheetProgressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 28,
  },
  sheetProgressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#2dbbb0',
  },
  weightGoalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  weightGoalBold: {
    fontFamily: 'Inter_700Bold',
    color: Colors.gold,
  },
  saveBtn: {
    backgroundColor: '#2dbbb0',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#000',
  },

  // Calorie card — single rounded card with divider inside
  calorieWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 28,
    overflow: 'hidden',
  },
  calorieTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
    color: Colors.orange,
  },
  calorieNumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  calorieNum: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 40,
    color: Colors.textPrimary,
    lineHeight: 46,
  },
  calorieGoal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    paddingBottom: 5,
  },
  remainPill: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  remainTxt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  calorieDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
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
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  calorieDot: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textLight,
  },

  // Expanded macros styles
  expandedMacros: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  expandedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
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
    color: Colors.textSecondary,
  },
  macroProgressValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.gold,
  },
  macroProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  macroProgressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },

  // Section title
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  // Meal grid (2 × 2, exact pixel width)
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: 28,
  },

  // Tracker card
  trackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    marginBottom: 28,
    overflow: 'hidden',
  },

  // Recipe cards
  recipesRow: {
    gap: 14,
    paddingBottom: 6,
  },
  recipeCard: {
    width: 186,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  recipeImg: {
    width: '100%',
    height: 130,
  },
  recipeImgFallback: {
    backgroundColor: Colors.backgroundAlt,
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
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  gateTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  gateSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  gateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.green,
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 14,
  },
  gateBtnTxt: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.white,
  },
});
