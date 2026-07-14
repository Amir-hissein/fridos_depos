import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PressableScale } from '../components/ui/PressableScale';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { ThemeColors } from '../constants/colors';
import { elevation } from '../constants/layout';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { haptic } from '../lib/haptics';
import { usePlan } from '../context/PlanContext';
import { getStartWeight } from '../lib/api/tracking';
import { weeksToGoal, weeklyRateKg } from '../services/plan';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { FadeInItem } from '../components/ui/FadeInItem';
import { useTranslation } from 'react-i18next';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Anneau de progression (SVG)
const RING_SIZE = 132;
const RING_STROKE = 11;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

/* ─── Edit Modal ─────────────────────────────────────────────── */
function EditModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const m = useThemedStyles(makeModalStyles);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose} />
        <View style={[m.sheet, { paddingBottom: 24 + insets.bottom }]}>
          <View style={m.handle} />
          <Text style={m.sheetTitle}>{title}</Text>
          {children}
          <PressableScale haptic="light" style={m.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={m.closeBtnText}>{t('common.cancel')}</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Stat Row ───────────────────────────────────────────────── */
function StatRow({
  icon,
  label,
  value,
  valueAccent,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  valueAccent?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <PressableScale
      haptic="light"
      style={s.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={s.iconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={[s.cardValue, valueAccent && s.cardValueAccent]}>{value}</Text>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
      )}
    </PressableScale>
  );
}

/* ─── Main Screen ────────────────────────────────────────────── */
export default function WeightHistoryScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const m = useThemedStyles(makeModalStyles);
  const { profile, updateProfile } = usePlan();
  const { t } = useTranslation();

  const [editModal, setEditModal] = useState<string | null>(null);
  const [tempWeight, setTempWeight] = useState(profile.weight);
  const [tempTargetWeight, setTempTargetWeight] = useState(profile.targetWeight);
  const [startWeightDb, setStartWeightDb] = useState<number | null>(null);

  const openModal = (key: string) => {
    haptic.light();
    setEditModal(key);
  };
  const closeModal = () => {
    haptic.light();
    setEditModal(null);
  };

  // Poids de départ = plus ancien weigh-in enregistré (historique = daily_logs).
  // Tant qu'aucune pesée n'existe, on retombe sur le poids actuel → 0 % (pas
  // encore de progression possible).
  useEffect(() => {
    let alive = true;
    getStartWeight().then((w) => {
      if (alive) setStartWeightDb(w);
    });
    return () => {
      alive = false;
    };
  }, [profile.weight]);

  const currentWeight = profile.weight;
  const targetWeight = profile.targetWeight;
  const startWeight = startWeightDb ?? currentWeight;

  const remaining = Math.abs(currentWeight - targetWeight);
  const totalChange = Math.abs(startWeight - targetWeight);
  // Ratio signé : part du chemin parcourue de départ → cible (borné 0–1, donc
  // une reprise de poids ne fait pas reculer la barre sous 0, ni dépasser 100 %).
  const progressRatio =
    totalChange < 0.1
      ? remaining < 0.1
        ? 1
        : 0
      : Math.max(0, Math.min(1, (startWeight - currentWeight) / (startWeight - targetWeight)));
  const progressPct = Math.round(progressRatio * 100);

  // Rythme & durée : branchés sur la logique réelle de l'app (goalPace).
  const weeks = weeksToGoal(profile);
  const estimatedMonths = weeks > 0 ? (weeks / 4.33).toFixed(1) : '0';
  const rateKg = weeklyRateKg(profile.goalPace);
  const paceLabel = t(`setup.paces.${profile.goalPace}`);

  const goalLabel =
    currentWeight > targetWeight
      ? t('profile.personalInfo.goals.lose')
      : currentWeight < targetWeight
        ? t('profile.personalInfo.goals.gain')
        : t('profile.personalInfo.goals.maintain');

  const speedLabel = t('profile.weightHistoryPage.rateValue', {
    pace: paceLabel,
    rate: rateKg.toFixed(1),
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t('profile.settings.weightHistory')} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress arc card */}
        <FadeInItem index={0} style={s.progressCard}>
          <View style={s.progressInner}>
            <View style={s.circleWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_R}
                  stroke={colors.separator}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_R}
                  stroke={colors.orange}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - progressRatio)}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>
              <View style={s.circleCenter}>
                <Text style={s.circlePct}>{progressPct}%</Text>
                <Text style={s.circleLabel}>{t('profile.weightHistoryPage.progress')}</Text>
              </View>
            </View>
            <View style={s.progressStats}>
              <View style={s.pStat}>
                <Text style={s.pStatValue}>
                  {t('profile.personalInfo.weightValue', { count: currentWeight })}
                </Text>
                <Text style={s.pStatLabel}>{t('profile.weightHistoryPage.current')}</Text>
              </View>
              <View style={s.pStatDivider} />
              <View style={s.pStat}>
                <Text style={s.pStatValue}>
                  {t('profile.personalInfo.weightValue', { count: targetWeight })}
                </Text>
                <Text style={s.pStatLabel}>{t('profile.weightHistoryPage.target')}</Text>
              </View>
              <View style={s.pStatDivider} />
              <View style={s.pStat}>
                <Text style={[s.pStatValue, { color: colors.orange }]}>
                  {t('profile.personalInfo.weightValue', {
                    count: parseFloat(remaining.toFixed(1)),
                  })}
                </Text>
                <Text style={s.pStatLabel}>{t('profile.weightHistoryPage.remaining')}</Text>
              </View>
            </View>
          </View>
        </FadeInItem>

        {/* Stat rows — each in its own card, exactly like the reference */}
        <FadeInItem index={1}>
          <StatRow
            icon="pulse"
            label={t('profile.weightHistoryPage.currentWeight')}
            value={t('profile.personalInfo.weightValue', { count: currentWeight })}
            valueAccent
            onPress={() => openModal('weight')}
          />
          <StatRow
            icon="flag-outline"
            label={t('profile.weightHistoryPage.startWeight')}
            value={t('profile.personalInfo.weightValue', { count: startWeight })}
          />
          <StatRow
            icon="target"
            label={t('profile.weightHistoryPage.targetWeight')}
            value={t('profile.personalInfo.weightValue', { count: targetWeight })}
            onPress={() => openModal('targetWeight')}
          />
          <StatRow
            icon="trophy-outline"
            label={t('profile.weightHistoryPage.goal')}
            value={goalLabel}
          />
          <StatRow
            icon="trending-up"
            label={t('profile.weightHistoryPage.progress')}
            value={`%${progressPct}`}
            valueAccent={progressPct === 0}
          />
          <StatRow
            icon="minus-circle-outline"
            label={t('profile.weightHistoryPage.remaining')}
            value={t('profile.personalInfo.weightValue', {
              count: parseFloat(remaining.toFixed(1)),
            })}
          />
          <StatRow
            icon="lightning-bolt-outline"
            label={t('profile.weightHistoryPage.rate')}
            value={speedLabel}
          />
          <StatRow
            icon="calendar-month-outline"
            label={t('profile.weightHistoryPage.duration')}
            value={t('profile.weightHistoryPage.durationValue', {
              count: parseFloat(estimatedMonths),
            })}
          />
        </FadeInItem>
      </ScrollView>

      {/* ── Weight Modal ── */}
      <EditModal
        visible={editModal === 'weight'}
        title={`${t('profile.weightHistoryPage.currentWeight')}: ${t('profile.personalInfo.weightValue', { count: tempWeight })}`}
        onClose={closeModal}
      >
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={35}
          maximumValue={250}
          step={0.5}
          value={tempWeight}
          onValueChange={(v) => {
            setTempWeight(Math.round(v * 2) / 2);
            haptic.select();
          }}
          minimumTrackTintColor={colors.orange}
          maximumTrackTintColor={colors.separator}
          thumbTintColor={colors.white}
        />
        <Text style={m.sliderVal}>
          {t('profile.personalInfo.weightValue', { count: tempWeight })}
        </Text>
        <PressableScale
          haptic="light"
          style={m.saveBtn}
          onPress={() => {
            updateProfile({ weight: tempWeight });
            haptic.success();
            closeModal();
          }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>

      {/* ── Target Weight Modal ── */}
      <EditModal
        visible={editModal === 'targetWeight'}
        title={`${t('profile.weightHistoryPage.targetWeight')}: ${t('profile.personalInfo.weightValue', { count: tempTargetWeight })}`}
        onClose={closeModal}
      >
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={35}
          maximumValue={250}
          step={0.5}
          value={tempTargetWeight}
          onValueChange={(v) => {
            setTempTargetWeight(Math.round(v * 2) / 2);
            haptic.select();
          }}
          minimumTrackTintColor={colors.green}
          maximumTrackTintColor={colors.separator}
          thumbTintColor={colors.white}
        />
        <Text style={m.sliderVal}>
          {t('profile.personalInfo.weightValue', { count: tempTargetWeight })}
        </Text>
        <PressableScale
          haptic="light"
          style={m.saveBtn}
          onPress={() => {
            updateProfile({ targetWeight: tempTargetWeight });
            haptic.success();
            closeModal();
          }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 10 },

    // Progress card
    progressCard: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 4,
    },
    progressInner: {
      alignItems: 'center',
      gap: 20,
    },
    circleWrap: {
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    circleCenter: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circlePct: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 26,
      color: colors.textPrimary,
      lineHeight: 32,
    },
    circleLabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      color: colors.textMuted,
    },
    progressStats: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'space-around',
    },
    pStat: { alignItems: 'center', flex: 1 },
    pStatValue: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 16,
      color: colors.textPrimary,
    },
    pStatLabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    pStatDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.borderLight,
    },

    // Stat rows
    card: {
      ...elevation(colors, 1),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 17,
      paddingHorizontal: 16,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardLabel: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: colors.textPrimary,
      flex: 1,
    },
    cardValue: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: colors.textSecondary,
      maxWidth: 160,
      textAlign: 'right',
    },
    cardValueAccent: {
      color: colors.orange,
      fontFamily: 'Inter_600SemiBold',
    },
  });

/* ─── Modal Styles ───────────────────────────────────────────── */
const makeModalStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlayMedium },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 12,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.separator,
      alignSelf: 'center',
      marginBottom: 8,
    },
    sheetTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    saveBtn: {
      backgroundColor: colors.green,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
      shadowColor: colors.shadowGreen,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    saveBtnText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 15,
      color: colors.white,
    },
    closeBtn: {
      ...elevation(colors, 1),
      backgroundColor: colors.backgroundAlt,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    closeBtnText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: colors.textSecondary,
    },
    sliderVal: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 26,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
    },
  });
