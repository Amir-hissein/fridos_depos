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
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { usePlan } from '../../context/PlanContext';
import {
  Sex,
  Activity,
  GoalPace,
  UserProfile,
  computeTargets,
  weeksToGoal,
} from '../../services/plan';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const LAST_STEP = 6;
const KG_TO_LB = 2.20462;

const ACTIVITIES: { key: Activity; label: string; desc: string; icon: IconName }[] = [
  { key: 'sedentary', label: 'Masabaşı Çalışıyorum', desc: 'Çoğu masabaşı çalışanın günlük 5.000 adımdan az aktivitesi bulunur.', icon: 'monitor' },
  { key: 'active', label: 'Düzenli Egzersiz Yapıyorum', desc: 'Haftada en az 3 kez antrenman yapan kullanıcılar orta–yüksek aktiflik seviyesindedir.', icon: 'arm-flex' },
  { key: 'cardio', label: 'Düzenli Kardiyo Yapıyorum', desc: 'Koşu, bisiklet veya yüksek tempo kardiyo yapanlar daha yüksek kalori harcar.', icon: 'heart-pulse' },
];

const DIETS: { key: string; label: string; icon: IconName }[] = [
  { key: 'healthy', label: 'Sağlıklı Beslenme', icon: 'heart-plus-outline' },
  { key: 'keto', label: 'Ketojenik', icon: 'food-drumstick' },
  { key: 'vegan', label: 'Vegan', icon: 'sprout' },
  { key: 'glutenfree', label: 'Glutensiz', icon: 'barley-off' },
  { key: 'vegetarian', label: 'Vejeteryan', icon: 'leaf' },
];

// 🐢 slow → easy/left … 🦘 fast → hard/right
const PACES: { key: GoalPace; label: string; emoji: string; hopMs: number }[] = [
  { key: 'easy', label: 'Kolay', emoji: '🐢', hopMs: 700 },
  { key: 'medium', label: 'Orta', emoji: '🐇', hopMs: 420 },
  { key: 'hard', label: 'Zor', emoji: '🦘', hopMs: 260 },
];

