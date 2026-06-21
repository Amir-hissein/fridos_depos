import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Keyboard,
  DimensionValue,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { useApp } from '../../context/AppContext';
import { usePlan } from '../../context/PlanContext';
import { computeBMI } from '../../services/plan';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const USER_ID = 'SkUS5altOAXXHbETjTRXmD6ju7D3';

interface SettingItem { icon: IconName; label: string; route?: string }

const SETTINGS_TOP: SettingItem[] = [
  { icon: 'account',  label: 'Kişisel Bilgiler', route: '/personal-info' },
  { icon: 'target',   label: 'Hedef Yenileme',   route: '/(onboarding)/setup' },
  { icon: 'history',  label: 'Kilo Geçmişi', route: '/weight-history' },
  { icon: 'translate', label: 'Dil Tercihi' },
];

const SETTINGS_BOTTOM: SettingItem[] = [
  { icon: 'help-circle-outline',  label: 'Medikal Kaynaklar' },
  { icon: 'email',                label: 'İletişim ve Destek' },
  { icon: 'shield-lock-outline',  label: 'Gizlilik Politikası' },
  { icon: 'file-document-outline', label: 'Şartlar ve Koşullar' },
];

const PREMIUM_PERKS = [
  'Yapay zeka özelliklerine sınırsız erişim',
  'Sana özel beslenme planı',
  "1000'den fazla tarife erişim",
  'Reklamsız kullanım',
];

const BMI_CATEGORY_COLOR: Record<string, string> = {
  Underweight: '#4A90D9',
  Healthy: Colors.green,
  Overweight: Colors.orange,
  Obese: '#E53935',
};

const BMI_CATEGORY_LABEL: Record<string, string> = {
  Underweight: 'Çok Zayıf',
  Healthy: 'Sağlıklı',
  Overweight: 'Hafif kilolu',
  Obese: 'Obez',
};

const BMI_LEGEND: { color: string; label: string }[] = [
  { color: '#4A90D9', label: 'Çok Zayıf' },
  { color: Colors.green, label: 'Sağlıklı' },
  { color: Colors.orange, label: 'Hafif kilolu' },
  { color: '#E53935', label: 'Obez' },
];

