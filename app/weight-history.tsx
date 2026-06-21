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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Colors } from '../constants/colors';
import { haptic } from '../lib/haptics';
import { usePlan } from '../context/PlanContext';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onClose} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.sheetTitle}>{title}</Text>
          {children}
          <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={m.closeBtnText}>Kapat</Text>
          </TouchableOpacity>
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
  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={s.iconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={Colors.textSecondary} />
      </View>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={[s.cardValue, valueAccent && s.cardValueAccent]}>{value}</Text>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

/* ─── Main Screen ────────────────────────────────────────────── */
export default function WeightHistoryScreen() {
  const { profile, updateProfile } = usePlan();

  const [editModal, setEditModal] = useState<string | null>(null);
  const [tempWeight, setTempWeight] = useState(profile.weight);
  const [tempTargetWeight, setTempTargetWeight] = useState(profile.targetWeight);

  const openModal = (key: string) => { haptic.light(); setEditModal(key); };
  const closeModal = () => { haptic.light(); setEditModal(null); };

  // Computed values
  const startWeight = profile.weight; // On considère que le poids actuel = poids de départ si pas d'historique
  const currentWeight = profile.weight;
  const targetWeight = profile.targetWeight;
  const remaining = Math.abs(currentWeight - targetWeight);
  const totalToLose = Math.abs(startWeight - targetWeight);
  const progressPct = totalToLose > 0
    ? Math.round(((totalToLose - remaining) / totalToLose) * 100)
    : 0;
  // Hız: 1 kg/semaine → estimation
  const weeklyRate = 1;
  const estimatedMonths = remaining > 0 ? (remaining / (weeklyRate * 4.33)).toFixed(1) : '0';

  const goalLabel =
    currentWeight > targetWeight ? 'Kilo Verme' :
    currentWeight < targetWeight ? 'Kilo Alma' : 'Kilo Koruma';

  const speedLabel = 'Hızlı (Haftada 1 kg)';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kilo Geçmişi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress arc card */}
        <View style={s.progressCard}>
          <View style={s.progressInner}>
            <View style={s.circleWrap}>
              {/* Outer ring */}
              <View style={s.ringBg} />
              {/* Progress fill — visual only, based on % */}
              <View style={[s.ringFill, {
                borderTopColor: progressPct > 0 ? Colors.orange : 'transparent',
                borderRightColor: progressPct > 25 ? Colors.orange : 'transparent',
                borderBottomColor: progressPct > 50 ? Colors.orange : 'transparent',
                borderLeftColor: progressPct > 75 ? Colors.orange : 'transparent',
              }]} />
              <View style={s.circleCenter}>
                <Text style={s.circlePct}>{progressPct}%</Text>
                <Text style={s.circleLabel}>İlerleme</Text>
              </View>
            </View>
            <View style={s.progressStats}>
              <View style={s.pStat}>
                <Text style={s.pStatValue}>{currentWeight} kg</Text>
                <Text style={s.pStatLabel}>Şu an</Text>
              </View>
              <View style={s.pStatDivider} />
              <View style={s.pStat}>
                <Text style={s.pStatValue}>{targetWeight} kg</Text>
                <Text style={s.pStatLabel}>Hedef</Text>
              </View>
              <View style={s.pStatDivider} />
              <View style={s.pStat}>
                <Text style={[s.pStatValue, { color: Colors.orange }]}>{remaining.toFixed(1)} kg</Text>
                <Text style={s.pStatLabel}>Kalan</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stat rows — each in its own card, exactly like the reference */}
        <StatRow
          icon="pulse"
          label="Mevcut Kilo"
          value={`${currentWeight} kg`}
          valueAccent
          onPress={() => openModal('weight')}
        />
        <StatRow
          icon="flag-outline"
          label="Başlangıç Kilosu"
          value={`${startWeight} kg`}
        />
        <StatRow
          icon="target"
          label="Hedef Kilo"
          value={`${targetWeight} kg`}
          onPress={() => openModal('targetWeight')}
        />
        <StatRow
          icon="trophy-outline"
          label="Hedef"
          value={goalLabel}
        />
        <StatRow
          icon="trending-up"
          label="İlerleme"
          value={`%${progressPct}`}
          valueAccent={progressPct === 0}
        />
        <StatRow
          icon="minus-circle-outline"
          label="Kalan"
          value={`${remaining.toFixed(1)} kg`}
        />
        <StatRow
          icon="lightning-bolt-outline"
          label="Hız"
          value={speedLabel}
        />
        <StatRow
          icon="calendar-month-outline"
          label="Tahmini Süre"
          value={`${estimatedMonths} ay`}
        />
      </ScrollView>

      {/* ── Weight Modal ── */}
      <EditModal visible={editModal === 'weight'} title={`Mevcut Kilo: ${tempWeight} kg`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={35}
          maximumValue={250}
          step={0.5}
          value={tempWeight}
          onValueChange={v => { setTempWeight(Math.round(v * 2) / 2); haptic.select(); }}
          minimumTrackTintColor={Colors.orange}
          maximumTrackTintColor={Colors.separator}
          thumbTintColor={Colors.white}
        />
        <Text style={m.sliderVal}>{tempWeight} kg</Text>
        <TouchableOpacity
          style={m.saveBtn}
          onPress={() => { updateProfile({ weight: tempWeight }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </EditModal>

      {/* ── Target Weight Modal ── */}
      <EditModal visible={editModal === 'targetWeight'} title={`Hedef Kilo: ${tempTargetWeight} kg`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={35}
          maximumValue={250}
          step={0.5}
          value={tempTargetWeight}
          onValueChange={v => { setTempTargetWeight(Math.round(v * 2) / 2); haptic.select(); }}
          minimumTrackTintColor={Colors.green}
          maximumTrackTintColor={Colors.separator}
          thumbTintColor={Colors.white}
        />
        <Text style={m.sliderVal}>{tempTargetWeight} kg</Text>
        <TouchableOpacity
          style={m.saveBtn}
          onPress={() => { updateProfile({ targetWeight: tempTargetWeight }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </EditModal>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 10 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },

  // Progress card
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 4,
  },
  progressInner: {
    alignItems: 'center',
    gap: 20,
  },
  circleWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringBg: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: Colors.backgroundAlt,
  },
  ringFill: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: Colors.orange,
    transform: [{ rotate: '-90deg' }],
  },
  circleCenter: {
    alignItems: 'center',
  },
  circlePct: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  circleLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
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
    color: Colors.textPrimary,
  },
  pStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },

  // Stat rows
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 17,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    maxWidth: 160,
    textAlign: 'right',
  },
  cardValueAccent: {
    color: Colors.orange,
    fontFamily: 'Inter_600SemiBold',
  },
});

/* ─── Modal Styles ───────────────────────────────────────────── */
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center', marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.white,
  },
  closeBtn: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  closeBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  sliderVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
});
