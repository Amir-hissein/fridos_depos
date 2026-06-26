import React, { useState } from 'react';
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
import { PressableScale } from '../components/ui/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Colors, ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { Radii } from '../constants/layout';
import { FadeInItem } from '../components/ui/FadeInItem';
import { BottomSheet } from '../components/ui/BottomSheet';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { haptic } from '../lib/haptics';
import { usePlan } from '../context/PlanContext';
import { computeTargets } from '../services/plan';
import { useTranslation } from 'react-i18next';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const GOAL_OPTIONS = [
  { key: 'lose', labelKey: 'profile.personalInfo.goals.lose' },
  { key: 'maintain', labelKey: 'profile.personalInfo.goals.maintain' },
  { key: 'gain', labelKey: 'profile.personalInfo.goals.gain' },
];

const ACTIVITY_OPTIONS = [
  { key: 'sedentary', labelKey: 'profile.personalInfo.activityOptions.sedentary.label', descKey: 'profile.personalInfo.activityOptions.sedentary.desc' },
  { key: 'active', labelKey: 'profile.personalInfo.activityOptions.active.label', descKey: 'profile.personalInfo.activityOptions.active.desc' },
  { key: 'cardio', labelKey: 'profile.personalInfo.activityOptions.cardio.label', descKey: 'profile.personalInfo.activityOptions.cardio.desc' },
];

/* ─── Edit Modal ────────────────────────────────────────────── */
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
  const m = useThemedStyles(makeModalStyles);
  return (
    <BottomSheet visible={visible} onClose={onClose} contentStyle={{ gap: 12 }}>
      <Text style={m.sheetTitle}>{title}</Text>
      {children}
      <PressableScale haptic="light" style={m.closeBtn} onPress={onClose} activeOpacity={0.8}>
        <Text style={m.closeBtnText}>{t('common.cancel')}</Text>
      </PressableScale>
    </BottomSheet>
  );
}

/* ─── Info Row ──────────────────────────────────────────────── */
function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <PressableScale haptic="light"
      style={s.infoRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={s.iconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.textSecondary}
        />
      </View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
      )}
    </PressableScale>
  );
}

