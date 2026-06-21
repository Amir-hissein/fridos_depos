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
import { computeTargets } from '../services/plan';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const GOAL_OPTIONS = [
  { key: 'lose', label: 'Kilo Verme' },
  { key: 'maintain', label: 'Kilo Koruma' },
  { key: 'gain', label: 'Kilo Alma' },
];

const ACTIVITY_OPTIONS = [
  { key: 'sedentary', label: 'Hareketsiz', desc: '0–1 gün/hafta' },
  { key: 'active', label: 'Aktif', desc: '3–5 gün/hafta' },
  { key: 'cardio', label: 'Çok Aktif', desc: '6–7 gün/hafta' },
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
  return (
    <TouchableOpacity
      style={s.infoRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={s.iconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={Colors.textSecondary}
        />
      </View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

/* ─── Main Screen ───────────────────────────────────────────── */
export default function PersonalInfoScreen() {
  const { profile, updateProfile } = usePlan();

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

  const goalLabel = GOAL_OPTIONS.find(g => g.key === tempGoal)?.label ?? 'Kilo Verme';
  const activityLabel = ACTIVITY_OPTIONS.find(a => a.key === tempActivity)?.label ?? 'Aktif';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kişisel Bilgiler</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Group 1 - Physique */}
        <View style={s.group}>
          <InfoRow
            icon={tempSex === 'male' ? 'human-male' : 'human-female'}
            label="Cinsiyet"
            value={tempSex === 'male' ? 'Erkek' : 'Kadın'}
            onPress={() => openModal('sex')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="calendar-account-outline"
            label="Yaş"
            value={`${tempAge} yaş`}
            onPress={() => openModal('age')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="human-male-height-variant"
            label="Boy"
            value={`${profile.height} cm`}
            onPress={() => openModal('height')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="weight-kilogram"
            label="Ağırlık"
            value={`${profile.weight} kg`}
            onPress={() => openModal('weight')}
          />
        </View>

        {/* Info Group 2 - Hedefler */}
        <View style={s.group}>
          <InfoRow
            icon="trending-down"
            label="Amaç"
            value={goalLabel}
            onPress={() => openModal('goal')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="scale-balance"
            label="Hedef Kilo"
            value={`${profile.targetWeight} kg`}
            onPress={() => openModal('targetWeight')}
          />
          <View style={s.divider} />
          <InfoRow
            icon="lightning-bolt-outline"
            label="Aktivite Seviyesi"
            value={activityLabel}
            onPress={() => openModal('activity')}
          />
        </View>

        {/* Macros Summary */}
        <View style={s.macrosCard}>
          <Text style={s.macrosTitle}>Günlük Hedefleriniz</Text>
          <Text style={s.macrosSub}>Bilgilerinize göre hesaplandı</Text>
          <View style={s.macrosGrid}>
            {[
              { icon: 'fire' as IconName, label: 'Kalori', value: `${targets.kcal}`, unit: 'kcal', color: Colors.orange },
              { icon: 'bread-slice' as IconName, label: 'Karbonhidrat', value: `${targets.carbs}`, unit: 'g', color: '#F4D03F' },
              { icon: 'food-steak' as IconName, label: 'Protein', value: `${targets.protein}`, unit: 'g', color: '#4A90D9' },
              { icon: 'water' as IconName, label: 'Yağ', value: `${targets.fat}`, unit: 'g', color: '#9B59B6' },
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
        </View>
      </ScrollView>

      {/* ── Sex Modal ── */}
      <EditModal visible={editModal === 'sex'} title="Cinsiyet" onClose={closeModal}>
        {(['male', 'female'] as const).map(sx => (
          <TouchableOpacity
            key={sx}
            style={[m.optionRow, tempSex === sx && m.optionRowActive]}
            onPress={() => { haptic.select(); setTempSex(sx); }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={sx === 'male' ? 'gender-male' : 'gender-female'}
              size={22}
              color={tempSex === sx ? Colors.green : Colors.textSecondary}
            />
            <Text style={[m.optionText, tempSex === sx && m.optionTextActive]}>
              {sx === 'male' ? 'Erkek' : 'Kadın'}
            </Text>
            {tempSex === sx && (
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.green} />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={m.saveBtn}
          onPress={() => { updateProfile({ sex: tempSex }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </EditModal>

      {/* ── Age Modal ── */}
      <EditModal visible={editModal === 'age'} title={`Yaş: ${tempAge}`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={14}
          maximumValue={100}
          step={1}
          value={tempAge}
          onValueChange={v => { setTempAge(Math.round(v)); haptic.select(); }}
          minimumTrackTintColor={Colors.orange}
          maximumTrackTintColor={Colors.separator}
          thumbTintColor={Colors.white}
        />
        <Text style={m.sliderVal}>{tempAge} Yaş</Text>
        <TouchableOpacity
          style={m.saveBtn}
          onPress={() => { updateProfile({ age: tempAge }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </EditModal>

      {/* ── Height Modal ── */}
      <EditModal visible={editModal === 'height'} title={`Boy: ${tempHeight} cm`} onClose={closeModal}>
        <Slider
          style={{ marginHorizontal: 8, marginVertical: 20 }}
          minimumValue={50}
          maximumValue={250}
          step={1}
          value={tempHeight}
          onValueChange={v => { setTempHeight(Math.round(v)); haptic.select(); }}
          minimumTrackTintColor={Colors.green}
          maximumTrackTintColor={Colors.separator}
          thumbTintColor={Colors.white}
        />
        <Text style={m.sliderVal}>{tempHeight} cm</Text>
        <TouchableOpacity
          style={m.saveBtn}
          onPress={() => { updateProfile({ height: tempHeight }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </EditModal>

      {/* ── Weight Modal ── */}
      <EditModal visible={editModal === 'weight'} title={`Ağırlık: ${tempWeight} kg`} onClose={closeModal}>
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
          minimumTrackTintColor="#E53935"
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

      {/* ── Goal Modal ── */}
      <EditModal visible={editModal === 'goal'} title="Amaç" onClose={closeModal}>
        {GOAL_OPTIONS.map(g => (
          <TouchableOpacity
            key={g.key}
            style={[m.optionRow, tempGoal === g.key && m.optionRowActive]}
            onPress={() => { haptic.select(); setTempGoal(g.key); }}
            activeOpacity={0.8}
          >
            <Text style={[m.optionText, tempGoal === g.key && m.optionTextActive]}>{g.label}</Text>
            {tempGoal === g.key && (
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.green} />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={m.saveBtn} onPress={() => { haptic.success(); closeModal(); }} activeOpacity={0.8}>
          <Text style={m.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </EditModal>

      {/* ── Activity Modal ── */}
      <EditModal visible={editModal === 'activity'} title="Aktivite Seviyesi" onClose={closeModal}>
        {ACTIVITY_OPTIONS.map(a => (
          <TouchableOpacity
            key={a.key}
            style={[m.optionRow, tempActivity === a.key && m.optionRowActive]}
            onPress={() => { haptic.select(); setTempActivity(a.key as any); }}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={[m.optionText, tempActivity === a.key && m.optionTextActive]}>{a.label}</Text>
              <Text style={m.optionDesc}>{a.desc}</Text>
            </View>
            {tempActivity === a.key && (
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.green} />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={m.saveBtn}
          onPress={() => { updateProfile({ activity: tempActivity }); haptic.success(); closeModal(); }}
          activeOpacity={0.8}
        >
          <Text style={m.saveBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </EditModal>
    </SafeAreaView>
  );
}

/* ─── Styles ────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

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

  group: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  infoValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    maxWidth: 140,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 68,
  },

  macrosCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  macrosTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  macrosSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
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
    backgroundColor: Colors.backgroundAlt,
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
    color: Colors.textPrimary,
  },
  macroUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
});

/* ─── Modal Styles ─────────────────────────────────────────── */
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
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
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionRowActive: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.green,
  },
  optionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  optionTextActive: {
    color: Colors.green,
  },
  optionDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
