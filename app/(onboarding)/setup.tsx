import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { usePlan } from '../../context/PlanContext';
import { useAllergens } from '../../context/AllergenContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTranslation } from 'react-i18next';
import {
  Sex,
  Activity,
  GoalPace,
  DietPref,
  UserProfile,
  computeTargets,
  weeksToGoal,
} from '../../services/plan';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const LAST_STEP = 7;
const ALLERGEN_STEP = 6;
// Progression continue depuis l'écran de transfert : celui-ci occupe le 1er segment,
// donc le questionnaire affiche 8 segments et démarre décalé d'un cran.
const TOTAL_STEPS = LAST_STEP + 1;
const KG_TO_LB = 2.20462;

/** Allergènes proposés en onboarding (libellés TR) → id de l'AllergenContext. */
const ONBOARDING_ALLERGENS: { id: string; label: string; icon: IconName }[] = [
  { id: 'tree_nuts', label: 'setup.allergens.tree_nuts', icon: 'peanut-outline' },
  { id: 'gluten',    label: 'setup.allergens.gluten',    icon: 'barley' },
  { id: 'dairy',     label: 'setup.allergens.dairy',     icon: 'cheese' },
  { id: 'soy',       label: 'setup.allergens.soy',       icon: 'soy-sauce' },
  { id: 'peanut',    label: 'setup.allergens.peanut',    icon: 'peanut' },
  { id: 'egg',       label: 'setup.allergens.egg',       icon: 'egg-outline' },
  { id: 'fish',      label: 'setup.allergens.fish',      icon: 'fish' },
];

const ACTIVITIES: { key: Activity; label: string; desc: string; icon: IconName }[] = [
  { key: 'sedentary', label: 'setup.activities.sedentary.label', desc: 'setup.activities.sedentary.desc', icon: 'monitor' },
  { key: 'active', label: 'setup.activities.active.label', desc: 'setup.activities.active.desc', icon: 'arm-flex' },
  { key: 'cardio', label: 'setup.activities.cardio.label', desc: 'setup.activities.cardio.desc', icon: 'heart-pulse' },
];

const DIETS: { key: string; label: string; icon: IconName }[] = [
  { key: 'healthy', label: 'setup.diets.healthy', icon: 'heart-plus-outline' },
  { key: 'keto', label: 'setup.diets.keto', icon: 'food-drumstick' },
  { key: 'vegan', label: 'setup.diets.vegan', icon: 'sprout' },
  { key: 'glutenfree', label: 'setup.diets.glutenfree', icon: 'barley-off' },
  { key: 'vegetarian', label: 'setup.diets.vegetarian', icon: 'leaf' },
];

// 🐢 slow → easy/left … 🦘 fast → hard/right
const PACES: { key: GoalPace; label: string; emoji: string; hopMs: number }[] = [
  { key: 'easy', label: 'setup.paces.easy', emoji: '🐢', hopMs: 700 },
  { key: 'medium', label: 'setup.paces.medium', emoji: '🐇', hopMs: 420 },
  { key: 'hard', label: 'setup.paces.hard', emoji: '🦘', hopMs: 260 },
];

/* ─── Green continue button ──────────────────────────────────── */
function ContinueButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const cb = useThemedStyles(makeCbStyles);
  return (
    <PressableScale style={cb.btn} scaleTo={0.98} haptic="medium" onPress={onPress}>
      <Text style={cb.text}>{label}</Text>
      <View style={cb.chevs}>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.35)" />
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" style={{ marginLeft: -11 }} />
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.white} style={{ marginLeft: -11 }} />
      </View>
    </PressableScale>
  );
}