/* ─── Main Screen ───────────────────────────────────────────── */
export default function PersonalInfoScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const m = useThemedStyles(makeModalStyles);
  const { profile, updateProfile } = usePlan();
  const { t } = useTranslation();

  const [editModal, setEditModal] = useState<string | null>(null);
  const [tempHeight, setTempHeight] = useState(profile.height);
  const [tempWeight, setTempWeight] = useState(profile.weight);
  const [tempTargetWeight, setTempTargetWeight] = useState(profile.targetWeight);
  const [tempAge, setTempAge] = useState(profile.age);
  const [tempGoal, setTempGoal] = useState('lose');
  const [tempActivity, setTempActivity] = useState(profile.activity);
  const [tempSex, setTempSex] = useState<'male' | 'female'>(profile.sex);

  const targets = computeTargets(profile);

  const openModal = (key: string) => {
    haptic.light();
    setEditModal(key);
  };
  const closeModal = () => {
    haptic.light();
    setEditModal(null);
  };

  const goalLabel = tempGoal ? t(`profile.personalInfo.goals.${tempGoal}`) : '';
  const activityLabel = tempActivity ? t(`profile.personalInfo.activityOptions.${tempActivity}.label`) : '';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t('profile.settings.personalInfo')} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Group 1 - Physique */}
        <FadeInItem index={0} style={s.group}>
          <InfoRow
            icon={tempSex === 'male' ? 'human-male' : 'human-female'}
            label={t('profile.personalInfo.gender')}
            value={tempSex === 'male' ? t('profile.personalInfo.male') : t('profile.personalInfo.female')}
            onPress={() => openModal('sex')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="calendar-account-outline"
            label={t('profile.personalInfo.age')}
            value={t('profile.personalInfo.ageValue', { count: tempAge })}
            onPress={() => openModal('age')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="human-male-height-variant"
            label={t('profile.personalInfo.height')}
            value={t('profile.personalInfo.heightValue', { count: profile.height })}
            onPress={() => openModal('height')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="weight-kilogram"
            label={t('profile.personalInfo.weight')}
            value={t('profile.personalInfo.weightValue', { count: profile.weight })}
            onPress={() => openModal('weight')}
          />
        </FadeInItem>

        {/* Info Group 2 - Hedefler */}
        <FadeInItem index={1} style={s.group}>
          <InfoRow
            icon="trending-down"
            label={t('profile.personalInfo.goal')}
            value={goalLabel}
            onPress={() => openModal('goal')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="scale-balance"
            label={t('profile.personalInfo.targetWeight')}
            value={t('profile.personalInfo.weightValue', { count: profile.targetWeight })}
            onPress={() => openModal('targetWeight')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="lightning-bolt-outline"
            label={t('profile.personalInfo.activity')}
            value={activityLabel}
            onPress={() => openModal('activity')}
          />
        </FadeInItem>

        {/* Macros Summary */}
        <FadeInItem index={2} style={s.macrosCard}>
          <Text style={s.macrosTitle}>{t('profile.personalInfo.targets.title')}</Text>
          <Text style={s.macrosSub}>{t('profile.personalInfo.targets.sub')}</Text>
          <View style={s.macrosGrid}>
            {[
              { icon: 'fire' as IconName, label: t('profile.personalInfo.targets.calorie'), value: `${targets.kcal}`, unit: 'kcal', color: colors.orange },
              { icon: 'bread-slice' as IconName, label: t('profile.personalInfo.targets.carbs'), value: `${targets.carbs}`, unit: 'g', color: colors.gold },
              { icon: 'food-steak' as IconName, label: t('profile.personalInfo.targets.protein'), value: `${targets.protein}`, unit: 'g', color: colors.blue },
              { icon: 'water' as IconName, label: t('profile.personalInfo.targets.fat'), value: `${targets.fat}`, unit: 'g', color: colors.purple },
            ].map(m => (
              <View key={m.label} style={s.macroBox}>
                <View style={[s.macroIconWrap, { backgroundColor: m.color + '20' }]}>
                  <MaterialCommunityIcons name={m.icon} size={18} color={m.color} />
                </View>
                <Text style={s.macroValue}>{m.value}<Text style={s.macroUnit}>{m.unit}</Text></Text>
                <Text style={s.macroLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </FadeInItem>
      </ScrollView>

      {/* ── Sex Modal ── */}
      <EditModal visible={editModal === 'sex'} title={t('profile.personalInfo.gender')} onClose={closeModal}>
        {(['male', 'female'] as const).map(sx => (
          <PressableScale haptic="light"
            key={sx}
            style={[m.optionRow, tempSex === sx && m.optionRowActive]}
            onPress={() => { haptic.select(); setTempSex(sx); }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={sx === 'male' ? 'gender-male' : 'gender-female'}
              size={22}
              color={tempSex === sx ? colors.green : colors.textSecondary}
            />
            <Text style={[m.optionText, tempSex === sx && m.optionTextActive]}>
              {sx === 'male' ? t('profile.personalInfo.male') : t('profile.personalInfo.female')}
            </Text>
            {tempSex === sx && (
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.green} />
            )}
          </PressableScale>
        ))}
        <PressableScale haptic="light"
          style={m.saveBtn}
          onPress={() => { updateProfile({ sex: tempSex }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>

      {/* ── Age Modal ── */}
      <EditModal visible={editModal === 'age'} title={`${t('profile.personalInfo.age')}: ${t('profile.personalInfo.ageValue', { count: tempAge })}`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={14}
          maximumValue={100}
          step={1}
          value={tempAge}
          onValueChange={v => { setTempAge(Math.round(v)); haptic.select(); }}
          minimumTrackTintColor={colors.orange}
          maximumTrackTintColor={colors.separator}
          thumbTintColor={colors.white}
        />
        <Text style={m.sliderVal}>{t('profile.personalInfo.ageValue', { count: tempAge })}</Text>
        <PressableScale haptic="light"
          style={m.saveBtn}
          onPress={() => { updateProfile({ age: tempAge }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>

      {/* ── Height Modal ── */}
      <EditModal visible={editModal === 'height'} title={`${t('profile.personalInfo.height')}: ${t('profile.personalInfo.heightValue', { count: tempHeight })}`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={50}
          maximumValue={250}
          step={1}
          value={tempHeight}
          onValueChange={v => { setTempHeight(Math.round(v)); haptic.select(); }}
          minimumTrackTintColor={colors.green}
          maximumTrackTintColor={colors.separator}
          thumbTintColor={colors.white}
        />
        <Text style={m.sliderVal}>{t('profile.personalInfo.heightValue', { count: tempHeight })}</Text>
        <PressableScale haptic="light"
          style={m.saveBtn}
          onPress={() => { updateProfile({ height: tempHeight }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>

      {/* ── Weight Modal ── */}
      <EditModal visible={editModal === 'weight'} title={`${t('profile.personalInfo.weight')}: ${t('profile.personalInfo.weightValue', { count: tempWeight })}`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={35}
          maximumValue={250}
          step={0.5}
          value={tempWeight}
          onValueChange={v => { setTempWeight(Math.round(v * 2) / 2); haptic.select(); }}
          minimumTrackTintColor={colors.orange}
          maximumTrackTintColor={colors.separator}
          thumbTintColor={colors.white}
        />
        <Text style={m.sliderVal}>{t('profile.personalInfo.weightValue', { count: tempWeight })}</Text>
        <PressableScale haptic="light"
          style={m.saveBtn}
          onPress={() => { updateProfile({ weight: tempWeight }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>

      {/* ── Target Weight Modal ── */}
      <EditModal visible={editModal === 'targetWeight'} title={`${t('profile.personalInfo.targetWeight')}: ${t('profile.personalInfo.weightValue', { count: tempTargetWeight })}`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={35}
          maximumValue={250}
          step={0.5}
          value={tempTargetWeight}
          onValueChange={v => { setTempTargetWeight(Math.round(v * 2) / 2); haptic.select(); }}
          minimumTrackTintColor={colors.red}
          maximumTrackTintColor={colors.separator}
          thumbTintColor={colors.white}
        />
        <Text style={m.sliderVal}>{t('profile.personalInfo.weightValue', { count: tempTargetWeight })}</Text>
        <PressableScale haptic="light"
          style={m.saveBtn}
          onPress={() => { updateProfile({ targetWeight: tempTargetWeight }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>

      {/* ── Goal Modal ── */}
      <EditModal visible={editModal === 'goal'} title={t('profile.personalInfo.goal')} onClose={closeModal}>
        {GOAL_OPTIONS.map(g => (
          <PressableScale haptic="light"
            key={g.key}
            style={[m.optionRow, tempGoal === g.key && m.optionRowActive]}
            onPress={() => { haptic.select(); setTempGoal(g.key); }}
            activeOpacity={0.8}
          >
            <Text style={[m.optionText, tempGoal === g.key && m.optionTextActive]}>{t(g.labelKey)}</Text>
            {tempGoal === g.key && (
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.green} />
            )}
          </PressableScale>
        ))}
        <PressableScale haptic="light" style={m.saveBtn} onPress={() => { haptic.success(); closeModal(); }} activeOpacity={0.8}>
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>

      {/* ── Activity Modal ── */}
      <EditModal visible={editModal === 'activity'} title={t('profile.personalInfo.activity')} onClose={closeModal}>
        {ACTIVITY_OPTIONS.map(a => (
          <PressableScale haptic="light"
            key={a.key}
            style={[m.optionRow, tempActivity === a.key && m.optionRowActive]}
            onPress={() => { haptic.select(); setTempActivity(a.key as any); }}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={[m.optionText, tempActivity === a.key && m.optionTextActive]}>{t(a.labelKey)}</Text>
              <Text style={m.optionDesc}>{t(a.descKey)}</Text>
            </View>
            {tempActivity === a.key && (
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.green} />
            )}
          </PressableScale>
        ))}
        <PressableScale haptic="light"
          style={m.saveBtn}
          onPress={() => { updateProfile({ activity: tempActivity }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>{t('common.save')}</Text>
        </PressableScale>
      </EditModal>
    </SafeAreaView>
  );
}

/* ─── Styles ────────────────────────────────────────────────── */
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  group: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  infoValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 140,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 68,
  },

  macrosCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  macrosTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  macrosSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  macroBox: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  macroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  macroValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  macroUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});

/* ─── Modal Styles ─────────────────────────────────────────── */
const makeModalStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayMedium,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: Radii.cardLarge,
    borderTopRightRadius: Radii.cardLarge,
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
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
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
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  optionRowActive: {
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
  },
  optionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  optionTextActive: {
    color: colors.green,
  },
  optionDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