/* ─── Setting row (standalone card) ───────────────────────────── */
function SettingCard({ item }: { item: SettingItem }) {
  return (
    <PressableScale
      style={s.settingCard}
      scaleTo={0.98}
      haptic="light"
      onPress={() => item.route && router.push(item.route as never)}
    >
      <MaterialCommunityIcons name={item.icon} size={24} color={Colors.white} />
      <Text style={s.settingLabel}>{item.label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const { isPremium, setPremium } = useApp();
  const { profile } = usePlan();
  const bmi = computeBMI(profile.weight, profile.height);

  // ── Edit mode ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('Amir Hissein Abakar');
  const [draftEmail, setDraftEmail] = useState('amirhisseinabakar@gmail.com');
  const [savedName, setSavedName] = useState('Amir Hissein Abakar');
  const [savedEmail, setSavedEmail] = useState('amirhisseinabakar@gmail.com');
  const [copied, setCopied] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const startEdit = () => {
    haptic.select();
    setDraftName(savedName);
    setDraftEmail(savedEmail);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const nameOk = draftName.trim().length >= 2;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim());
    if (!nameOk || !emailOk) { haptic.light(); shake(); return; }
    haptic.success();
    setSavedName(draftName.trim());
    setSavedEmail(draftEmail.trim());
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const cancelEdit = () => {
    haptic.light();
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const copyId = async () => {
    haptic.success();
    await Clipboard.setStringAsync(USER_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={s.title}>Ayarlar</Text>

        {/* Profile card */}
        <FadeInItem index={0}>
          <Animated.View style={[s.profileCard, { transform: [{ translateX: shakeAnim }] }]}>
            <View style={s.profileTop}>
              <View style={{ flex: 1 }}>
                {isEditing ? (
                  <TextInput
                    style={s.nameInput}
                    value={draftName}
                    onChangeText={setDraftName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    placeholder="Ad Soyad"
                    placeholderTextColor={Colors.textMuted}
                    autoFocus
                  />
                ) : (
                  <Text style={s.name}>{savedName}</Text>
                )}
                {!isEditing && (
                  isPremium ? (
                    <View style={s.premiumBadge}>
                      <MaterialCommunityIcons name="crown" size={11} color={Colors.goldDark} />
                      <Text style={s.premiumText}>PREMIUM</Text>
                    </View>
                  ) : (
                    <View style={s.freeBadge}>
                      <Text style={s.freeBadgeText}>Ücretsiz</Text>
                    </View>
                  )
                )}
              </View>
              {!isEditing && (
                <TouchableOpacity style={s.editBtn} onPress={startEdit} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="pencil" size={17} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <>
                <TextInput
                  style={s.emailInput}
                  value={draftEmail}
                  onChangeText={setDraftEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={saveEdit}
                  placeholder="E-posta adresi"
                  placeholderTextColor={Colors.textMuted}
                />
                <View style={s.editActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit} activeOpacity={0.8}>
                    <Text style={s.cancelText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={saveEdit} activeOpacity={0.8}>
                    <Text style={s.saveText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity style={s.idBlock} activeOpacity={0.7} onPress={copyId}>
                <Text style={s.idText} numberOfLines={1}>Kullanıcı ID: {USER_ID}</Text>
                <Text style={s.copyHint}>{copied ? 'Kopyalandı ✓' : 'Kopyalamak için dokunun'}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </FadeInItem>

        {/* Subscription card */}
        <FadeInItem index={1}>
          {isPremium ? (
            <View style={s.premiumActiveCard}>
              <View style={s.subRow}>
                <View style={s.subIconWrap}>
                  <MaterialCommunityIcons name="crown" size={22} color={Colors.goldDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.subTitle}>Fridos Premium</Text>
                  <Text style={s.subSub}>Tüm özellikler açık</Text>
                </View>
                <PressableScale
                  style={s.manageBtn}
                  scaleTo={0.95}
                  haptic="light"
                  onPress={() => { haptic.select(); setPremium(false); }}
                >
                  <Text style={s.manageText}>Yönet</Text>
                </PressableScale>
              </View>
            </View>
          ) : (
            <View style={s.upsellCard}>
              <LinearGradient
                colors={['rgba(244,183,64,0.18)', 'rgba(244,183,64,0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.crownWrap}>
                <MaterialCommunityIcons name="crown" size={92} color={Colors.gold} />
                <MaterialCommunityIcons name="star" size={24} color={Colors.surface} style={s.crownStar} />
              </View>
              <Text style={s.upsellTitle}>Fridos Premium'a Katıl!</Text>
              <View style={s.perks}>
                {PREMIUM_PERKS.map(p => (
                  <Text key={p} style={s.perkText}>+ {p}</Text>
                ))}
              </View>
              <PressableScale
                style={s.joinBtn}
                scaleTo={0.97}
                haptic="medium"
                onPress={() => router.push('/(tabs)/pro')}
              >
                <LinearGradient
                  colors={[Colors.gold, '#E8A020']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={s.joinText}>Hemen Katıl</Text>
              </PressableScale>
            </View>
          )}
        </FadeInItem>

        <FadeInItem index={2} style={s.quickRow}>
          <PressableScale
            style={s.quickBtn}
            onPress={() => router.push('/fridge')}
            scaleTo={0.97}
            haptic="light"
          >
            <MaterialCommunityIcons name="fridge" size={22} color={Colors.white} />
            <Text style={s.quickLabel}>Buzdolabım</Text>
          </PressableScale>
          <PressableScale
            style={s.quickBtn}
            onPress={() => router.push('/(tabs)/shopping')}
            scaleTo={0.97}
            haptic="light"
          >
            <MaterialCommunityIcons name="cart-outline" size={22} color={Colors.white} />
            <Text style={s.quickLabel}>Market Listesi</Text>
          </PressableScale>
        </FadeInItem>

        {/* Settings — top group */}
        {SETTINGS_TOP.map((item, i) => (
          <FadeInItem key={item.label} index={3 + i}>
            <SettingCard item={item} />
          </FadeInItem>
        ))}

        {/* BMI card */}
        <FadeInItem index={7}>
          <View style={s.bmiCard}>
            <TouchableOpacity
              style={s.bmiHeader}
              activeOpacity={0.7}
              onPress={() => { haptic.light(); router.push('/bmi' as any); }}
            >
              <View style={s.bmiHeaderLeft}>
                <Text style={s.bmiTitle}>BMI</Text>
                <Text style={s.bmiSubtitle}>(Vücut Kitle İndeksi)</Text>
              </View>
              <View style={s.bmiArrowBtn}>
                <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <View style={s.bmiValueRow}>
              <Text style={s.bmiValue}>{bmi.value}</Text>
              <View style={[s.bmiPill, { backgroundColor: BMI_CATEGORY_COLOR[bmi.category] }]}>
                <Text style={s.bmiPillText}>{BMI_CATEGORY_LABEL[bmi.category] ?? bmi.category}</Text>
              </View>
            </View>

            <View style={s.bmiScale}>
              <LinearGradient
                colors={['#4A90D9', Colors.green, '#F4D03F', Colors.orange, '#E53935']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[s.bmiMarker, { left: `${bmi.position * 100}%` as DimensionValue }]} />
            </View>

            <View style={s.bmiLegend}>
              {BMI_LEGEND.map(l => (
                <View key={l.label} style={s.bmiLegendItem}>
                  <View style={[s.bmiLegendDot, { backgroundColor: l.color }]} />
                  <Text style={s.bmiLegendTxt}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInItem>

        {/* Settings — bottom group */}
        {SETTINGS_BOTTOM.map((item, i) => (
          <FadeInItem key={item.label} index={8 + i}>
            <SettingCard item={item} />
          </FadeInItem>
        ))}

        {/* Logout / Delete */}
        <FadeInItem index={12} style={s.dangerRow}>
          <PressableScale style={s.logoutBtn} scaleTo={0.97} haptic="light" onPress={() => router.replace('/(onboarding)/welcome')}>
            <MaterialCommunityIcons name="logout" size={18} color={Colors.textPrimary} />
            <Text style={s.logoutText}>Çıkış Yap</Text>
          </PressableScale>
          <PressableScale style={s.deleteBtn} scaleTo={0.97} haptic="light">
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF6B6B" />
            <Text style={s.deleteText}>Hesabı Sil</Text>
          </PressableScale>
        </FadeInItem>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130 },

  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 34,
    color: Colors.textPrimary,
    marginBottom: 22,
  },

  // ── Profile card ──────────────────────────────────────────────
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 18,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  nameInput: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.green,
    paddingVertical: 2,
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  premiumText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.goldDark,
    letterSpacing: 0.4,
  },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.separatorLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9,
  },
  freeBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idBlock: {
    marginTop: 14,
  },
  idText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  copyHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  emailInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: 4,
    marginTop: 12,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  saveBtn: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.white,
  },

  // ── Premium upsell card ───────────────────────────────────────
  upsellCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(244,183,64,0.45)',
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  crownWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  crownStar: {
    position: 'absolute',
    top: 38,
  },
  upsellTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
  },
  perks: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  perkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  joinBtn: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  joinText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.white,
  },

  // ── Premium active card ───────────────────────────────────────
  premiumActiveCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 22,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  manageBtn: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ── Quick actions ─────────────────────────────────────────────
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // ── Setting card (standalone) ─────────────────────────────────
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  settingLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },

  // ── BMI card ──────────────────────────────────────────────────
  bmiCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 12,
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bmiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flex: 1,
  },
  bmiTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  bmiSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  bmiArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  bmiValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 44,
    color: Colors.textPrimary,
  },
  bmiPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  bmiPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.white,
  },
  bmiScale: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  bmiMarker: {
    position: 'absolute',
    top: -3,
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.white,
    marginLeft: -1.5,
  },
  bmiLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bmiLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bmiLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bmiLegendTxt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: Colors.textSecondary,
  },

  // ── Danger zone ───────────────────────────────────────────────
  dangerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    alignSelf: 'stretch',
    width: '100%',
  },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(229,57,53,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(229,57,53,0.28)',
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  deleteText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FF6B6B',
  },
});