/* ─── Segmented toggle ───────────────────────────────────────── */
function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { key: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  const seg = useThemedStyles(makeSegStyles);
  return (
    <View style={seg.wrap}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <PressableScale haptic="light"
            key={o.key}
            style={[seg.btn, active && seg.btnActive]}
            activeOpacity={0.85}
            onPress={() => { haptic.light(); onChange(o.key); }}
          >
            <Text style={[seg.text, active && seg.textActive]}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

/* ─── Horizontal ruler picker (weight) ───────────────────────── */
const TICK = 14;
function Ruler({ value, min, max, step, onChange, tint }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; tint: string;
}) {
  const [w, setW] = useState(0);
  const ref = useRef<ScrollView>(null);
  const count = Math.round((max - min) / step) + 1;
  const indexOf = (v: number) => Math.round((v - min) / step);

  useEffect(() => {
    if (w > 0) ref.current?.scrollTo({ x: indexOf(value) * TICK, animated: false });
  }, [w]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / TICK);
    const v = Math.min(max, Math.max(min, min + i * step));
    if (v !== value) { onChange(v); haptic.select(); }
  };

  return (
    <View style={ruler.wrap} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ paddingHorizontal: (w - TICK) / 2 }}
        >
          {Array.from({ length: count }).map((_, i) => {
            const major = i % 5 === 0;
            return (
              <View key={i} style={ruler.slot}>
                <View style={[ruler.tick, { height: major ? 26 : 14, backgroundColor: tint, opacity: major ? 0.9 : 0.35 }]} />
              </View>
            );
          })}
        </ScrollView>
      )}
      <View style={[ruler.marker, { backgroundColor: tint }]} pointerEvents="none" />
    </View>
  );
}