/* ─── Green continue button ──────────────────────────────────── */
function ContinueButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale style={cb.btn} scaleTo={0.98} haptic="medium" onPress={onPress}>
      <Text style={cb.text}>{label}</Text>
      <View style={cb.chevs}>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.35)" />
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" style={{ marginLeft: -11 }} />
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.white} style={{ marginLeft: -11 }} />
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
  return (
    <View style={seg.wrap}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            style={[seg.btn, active && seg.btnActive]}
            activeOpacity={0.85}
            onPress={() => { haptic.light(); onChange(o.key); }}
          >
            <Text style={[seg.text, active && seg.textActive]}>{o.label}</Text>
          </TouchableOpacity>
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

/* ─── Pace slider (3 stops) ──────────────────────────────────── */
function PaceSlider({ pace, onChange }: { pace: GoalPace; onChange: (p: GoalPace) => void }) {
  const HANDLE = 26;
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const idx = PACES.findIndex(p => p.key === pace);
  const posFor = (i: number) => (width <= 0 ? 0 : (i / (PACES.length - 1)) * (width - HANDLE));

  useEffect(() => {
    Animated.spring(x, { toValue: posFor(idx), useNativeDriver: true, friction: 7, tension: 90 }).start();
  }, [idx, width]);

  return (
    <View style={styles.paceWrap}>
      <View style={styles.animalsRow}>
        {PACES.map(p => (
          <PaceAnimal key={p.key} emoji={p.emoji} active={pace === p.key} hopMs={p.hopMs} />
        ))}
      </View>
      <View style={styles.sliderTrack} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.sliderLine} />
        <View style={[styles.sliderFill, { width: `${(idx / (PACES.length - 1)) * 100}%` }]} />
        <Animated.View style={[styles.sliderHandle, { transform: [{ translateX: x }] }]} />
        <View style={styles.sliderZones}>
          {PACES.map(p => (
            <TouchableOpacity key={p.key} style={styles.sliderZone} onPress={() => { haptic.select(); onChange(p.key); }} />
          ))}
        </View>
      </View>
      <View style={styles.paceLabels}>
        {PACES.map(p => (
          <TouchableOpacity key={p.key} onPress={() => { haptic.select(); onChange(p.key); }} activeOpacity={0.7}>
            <Text style={[styles.paceLabel, pace === p.key && styles.paceLabelActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/* ─── Loading "preparing your plan" ──────────────────────────── */
const LOADING_CHECKS = [
  { t: 'Verdiğin cevaplar incelendi.', at: 20 },
  { t: 'Hedefin belirlendi.', at: 40 },
  { t: 'Makrolar hesaplandı.', at: 60 },
  { t: 'Öğün planın oluşturuldu.', at: 80 },
  { t: 'Veriler kaydedildi.', at: 100 },
];
function PlanLoading({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const size = 200;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const id = setInterval(() => {
      setPct(prev => {
        if (prev >= 100) {
          clearInterval(id);
          setTimeout(onDone, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.loadingWrap}>
      <Text style={styles.loadingTitle}>Yeni Hedeflerinize Göre Planınız Güncelleniyor!</Text>
      <Text style={styles.loadingSub}>Tercihlerinize uygun yeni öğün planınızı hazırlıyoruz…</Text>
      <View style={styles.loadingRing}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.separatorLight} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={Colors.gold} strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingPct}>%{pct}</Text>
        </View>
      </View>
      <View style={styles.loadingChecks}>
        {LOADING_CHECKS.map(ch => {
          const done = pct >= ch.at;
          return (
            <View key={ch.t} style={styles.loadingCheckRow}>
              <Text style={[styles.loadingCheckTxt, done && styles.loadingCheckTxtDone]}>{ch.t}</Text>
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={done ? Colors.green : Colors.separator}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function SetupScreen() {
  const { completeOnboarding } = usePlan();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paceUnit, setPaceUnit] = useState<'gun' | 'hafta'>('hafta');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [diet, setDiet] = useState('healthy');
  const [form, setForm] = useState<UserProfile>({
    sex: 'male', height: 170, age: 33, weight: 75, targetWeight: 70,
    activity: 'active', goalPace: 'medium', dailySteps: 5000,
  });

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
    if (step === 5) setLoading(true);
    else if (step < LAST_STEP) setStep(step + 1);
  };
  const back = () => {
    if (step === 0) router.back();
    else setStep(step - 1);
  };
  const finish = () => {
    haptic.success();
    completeOnboarding(form);
    router.replace('/(tabs)/plan');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <PlanLoading onDone={() => { setLoading(false); setStep(6); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Progress */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={back} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          {Array.from({ length: LAST_STEP }).map((_, i) => (
            <View key={i} style={[styles.progressSeg, i <= step && styles.progressSegActive]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Step 0 · Temel Bilgilerin ── */}
        {step === 0 && (
          <>
            <Text style={styles.title}>Temel Bilgilerin.</Text>
            <Text style={styles.subtitle}>Güncel bilgilerini kontrol edelim.</Text>

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
                        <MaterialCommunityIcons name="check" size={13} color={Colors.white} />
                      </View>
                    )}
                    <MaterialCommunityIcons
                      name={sx === 'male' ? 'human-male' : 'human-female'}
                      size={30}
                      color={active ? Colors.green : Colors.textSecondary}
                    />
                    <Text style={[styles.sexLabel, active && styles.sexLabelActive]}>{sx === 'male' ? 'Erkek' : 'Kadın'}</Text>
                  </PressableScale>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Boyun</Text>
            <Text style={styles.bigValue}>{form.height} cm</Text>
            <View style={styles.sliderRow}>
              <MaterialCommunityIcons name="human-male-height" size={22} color={Colors.textMuted} />
              <Slider
                style={styles.flexSlider}
                minimumValue={50} maximumValue={250} step={1}
                value={form.height}
                onValueChange={v => patch({ height: Math.round(v) })}
                minimumTrackTintColor={Colors.green}
                maximumTrackTintColor={Colors.separator}
                thumbTintColor={Colors.white}
              />
              <MaterialCommunityIcons name="human-male-height" size={32} color={Colors.textSecondary} />
            </View>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeTxt}>50cm</Text>
              <Text style={styles.rangeTxt}>250cm</Text>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Yaşın</Text>
            <Text style={styles.bigValue}>{form.age} Yaş</Text>
            <View style={styles.sliderRow}>
              <MaterialCommunityIcons name="human-male" size={22} color={Colors.textMuted} />
              <Slider
                style={styles.flexSlider}
                minimumValue={14} maximumValue={100} step={1}
                value={form.age}
                onValueChange={v => patch({ age: Math.round(v) })}
                minimumTrackTintColor={Colors.green}
                maximumTrackTintColor={Colors.separator}
                thumbTintColor={Colors.white}
              />
              <MaterialCommunityIcons name="human-male" size={32} color={Colors.textSecondary} />
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
            <Text style={styles.title}>Yeni Hedef Kilonu Seç.</Text>
            <Text style={styles.subtitle}>Hedef kilona yönelik en doğru programı hazırlayalım…</Text>

            <View style={{ alignSelf: 'center', marginBottom: 24 }}>
              <Segmented
                options={[{ key: 'kg', label: 'kg' }, { key: 'lb', label: 'lb' }]}
                value={weightUnit}
                onChange={setWeightUnit}
              />
            </View>

            <View style={styles.weightCards}>
              <View style={styles.weightCol}>
                <Text style={styles.weightCardLabel}>Mevcut Kilon</Text>
                <View style={[styles.weightCard, styles.weightCardActive]}>
                  <Text style={[styles.weightVal, { color: Colors.green }]}>{toDisp(form.weight).toFixed(1)}</Text>
                  <Text style={styles.weightUnit}>{weightUnit}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} style={{ marginTop: 28 }} />
              <View style={styles.weightCol}>
                <Text style={[styles.weightCardLabel, { color: Colors.goldDark }]}>Hedef Kilon</Text>
                <View style={styles.weightCard}>
                  <Text style={[styles.weightVal, { color: Colors.gold }]}>{toDisp(form.targetWeight).toFixed(1)}</Text>
                  <Text style={styles.weightUnit}>{weightUnit}</Text>
                </View>
              </View>
            </View>

            <Ruler key={`cur-${weightUnit}`} value={toDisp(form.weight)} min={wRange.min} max={wRange.max} step={wRange.step} tint={Colors.green}
              onChange={v => patch({ weight: fromDisp(v) })} />
            <View style={{ height: 18 }} />
            <Ruler key={`tgt-${weightUnit}`} value={toDisp(form.targetWeight)} min={wRange.min} max={wRange.max} step={wRange.step} tint={Colors.gold}
              onChange={v => patch({ targetWeight: fromDisp(v) })} />
          </>
        )}

        {/* ── Step 2 · Diyet ── */}
        {step === 2 && (
          <>
            <Text style={styles.title}>Özel Bir Diyet Tercihiniz Var Mı?</Text>
            <Text style={styles.subtitle}>Önerilerimizi diyet tercihinize göre yapacağız.</Text>
            {DIETS.map(d => {
              const active = diet === d.key;
              return (
                <PressableScale
                  key={d.key}
                  style={[styles.listCard, active && styles.listCardActive]}
                  scaleTo={0.98}
                  onPress={() => { haptic.select(); setDiet(d.key); }}
                >
                  <MaterialCommunityIcons name={d.icon} size={24} color={active ? Colors.green : Colors.textPrimary} />
                  <Text style={[styles.listLabel, active && styles.listLabelActive]}>{d.label}</Text>
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
            <Text style={styles.title}>Hedefinize Nasıl Ulaşmak İstersiniz?</Text>
            <View style={{ alignSelf: 'center', marginTop: 8, marginBottom: 22 }}>
              <Segmented options={[{ key: 'gun', label: 'GÜN' }, { key: 'hafta', label: 'HAFTA' }]} value={paceUnit} onChange={setPaceUnit} />
            </View>
            <View style={styles.numberCard}>
              <Text style={styles.numberValue}>{goalNumber}</Text>
            </View>
            <PaceSlider pace={form.goalPace} onChange={p => patch({ goalPace: p })} />
            <Text style={styles.paceNote}>Mevcut kilonuz ve hedef kilonuz baz alınarak hesaplanmaktadır.</Text>
          </>
        )}

        {/* ── Step 4 · Aktivite ── */}
        {step === 4 && (
          <>
            <Text style={styles.title}>Aktivite Seviyesi</Text>
            <Text style={styles.subtitle}>Günlük aktivite seviyenize göre hesaplamalarımızı yapacağız ve önerilerde bulunacağız.</Text>
            {ACTIVITIES.map(a => {
              const active = form.activity === a.key;
              return (
                <PressableScale
                  key={a.key}
                  style={[styles.listCard, active && styles.listCardActive]}
                  scaleTo={0.98}
                  onPress={() => { haptic.select(); patch({ activity: a.key }); }}
                >
                  <MaterialCommunityIcons name={a.icon} size={26} color={active ? Colors.green : Colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listLabel, active && styles.listLabelActive]}>{a.label}</Text>
                    <Text style={styles.listDesc}>{a.desc}</Text>
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
            <Text style={styles.title}>Günlük Adım Sayınız</Text>
            <Text style={styles.subtitle}>Makro hesaplamamıza dahil edeceğiz ve buna göre önerilerde bulunacağız.</Text>
            <Wheel value={form.dailySteps} min={1000} max={20000} step={200} onChange={v => patch({ dailySteps: v })} />
          </>
        )}

        {/* ── Step 6 · Sonuç ── */}
        {step === 6 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Güncellenmiş Öneriler</Text>
            <Text style={styles.resultSub}>Yeni hedeflerinize göre hesaplanmış değerler.</Text>
            <View style={styles.resultGrid}>
              {([
                { icon: 'fire' as IconName, label: 'Kalori', value: `${targets.kcal}` },
                { icon: 'bread-slice' as IconName, label: 'Karb.', value: `${targets.carbs}g` },
                { icon: 'food-steak' as IconName, label: 'Protein', value: `${targets.protein}g` },
                { icon: 'water' as IconName, label: 'Yağ', value: `${targets.fat}g` },
              ]).map(m => (
                <View key={m.label} style={styles.resultBox}>
                  <View style={styles.resultBoxTop}>
                    <MaterialCommunityIcons name={m.icon} size={18} color={Colors.gold} />
                    <Text style={styles.resultBoxLabel}>{m.label}</Text>
                  </View>
                  <Text style={styles.resultBoxValue}>{m.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton label={step === LAST_STEP ? 'Bitir' : 'Devam Et'} onPress={step === LAST_STEP ? finish : next} />
      </View>
    </SafeAreaView>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const cb = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.green, height: 58, borderRadius: 16,
    shadowColor: Colors.shadowGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 5,
  },
  text: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.white },
  chevs: { flexDirection: 'row', alignItems: 'center' },
});

const seg = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 4, gap: 4 },
  btn: { paddingHorizontal: 24, paddingVertical: 9, borderRadius: 10 },
  btnActive: { backgroundColor: Colors.green },
  text: { fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.4 },
  textActive: { color: Colors.white },
});

const ruler = StyleSheet.create({
  wrap: { height: 56, justifyContent: 'center' },
  slot: { width: TICK, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 2, borderRadius: 1 },
  marker: { position: 'absolute', left: '50%', marginLeft: -1.5, width: 3, height: 36, borderRadius: 2 },
});

const wheel = StyleSheet.create({
  highlight: {
    position: 'absolute', left: 0, right: 0,
    top: ITEM_H * ((WHEEL_VISIBLE - 1) / 2), height: ITEM_H,
    borderRadius: 18, backgroundColor: Colors.surface,
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: Colors.textMuted },
  textActive: { color: Colors.textPrimary, fontSize: 30 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, direction: 'ltr' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 6, marginRight: 16 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.separator },
  progressSegActive: { backgroundColor: Colors.green },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8, lineHeight: 36 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22 },

  // gender
  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 36 },
  sexCard: { flex: 1, alignItems: 'center', gap: 12, paddingVertical: 18, paddingHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border },
  sexCardActive: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  sexCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' },
  sexLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.textSecondary },
  sexLabelActive: { color: Colors.green },

  // sliders
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: Colors.textPrimary, marginBottom: 4 },
  bigValue: { fontFamily: 'Poppins_700Bold', fontSize: 30, color: Colors.textPrimary, textAlign: 'center', marginVertical: 6 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flexSlider: { flex: 1, height: 40 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, marginTop: -2 },
  rangeTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textMuted },

  // weight
  weightCards: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 },
  weightCol: { flex: 1, alignItems: 'center' },
  weightCardLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textMuted, marginBottom: 8 },
  weightCard: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 22, borderRadius: 20, backgroundColor: Colors.surface, flexDirection: 'row', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.border },
  weightCardActive: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  weightVal: { fontFamily: 'Poppins_700Bold', fontSize: 40, color: Colors.textPrimary },
  weightUnit: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.textMuted, marginBottom: 6 },

  // list cards (diet / activity)
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: Colors.border },
  listCardActive: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  listLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.textPrimary, flex: 1 },
  listLabelActive: { color: Colors.green },
  listDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 3, lineHeight: 17 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.separator, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: Colors.green },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.green },

  // pace
  numberCard: { alignSelf: 'center', width: 200, paddingVertical: 32, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', marginBottom: 30 },
  numberValue: { fontFamily: 'Poppins_700Bold', fontSize: 64, color: Colors.gold, lineHeight: 70 },
  paceWrap: { direction: 'ltr' },
  animalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 16 },
  animal: { fontSize: 34, opacity: 0.4 },
  animalActive: { opacity: 1 },
  sliderTrack: { height: 26, justifyContent: 'center', marginBottom: 10 },
  sliderLine: { height: 3, borderRadius: 2, backgroundColor: Colors.separator },
  sliderFill: { position: 'absolute', left: 0, height: 3, borderRadius: 2, backgroundColor: Colors.white },
  sliderHandle: { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.white, borderWidth: 3, borderColor: Colors.green },
  sliderZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  sliderZone: { flex: 1 },
  paceLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  paceLabel: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.textMuted },
  paceLabelActive: { fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  paceNote: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 26, lineHeight: 19 },

  // loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8, lineHeight: 32 },
  loadingSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 21 },
  loadingRing: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  loadingCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  loadingPct: { fontFamily: 'Poppins_700Bold', fontSize: 44, color: Colors.textPrimary },
  loadingChecks: { gap: 14 },
  loadingCheckRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingCheckTxt: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.textMuted },
  loadingCheckTxtDone: { color: Colors.textPrimary },

  // result
  resultCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 22, marginTop: 8 },
  resultTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 6 },
  resultSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultBox: { width: '47%', flexGrow: 1, backgroundColor: Colors.backgroundAlt, borderRadius: 18, padding: 16, gap: 10 },
  resultBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  resultBoxLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textSecondary },
  resultBoxValue: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: Colors.textPrimary },

  footer: { paddingHorizontal: 24, paddingTop: 8 },
});