/* ─── Vertical wheel picker (steps) ──────────────────────────── */
const ITEM_H = 56;
const WHEEL_VISIBLE = 5;
function Wheel({ value, min, max, step, onChange }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const wheel = useThemedStyles(makeWheelStyles);
  const ref = useRef<ScrollView>(null);
  const count = Math.round((max - min) / step) + 1;
  const height = ITEM_H * WHEEL_VISIBLE;
  const indexOf = (v: number) => Math.round((v - min) / step);

  useEffect(() => {
    ref.current?.scrollTo({ y: indexOf(value) * ITEM_H, animated: false });
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const v = Math.min(max, Math.max(min, min + i * step));
    if (v !== value) { onChange(v); haptic.select(); }
  };

  return (
    <View style={{ height }}>
      <View style={wheel.highlight} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingVertical: (height - ITEM_H) / 2 }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const v = min + i * step;
          const active = v === value;
          return (
            <View key={i} style={wheel.item}>
              <Text style={[wheel.text, active && wheel.textActive]}>{v.toLocaleString('tr-TR')}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ─── Animated animal (hops/runs when active) ────────────────── */
function PaceAnimal({ emoji, active, hopMs }: { emoji: string; active: boolean; hopMs: number }) {
  const styles = useThemedStyles(makeStyles);
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    if (active) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(hop, { toValue: 1, duration: hopMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(hop, { toValue: 0, duration: hopMs, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      hop.stopAnimation(() => hop.setValue(0));
    }
    return () => loop?.stop();
  }, [active, hopMs]);

  const translateY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const rotate = hop.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] });

  return (
    <Animated.Text
      style={[
        styles.animal,
        active && styles.animalActive,
        { transform: [{ translateY }, { rotate }, { scaleX: active ? -1.15 : -1 }, { scaleY: active ? 1.15 : 1 }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

/* ─── Pace selector (3 card stops) ───────────────────────────── */
function PaceSelector({ pace, onChange }: { pace: GoalPace; onChange: (p: GoalPace) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const PACES_DATA: { key: GoalPace; label: string; emoji: string; hopMs: number; rate: string }[] = [
    { key: 'easy', label: 'setup.paces.easy', emoji: '🐢', hopMs: 700, rate: '-300 kcal/j' },
    { key: 'medium', label: 'setup.paces.medium', emoji: '🐇', hopMs: 420, rate: '-500 kcal/j' },
    { key: 'hard', label: 'setup.paces.hard', emoji: '🦘', hopMs: 260, rate: '-750 kcal/j' },
  ];

  return (
    <View style={styles.paceSelectorWrap}>
      {PACES_DATA.map(p => {
        const active = pace === p.key;
        return (
          <PressableScale
            key={p.key}
            style={[styles.paceCard, active && styles.paceCardActive]}
            scaleTo={0.97}
            haptic="medium"
            onPress={() => { haptic.select(); onChange(p.key); }}
          >
            <View style={styles.animalContainer}>
              <PaceAnimal emoji={p.emoji} active={active} hopMs={p.hopMs} />
            </View>
            <Text style={[styles.paceCardTitle, active && styles.paceCardTitleActive]}>
              {t(p.label)}
            </Text>
            <Text style={[styles.paceCardRate, active && styles.paceCardRateActive]}>
              {p.rate}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}


/* ─── Loading "preparing your plan" ──────────────────────────── */
const LOADING_CHECKS = [
  { t: 'setup.loading.check1', at: 20 },
  { t: 'setup.loading.check2', at: 40 },
  { t: 'setup.loading.check3', at: 60 },
  { t: 'setup.loading.check4', at: 80 },
  { t: 'setup.loading.check5', at: 100 },
];
function PlanLoading({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [pct, setPct] = useState(0);
  const SIZE = 220;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const progress = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(progress, {
      toValue: 1,
      duration: 2600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setTimeout(onDone, 500);
    });

    // Gentle luminous pulse behind the ring (drives an SVG fillOpacity → JS driver).
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.55, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();

    return () => { progress.removeListener(id); loop.stop(); };
  }, []);

  const dashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });

  return (
    <View style={styles.loadingWrap}>
      <Text style={styles.loadingTitle}>{t('setup.loading.title')}</Text>
      <Text style={styles.loadingSub}>{t('setup.loading.subtitle')}</Text>

      <View style={styles.loadingRing}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            {/* Same gradient as the straight calorie bars: orange → gold → green → blue */}
            <SvgGradient id="kcalArc" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.orange} />
              <Stop offset="0.4" stopColor={colors.gold} />
              <Stop offset="0.75" stopColor={colors.green} />
              <Stop offset="1" stopColor={colors.blue} />
            </SvgGradient>
            {/* Soft luminous glow that fades to transparent — no hard disc edge. */}
            <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.gold} stopOpacity="0.30" />
              <Stop offset="0.7" stopColor={colors.gold} stopOpacity="0.06" />
              <Stop offset="1" stopColor={colors.gold} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={R - STROKE / 2}
            fill="url(#glowGrad)" fillOpacity={glow}
          />
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            stroke={colors.separatorLight} strokeWidth={STROKE} fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            stroke="url(#kcalArc)" strokeWidth={STROKE} fill="none" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.loadingCenter}>
          <View style={styles.pctRow}>
            <Text style={styles.loadingPct}>{pct}</Text>
            <Text style={styles.loadingPctSign}>%</Text>
          </View>
        </View>
      </View>

      <View style={styles.loadingChecks}>
        {LOADING_CHECKS.map(ch => {
          const done = pct >= ch.at;
          return (
            <View key={ch.t} style={styles.loadingCheckRow}>
              <View style={[styles.checkBadge, done && styles.checkBadgeDone]}>
                {done
                  ? <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                  : <View style={styles.checkDot} />}
              </View>
              <Text style={[styles.loadingCheckTxt, done && styles.loadingCheckTxtDone]}>{t(ch.t)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function SetupScreen() {
  const { completeOnboarding, updateProfile, profile } = usePlan();
  const { userAllergens, toggleAllergen, setAllergens } = useAllergens();
  const { toast } = useFeedback();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // `edit=1` → opened from the profile to change goals (not first onboarding).
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const [step, setStep] = useState(0);

  // First onboarding starts with a blank allergen selection; editing keeps the
  // user's current allergens so they can adjust them.
  useEffect(() => {
    if (!isEdit) setAllergens([]);
  }, [isEdit]);
  const [loading, setLoading] = useState(false);
  const [paceUnit, setPaceUnit] = useState<'gun' | 'hafta'>('hafta');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  // When editing, prefill from the saved profile; otherwise sensible defaults.
  const [form, setForm] = useState<UserProfile>(() =>
    isEdit
      ? { ...profile }
      : {
          sex: 'male', height: 170, age: 33, weight: 75, targetWeight: 70,
          activity: 'active', goalPace: 'medium', dailySteps: 5000, diet: 'healthy',
        },
  );

  const patch = (p: Partial<UserProfile>) => setForm(prev => ({ ...prev, ...p }));
  const targets = computeTargets(form);
  const weeks = weeksToGoal(form);
  const goalNumber = paceUnit === 'hafta' ? weeks : weeks * 7;

  // kg/lb conversion (weight is always stored in kg internally)
  const toDisp = (kg: number) => (weightUnit === 'lb' ? kg * KG_TO_LB : kg);
  const fromDisp = (v: number) => (weightUnit === 'lb' ? v / KG_TO_LB : v);
  const wRange = weightUnit === 'lb' ? { min: 77, max: 551, step: 1 } : { min: 35, max: 250, step: 0.5 };

  const next = () => {
    haptic.select();
    if (step === ALLERGEN_STEP) setLoading(true);
    else if (step < LAST_STEP) setStep(step + 1);
  };
  const back = () => {
    if (step === 0) router.back();
    else setStep(step - 1);
  };
  const finish = () => {
    haptic.success();
    if (isEdit) {
      // Editing from the profile: save and return, don't re-route to the app.
      updateProfile(form);
      toast(t('profile.saved', { defaultValue: 'Profil mis à jour' }));
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile');
    } else {
      completeOnboarding(form);
      router.replace('/(tabs)/plan');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <PlanLoading onDone={() => { setLoading(false); setStep(LAST_STEP); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Progress */}
      <View style={styles.topBar}>
        <PressableScale haptic="light" style={styles.backBtn} onPress={back} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </PressableScale>
        <View style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.progressSeg, i <= step + 1 && styles.progressSegActive]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Step 0 · Temel Bilgilerin ── */}
        {step === 0 && (
          <>
            <Text style={styles.title}>{t('setup.step0.title')}</Text>
            <Text style={styles.subtitle}>{t('setup.step0.subtitle')}</Text>

            <View style={styles.sexRow}>
              {(['male', 'female'] as Sex[]).map(sx => {
                const active = form.sex === sx;
                return (
                  <PressableScale
                    key={sx}
                    style={[styles.sexCard, active && styles.sexCardActive]}
                    scaleTo={0.97}
                    onPress={() => { haptic.select(); patch({ sex: sx }); }}
                  >
                    {active && (
                      <View style={styles.sexCheck}>
                        <MaterialCommunityIcons name="check" size={13} color={colors.white} />
                      </View>
                    )}
                    <MaterialCommunityIcons
                      name={sx === 'male' ? 'human-male' : 'human-female'}
                      size={30}
                      color={active ? colors.green : colors.textSecondary}
                    />
                    <Text style={[styles.sexLabel, active && styles.sexLabelActive]}>{sx === 'male' ? t('setup.step0.male') : t('setup.step0.female')}</Text>
                  </PressableScale>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>{t('setup.step0.height')}</Text>
            <Text style={styles.bigValue}>{form.height} {t('setup.cm')}</Text>
            <View style={styles.sliderRow}>
              <MaterialCommunityIcons name="human-male-height" size={22} color={colors.textMuted} />
              <Slider
                style={styles.flexSlider}
                minimumValue={50} maximumValue={250} step={1}
                value={form.height}
                onValueChange={v => patch({ height: Math.round(v) })}
                minimumTrackTintColor={colors.green}
                maximumTrackTintColor={colors.separator}
                thumbTintColor={colors.white}
              />
              <MaterialCommunityIcons name="human-male-height" size={32} color={colors.textSecondary} />
            </View>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeTxt}>50cm</Text>
              <Text style={styles.rangeTxt}>250cm</Text>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>{t('setup.step0.age')}</Text>
            <Text style={styles.bigValue}>{form.age} {t('setup.ageUnit')}</Text>
            <View style={styles.sliderRow}>
              <MaterialCommunityIcons name="human-male" size={22} color={colors.textMuted} />
              <Slider
                style={styles.flexSlider}
                minimumValue={14} maximumValue={100} step={1}
                value={form.age}
                onValueChange={v => patch({ age: Math.round(v) })}
                minimumTrackTintColor={colors.green}
                maximumTrackTintColor={colors.separator}
                thumbTintColor={colors.white}
              />
              <MaterialCommunityIcons name="human-male" size={32} color={colors.textSecondary} />
            </View>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeTxt}>14</Text>
              <Text style={styles.rangeTxt}>100</Text>
            </View>
          </>
        )}

        {/* ── Step 1 · Yeni Hedef Kilonu Seç ── */}
        {step === 1 && (
          <>
            <Text style={styles.title}>{t('setup.step1.title')}</Text>
            <Text style={styles.subtitle}>{t('setup.step1.subtitle')}</Text>

            <View style={{ alignSelf: 'center', marginBottom: 24 }}>
              <Segmented
                options={[{ key: 'kg', label: 'kg' }, { key: 'lb', label: 'lb' }]}
                value={weightUnit}
                onChange={setWeightUnit}
              />
            </View>

            <View style={styles.weightCards}>
              <View style={styles.weightCol}>
                <Text style={styles.weightCardLabel}>{t('setup.step1.current')}</Text>
                <View style={[styles.weightCard, styles.weightCardActive]}>
                  <Text style={[styles.weightVal, { color: colors.green }]}>{toDisp(form.weight).toFixed(1)}</Text>
                  <Text style={styles.weightUnit}>{weightUnit}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} style={{ marginTop: 28 }} />
              <View style={styles.weightCol}>
                <Text style={[styles.weightCardLabel, { color: colors.goldDark }]}>{t('setup.step1.target')}</Text>
                <View style={styles.weightCard}>
                  <Text style={[styles.weightVal, { color: colors.gold }]}>{toDisp(form.targetWeight).toFixed(1)}</Text>
                  <Text style={styles.weightUnit}>{weightUnit}</Text>
                </View>
              </View>
            </View>

            <Ruler key={`cur-${weightUnit}`} value={toDisp(form.weight)} min={wRange.min} max={wRange.max} step={wRange.step} tint={colors.green}
              onChange={v => patch({ weight: fromDisp(v) })} />
            <View style={{ height: 18 }} />
            <Ruler key={`tgt-${weightUnit}`} value={toDisp(form.targetWeight)} min={wRange.min} max={wRange.max} step={wRange.step} tint={colors.gold}
              onChange={v => patch({ targetWeight: fromDisp(v) })} />
          </>
        )}

        {/* ── Step 2 · Diyet ── */}
        {step === 2 && (
          <>
            <Text style={styles.title}>{t('setup.step2.title')}</Text>
            <Text style={styles.subtitle}>{t('setup.step2.subtitle')}</Text>
            {DIETS.map(d => {
              const active = form.diet === d.key;
              return (
                <PressableScale
                  key={d.key}
                  style={[styles.listCard, active && styles.listCardActive]}
                  scaleTo={0.98}
                  onPress={() => { haptic.select(); patch({ diet: d.key as DietPref }); }}
                >
                  <MaterialCommunityIcons name={d.icon} size={22} color={active ? colors.green : colors.textPrimary} />
                  <Text style={[styles.listLabel, active && styles.listLabelActive]}>{t(d.label)}</Text>
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </PressableScale>
              );
            })}
          </>
        )}

        {/* ── Step 3 · Pace ── */}
        {step === 3 && (
          <>
            <Text style={styles.title}>{t('setup.step3.title')}</Text>
            <View style={{ alignSelf: 'center', marginTop: 8, marginBottom: 22 }}>
              <Segmented options={[{ key: 'gun', label: t('setup.step3.day') }, { key: 'hafta', label: t('setup.step3.week') }]} value={paceUnit} onChange={setPaceUnit} />
            </View>
            <View style={styles.durationCard}>
              <Text style={styles.durationLabel}>{t('profile.weightHistoryPage.duration', { defaultValue: 'DURÉE ESTIMÉE' }).toUpperCase()}</Text>
              <View style={styles.durationValueRow}>
                <Text style={styles.durationValue}>{goalNumber}</Text>
                <Text style={styles.durationUnit}>
                  {paceUnit === 'hafta' 
                    ? t('setup.step3.week', { defaultValue: 'SEMAINE' }).toLowerCase() + (goalNumber > 1 ? 's' : '')
                    : t('setup.step3.day', { defaultValue: 'JOUR' }).toLowerCase() + (goalNumber > 1 ? 's' : '')
                  }
                </Text>
              </View>
            </View>
            <PaceSelector pace={form.goalPace} onChange={p => patch({ goalPace: p })} />
            <Text style={styles.paceNote}>{t('setup.step3.note')}</Text>
          </>
        )}

        {/* ── Step 4 · Aktivite ── */}
        {step === 4 && (
          <>
            <Text style={styles.title}>{t('setup.step4.title')}</Text>
            <Text style={styles.subtitle}>{t('setup.step4.subtitle')}</Text>
            {ACTIVITIES.map(a => {
              const active = form.activity === a.key;
              return (
                <PressableScale
                  key={a.key}
                  style={[styles.listCard, active && styles.listCardActive]}
                  scaleTo={0.98}
                  onPress={() => { haptic.select(); patch({ activity: a.key }); }}
                >
                  <MaterialCommunityIcons name={a.icon} size={26} color={active ? colors.green : colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listLabel, active && styles.listLabelActive]}>{t(a.label)}</Text>
                    <Text style={styles.listDesc}>{t(a.desc)}</Text>
                  </View>
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </PressableScale>
              );
            })}
          </>
        )}

        {/* ── Step 5 · Günlük Adım ── */}
        {step === 5 && (
          <>
            <Text style={styles.title}>{t('setup.step5.title')}</Text>
            <Text style={styles.subtitle}>{t('setup.step5.subtitle')}</Text>
            <Wheel value={form.dailySteps} min={1000} max={20000} step={200} onChange={v => patch({ dailySteps: v })} />
          </>
        )}

        {/* ── Step 6 · Alerjenler ── */}
        {step === ALLERGEN_STEP && (
          <>
            <Text style={styles.title}>{t('setup.step6.title')}</Text>
            <Text style={styles.subtitle}>{t('setup.step6.subtitle')}</Text>

            <View style={styles.allergenList}>
              {ONBOARDING_ALLERGENS.map(a => {
                const selected = userAllergens.includes(a.id);
                return (
                  <PressableScale
                    key={a.id}
                    style={[styles.allergenRow, selected && styles.allergenRowSelected]}
                    scaleTo={0.98}
                    onPress={() => { haptic.select(); toggleAllergen(a.id); }}
                  >
                    <MaterialCommunityIcons
                      name={a.icon}
                      size={26}
                      color={selected ? colors.green : colors.textPrimary}
                      style={styles.allergenIcon}
                    />
                    <Text style={[styles.allergenLabel, selected && styles.allergenLabelSelected]}>{t(a.label)}</Text>
                    <View style={[styles.allergenRadio, selected && styles.allergenRadioSelected]}>
                      {selected && <MaterialCommunityIcons name="check" size={16} color={colors.white} />}
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </>
        )}

        {/* ── Step 7 · Sonuç (plan personnalisé) ── */}
        {step === 7 && (() => {
          const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + weeks * 7);
          const dd = String(targetDate.getDate()).padStart(2, '0');
          const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
          const dateStr = `${dd}/${mm}/${targetDate.getFullYear()}`;
          const diffW = form.weight - form.targetWeight;
          const kgDiff = Math.abs(diffW).toFixed(0);
          const dateText = diffW > 0.05
            ? t('setup.result.dateLine', { date: dateStr, kg: kgDiff })
            : diffW < -0.05
              ? t('setup.result.dateLineGain', { date: dateStr, kg: kgDiff })
              : t('setup.result.dateLineKeep');
          const deficitVal = -targets.deficit; // négatif (déficit)
          const gaugePos = Math.min(1, Math.max(0, (deficitVal + 1000) / 2000));
          const macroPills = [
            { label: t('setup.result.kcalLabel'), value: `${targets.kcal}` },
            { label: t('setup.result.fat'),     value: `${targets.fat}g` },
            { label: t('setup.result.protein'), value: `${targets.protein}g` },
            { label: t('setup.result.carbs'),   value: `${targets.carbs}g` },
          ];
          return (
            <>
              <Text style={styles.title}>{t('setup.result.title')}</Text>
              <Text style={styles.subtitle}>{t('setup.result.subtitle')}</Text>

              {/* Pilule de date */}
              <View style={styles.resDatePill}>
                <Text style={styles.resDateText}>{dateText}</Text>
              </View>

              {/* Makro Hesaplaması */}
              <View style={styles.resCard}>
                <Text style={styles.resCardTitle}>{t('setup.result.macroTitle')}</Text>
                <Text style={styles.resCardSub}>{t('setup.result.macroSub')}</Text>
                <View style={styles.resPillsRow}>
                  {macroPills.map(p => (
                    <View key={p.label} style={styles.resPill}>
                      <Text style={styles.resPillLabel}>{p.label}</Text>
                      <Text style={styles.resPillValue}>{p.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Kalori Açığı Hesaplaması */}
              <View style={styles.resCard}>
                <Text style={styles.resCardTitle}>{t('setup.result.deficitTitle')}</Text>
                <Text style={styles.resCardSub}>{t('setup.result.deficitSub')}</Text>
                <Text style={styles.resDeficitVal}>{deficitVal} kcal</Text>
                <View style={styles.resGaugeTrack}>
                  <LinearGradient
                    colors={[colors.orange, colors.gold, colors.green, colors.blue]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.resGaugeFill}
                  />
                  <View style={[styles.resGaugeThumb, { left: `${gaugePos * 100}%` as `${number}%` }]} />
                </View>
                <View style={styles.resGaugeLabels}>
                  <Text style={styles.resGaugeEnd}>-1000</Text>
                  <Text style={styles.resGaugeEnd}>+1000</Text>
                </View>
              </View>

              {/* Su + Adım Takibi */}
              <View style={styles.resTrackRow}>
                <View style={styles.resTrackCard}>
                  <Text style={[styles.resTrackTitle, { color: colors.blue }]}>{t('setup.result.waterTitle')}</Text>
                  <MaterialCommunityIcons name="cup-water" size={34} color={colors.blue} style={styles.resTrackIcon} />
                  <Text style={styles.resTrackText}>{t('setup.result.waterText', { ml: group(targets.waterMl) })}</Text>
                </View>
                <View style={styles.resTrackCard}>
                  <Text style={[styles.resTrackTitle, { color: colors.green }]}>{t('setup.result.stepsTitle')}</Text>
                  <MaterialCommunityIcons name="walk" size={34} color={colors.green} style={styles.resTrackIcon} />
                  <Text style={styles.resTrackText}>{t('setup.result.stepsText', { steps: group(form.dailySteps) })}</Text>
                </View>
              </View>
            </>
          );
        })()}
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton
          label={
            step === LAST_STEP
              ? t('setup.result.start')
              : step === ALLERGEN_STEP && userAllergens.length === 0
                ? t('setup.noAllergens')
                : t('common.continue')
          }
          onPress={step === LAST_STEP ? finish : next}
        />
      </View>
    </SafeAreaView>
  );
}

const makeCbStyles = (colors: ThemeColors) => StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.green, height: 52, borderRadius: 16,
    shadowColor: colors.shadowGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 5,
  },
  text: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.white },
  chevs: { flexDirection: 'row', alignItems: 'center' },
});

const makeSegStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 4, gap: 4 },
  btn: { paddingHorizontal: 24, paddingVertical: 9, borderRadius: 10 },
  btnActive: { backgroundColor: colors.green },
  text: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.textSecondary, letterSpacing: 0.4 },
  textActive: { color: colors.white },
});

const ruler = StyleSheet.create({
  wrap: { height: 52, justifyContent: 'center' },
  slot: { width: TICK, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 2, borderRadius: 1 },
  marker: { position: 'absolute', left: '50%', marginLeft: -1.5, width: 3, height: 36, borderRadius: 2 },
});

const makeWheelStyles = (colors: ThemeColors) => StyleSheet.create({
  highlight: {
    position: 'absolute', left: 0, right: 0,
    top: ITEM_H * ((WHEEL_VISIBLE - 1) / 2), height: ITEM_H,
    borderRadius: 18, backgroundColor: colors.surface,
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: colors.textMuted },
  textActive: { color: colors.textPrimary, fontSize: 30 },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, direction: 'ltr' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 6, marginRight: 16 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.separator },
  progressSegActive: { backgroundColor: colors.green },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: colors.textPrimary, textAlign: 'center', marginBottom: 6, lineHeight: 30 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 14, lineHeight: 18 },

  // gender
  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 36 },
  sexCard: { flex: 1, alignItems: 'center', gap: 12, paddingVertical: 18, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  sexCardActive: { backgroundColor: colors.greenLight, borderColor: colors.green },
  sexCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  sexLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textSecondary },
  sexLabelActive: { color: colors.green },

  // sliders
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  bigValue: { fontFamily: 'Poppins_700Bold', fontSize: 30, color: colors.textPrimary, textAlign: 'center', marginVertical: 6 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flexSlider: { flex: 1, height: 40 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, marginTop: -2 },
  rangeTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textMuted },

  // weight
  weightCards: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 },
  weightCol: { flex: 1, alignItems: 'center' },
  weightCardLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  weightCard: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 22, borderRadius: 20, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'center', gap: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  weightCardActive: { backgroundColor: colors.greenLight, borderColor: colors.green },
  weightVal: { fontFamily: 'Poppins_700Bold', fontSize: 30, color: colors.textPrimary },
  weightUnit: { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.textMuted, marginBottom: 6 },

  // list cards (diet / activity)
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  listCardActive: { backgroundColor: colors.greenLight, borderColor: colors.green },
  listLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.textPrimary, flex: 1 },
  listLabelActive: { color: colors.green },
  listDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.separator, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: colors.green },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.green },

  // pace
  durationCard: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 26,
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  durationLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  durationValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  durationValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 48,
    color: colors.orange,
    lineHeight: 52,
  },
  durationUnit: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  paceSelectorWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
  },
  paceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  paceCardActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  animalContainer: {
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  animal: {
    fontSize: 34,
    opacity: 0.5,
  },
  animalActive: {
    opacity: 1,
  },
  paceCardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  paceCardTitleActive: {
    color: colors.green,
  },
  paceCardRate: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  paceCardRateActive: {
    color: colors.green,
  },
  paceNote: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 26, lineHeight: 19 },

  // loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: colors.textPrimary, textAlign: 'center', marginBottom: 8, lineHeight: 32 },
  loadingSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 44, lineHeight: 21 },
  loadingRing: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 44 },
  loadingCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pctRow: { flexDirection: 'row', alignItems: 'baseline' },
  loadingPct: { fontFamily: 'Poppins_700Bold', fontSize: 48, color: colors.textPrimary, letterSpacing: -1.5 },
  loadingPctSign: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: colors.gold, marginLeft: 2 },
  loadingChecks: { gap: 12, alignSelf: 'stretch', paddingHorizontal: 18 },
  loadingCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkBadge: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: colors.separator,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBadgeDone: { backgroundColor: colors.green, borderColor: colors.green },
  checkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.separator },
  loadingCheckTxt: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.textMuted },
  loadingCheckTxtDone: { fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },

  // allergens
  allergenList: { marginTop: 6, gap: 14 },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  allergenRowSelected: { borderColor: colors.green, backgroundColor: colors.greenLight },
  allergenIcon: { width: 30, textAlign: 'center' },
  allergenLabel: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.textPrimary },
  allergenLabelSelected: { color: colors.green },
  allergenRadio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergenRadioSelected: { backgroundColor: colors.green, borderColor: colors.green },

  // result
  resultCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 22, marginTop: 8 },
  resultTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: colors.textPrimary, marginBottom: 6 },
  resultSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultBox: { width: '47%', flexGrow: 1, backgroundColor: colors.backgroundAlt, borderRadius: 18, padding: 16, gap: 10 },
  resultBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  resultBoxLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
  resultBoxValue: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: colors.textPrimary },

  // result — plan personnalisé
  resHero: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  resHeroLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, color: colors.textMuted, marginBottom: 8 },
  resHeroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  resHeroValue: { fontFamily: 'Poppins_700Bold', fontSize: 46, color: colors.textPrimary, lineHeight: 50 },
  resHeroUnit: { fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.textMuted },
  resGoalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resGoalCur: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textSecondary },
  resGoalTgt: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.gold },
  resWeeksPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.greenLight, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 5, marginLeft: 4,
  },
  resWeeksTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.green },

  resCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 13,
    marginBottom: 10,
  },
  resCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.textPrimary, marginBottom: 2 },

  // ── Nouveau design résultat (compact) ──
  resDatePill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  resDateText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textPrimary, textAlign: 'center' },
  resCardSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted, lineHeight: 15, marginBottom: 10 },
  resPillsRow: { flexDirection: 'row', gap: 7 },
  resPill: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 9,
    alignItems: 'center',
    gap: 3,
  },
  resPillLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: colors.textMuted },
  resPillValue: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.textPrimary },
  resDeficitVal: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.textPrimary, marginBottom: 6 },
  resGaugeTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.separatorLight,
    overflow: 'visible',
    justifyContent: 'center',
  },
  resGaugeFill: { ...StyleSheet.absoluteFillObject, borderRadius: 4 },
  resGaugeThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.green,
  },
  resGaugeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  resGaugeEnd: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.textMuted },
  resTrackRow: { flexDirection: 'row', gap: 10 },
  resTrackCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  resTrackTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  resTrackIcon: { marginVertical: 7 },
  resTrackText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.textSecondary, textAlign: 'center', lineHeight: 15 },
  resMacroRow: { gap: 8 },
  resMacroHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resMacroDot: { width: 9, height: 9, borderRadius: 5 },
  resMacroLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
  resMacroVal: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.textPrimary },
  resMacroPct: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted, width: 40, textAlign: 'right' },
  resMacroBarBg: { height: 7, borderRadius: 4, backgroundColor: colors.separatorLight, overflow: 'hidden' },
  resMacroBarFill: { height: '100%', borderRadius: 4 },

  resStatsRow: { flexDirection: 'row', gap: 12 },
  resStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
  },
  resStatVal: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.textPrimary },
  resStatLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted },

  footer: { paddingHorizontal: 24, paddingTop: 8 },
});
