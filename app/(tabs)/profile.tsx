import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles, ThemeMode } from '../../context/ThemeContext';
import { Radii, elevation } from '../../constants/layout';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { PressableScale } from '../../components/ui/PressableScale';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../context/AuthContext';
import { deleteAccount, updateAccount } from '../../lib/api/auth';
import { useApp } from '../../context/AppContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { usePlan } from '../../context/PlanContext';
import { useFeedback } from '../../context/FeedbackContext';
import { computeBMI } from '../../services/plan';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setAppLanguage } from '../../lib/i18n';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const LANG_FLAGS: Record<string, string> = { tr: '🇹🇷', en: '🇬🇧', fr: '🇫🇷' };

const THEME_MODES: { value: ThemeMode; icon: IconName }[] = [
  { value: 'light', icon: 'white-balance-sunny' },
  { value: 'dark', icon: 'moon-waning-crescent' },
];

interface SettingItem {
  icon: IconName;
  labelKey: string;
  route?: string;
}

const SETTINGS_TOP: SettingItem[] = [
  { icon: 'account', labelKey: 'profile.settings.personalInfo', route: '/personal-info' },
  { icon: 'target', labelKey: 'profile.settings.goalUpdate', route: '/(onboarding)/setup' },
  { icon: 'history', labelKey: 'profile.settings.weightHistory', route: '/weight-history' },
  { icon: 'translate', labelKey: 'profile.settings.language' },
  { icon: 'theme-light-dark', labelKey: 'profile.settings.theme' },
];

const SETTINGS_BOTTOM: SettingItem[] = [
  { icon: 'help-circle-outline', labelKey: 'profile.settings.medical' },
  { icon: 'email', labelKey: 'profile.settings.contact' },
  { icon: 'shield-lock-outline', labelKey: 'profile.settings.privacy' },
  { icon: 'file-document-outline', labelKey: 'profile.settings.terms' },
];

const PREMIUM_PERKS = [
  'Yapay zeka özelliklerine sınırsız erişim',
  'Sana özel beslenme planı',
  "1000'den fazla tarife erişim",
  'Reklamsız kullanım',
];

/* ─── Setting row (grouped card rows) ─────────────────────────── */
function SettingRow({
  item,
  onPress,
  last,
  t,
}: {
  item: SettingItem;
  onPress?: () => void;
  last?: boolean;
  t: any;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <PressableScale
      style={s.rowPressable}
      scaleTo={0.98}
      haptic="light"
      onPress={onPress ?? (() => item.route && router.push(item.route as never))}
    >
      <View style={s.rowContent}>
        <View style={s.iconBox}>
          <MaterialCommunityIcons name={item.icon} size={20} color={colors.textSecondary} />
        </View>
        <Text style={s.settingLabel}>{t(item.labelKey)}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </View>
      {!last && <View style={s.rowDivider} />}
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [themeOpen, setThemeOpen] = useState(false);
  const openThemePicker = () => {
    haptic.light();
    setThemeOpen(true);
  };
  const selectTheme = (next: ThemeMode) => {
    haptic.select();
    setMode(next);
    setThemeOpen(false);
    toast(t('theme.changed', { mode: t(`theme.modes.${next}`) }));
  };
  const BMI_CATEGORY_COLOR: Record<string, string> = {
    Underweight: colors.bmiUnderweight,
    Healthy: colors.green,
    Overweight: colors.orange,
    Obese: colors.bmiObese,
  };
  const BMI_LEGEND = [
    { color: colors.bmiUnderweight, key: 'underweight' },
    { color: colors.green, key: 'healthy' },
    { color: colors.orange, key: 'overweight' },
    { color: colors.bmiObese, key: 'obese' },
  ];
  const { isPremium, setPremium, userName, setUserName } = useApp();
  const { manageSubscriptions } = useSubscription();
  const { session, signOut } = useAuth();
  const userId = session?.user?.id ?? '';
  const accountEmail = session?.user?.email ?? '';
  // Name to show: explicit name → email local-part → generic fallback.
  const displayName = userName.trim() || accountEmail.split('@')[0] || 'Fridos';
  const { t, i18n } = useTranslation();
  const { toast } = useFeedback();
  const [langOpen, setLangOpen] = useState(false);

  // ── Account actions ───────────────────────────────────────────
  const handleLogout = async () => {
    haptic.light();
    await signOut().catch(() => {});
    router.replace('/(auth)/login');
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    if (res.ok) {
      setDeleteOpen(false);
      router.replace('/(auth)/login');
    } else {
      toast(t('profile.deleteConfirm.error'));
    }
  };

  const currentLang = (i18n.language || 'tr').slice(0, 2);
  const openLanguagePicker = () => {
    haptic.light();
    setLangOpen(true);
  };
  const selectLang = (code: (typeof LANGUAGES)[number]['code']) => {
    haptic.select();
    setAppLanguage(code);
    setLangOpen(false);
    toast(t('language.changed'));
  };
  const { profile } = usePlan();
  const bmi = computeBMI(profile.weight, profile.height);

  // ── Edit mode ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(userName);
  const [draftEmail, setDraftEmail] = useState(accountEmail);
  const [savedEmail, setSavedEmail] = useState(accountEmail);
  const [savingEdit, setSavingEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep the displayed email in sync with the session (initial load, refresh,
  // and after a confirmed email change). Don't clobber an in-progress edit.
  useEffect(() => {
    if (isEditing) return;
    setSavedEmail(accountEmail);
  }, [accountEmail, isEditing]);

  // Hydrate the display name from the auth metadata once it's available.
  useEffect(() => {
    const metaName = (session?.user?.user_metadata?.full_name as string | undefined)?.trim();
    if (metaName && metaName !== userName) setUserName(metaName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

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
    setDraftName(userName);
    setDraftEmail(savedEmail);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (savingEdit) return;
    const name = draftName.trim();
    const email = draftEmail.trim();
    const nameOk = name.length >= 2;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nameOk || !emailOk) {
      haptic.light();
      shake();
      return;
    }

    const nameChanged = name !== userName;
    const emailChanged = email !== savedEmail;
    if (!nameChanged && !emailChanged) {
      setIsEditing(false);
      Keyboard.dismiss();
      return;
    }

    setSavingEdit(true);
    const res = await updateAccount({
      fullName: nameChanged ? name : undefined,
      email: emailChanged ? email : undefined,
    });
    setSavingEdit(false);

    if (!res.ok) {
      haptic.light();
      shake();
      toast(t('auth.errGeneric'));
      return;
    }

    haptic.success();
    if (nameChanged) setUserName(name);
    // Email only becomes active after the user confirms it via the link, so we
    // keep showing the current address and tell them to check their inbox.
    if (res.needsConfirm) toast(t('profile.emailConfirmSent'));
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
    await Clipboard.setStringAsync(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const translatedPerks = t('profile.premium.perks', { returnObjects: true });
  const perks = Array.isArray(translatedPerks) ? translatedPerks : PREMIUM_PERKS;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={s.title}>{t('profile.title')}</Text>

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
                    placeholder={t('auth.signup.namePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                  />
                ) : (
                  <Text style={s.name}>{displayName}</Text>
                )}
                {!isEditing &&
                  (isPremium ? (
                    <View style={s.premiumBadge}>
                      <MaterialCommunityIcons name="crown" size={11} color={colors.goldDark} />
                      <Text style={s.premiumText}>PREMIUM</Text>
                    </View>
                  ) : (
                    <Badge label={t('profile.freeBadge')} variant="neutral" filled={false} />
                  ))}
              </View>
              {!isEditing && (
                <PressableScale
                  haptic="light"
                  style={s.editBtn}
                  onPress={startEdit}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="pencil" size={17} color={colors.textSecondary} />
                </PressableScale>
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
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                />
                <View style={s.editActions}>
                  <PressableScale
                    haptic="light"
                    style={s.cancelBtn}
                    onPress={cancelEdit}
                    activeOpacity={0.8}
                  >
                    <Text style={s.cancelText}>{t('common.cancel')}</Text>
                  </PressableScale>
                  <PressableScale
                    haptic="light"
                    style={[s.saveBtn, savingEdit && { opacity: 0.6 }]}
                    onPress={saveEdit}
                    activeOpacity={0.8}
                    disabled={savingEdit}
                  >
                    <Text style={s.saveText}>
                      {savingEdit ? t('common.saving') : t('common.save')}
                    </Text>
                  </PressableScale>
                </View>
              </>
            ) : (
              <PressableScale haptic="light" style={s.idBlock} activeOpacity={0.7} onPress={copyId}>
                <Text style={s.idText} numberOfLines={1}>
                  {t('profile.userId', { id: userId })}
                </Text>
                <Text style={s.copyHint}>
                  {copied ? t('profile.copied') : t('profile.copyHint')}
                </Text>
              </PressableScale>
            )}
          </Animated.View>
        </FadeInItem>

        {/* Subscription card */}
        <FadeInItem index={1}>
          {isPremium ? (
            <View style={s.premiumActiveCard}>
              <View style={s.subRow}>
                <View style={s.subIconWrap}>
                  <MaterialCommunityIcons name="crown" size={22} color={colors.goldDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.subTitle}>Fridos Premium</Text>
                  <Text style={s.subSub}>{t('profile.premium.activeSub')}</Text>
                </View>
                <PressableScale
                  style={s.manageBtn}
                  scaleTo={0.95}
                  haptic="light"
                  onPress={() => {
                    haptic.select();
                    manageSubscriptions();
                    setPremium(false);
                  }}
                >
                  <Text style={s.manageText}>{t('profile.premium.manage')}</Text>
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
                <MaterialCommunityIcons name="crown" size={92} color={colors.gold} />
                <MaterialCommunityIcons
                  name="star"
                  size={22}
                  color={colors.surface}
                  style={s.crownStar}
                />
              </View>
              <Text style={s.upsellTitle}>{t('profile.premium.upsellTitle')}</Text>
              <View style={s.perks}>
                {perks.map((p) => (
                  <Text key={p} style={s.perkText}>
                    + {p}
                  </Text>
                ))}
              </View>
              <PressableScale
                style={s.joinBtn}
                scaleTo={0.97}
                haptic="medium"
                onPress={() => router.push('/(tabs)/pro')}
              >
                <LinearGradient
                  colors={[colors.gold, colors.goldGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={s.joinText}>{t('profile.premium.joinBtn')}</Text>
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
            <View style={s.quickIconWrap}>
              <MaterialCommunityIcons name="fridge" size={20} color={colors.textSecondary} />
            </View>
            <Text style={s.quickLabel}>{t('profile.fridge')}</Text>
          </PressableScale>
          <PressableScale
            style={s.quickBtn}
            onPress={() => router.push('/(tabs)/shopping')}
            scaleTo={0.97}
            haptic="light"
          >
            <View style={s.quickIconWrap}>
              <MaterialCommunityIcons name="cart-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={s.quickLabel}>{t('shopping.title')}</Text>
          </PressableScale>
        </FadeInItem>

        {/* Settings — top group */}
        <FadeInItem index={3} style={s.settingsGroup}>
          {SETTINGS_TOP.map((item, i) => (
            <SettingRow
              key={item.labelKey}
              item={item}
              last={i === SETTINGS_TOP.length - 1}
              onPress={
                item.labelKey === 'profile.settings.language'
                  ? openLanguagePicker
                  : item.labelKey === 'profile.settings.theme'
                    ? openThemePicker
                    : undefined
              }
              t={t}
            />
          ))}
        </FadeInItem>

        {/* BMI card */}
        <FadeInItem index={4}>
          <View style={s.bmiCard}>
            <PressableScale
              haptic="light"
              style={s.bmiHeader}
              activeOpacity={0.7}
              onPress={() => {
                haptic.light();
                router.push('/bmi' as any);
              }}
            >
              <View style={s.bmiHeaderLeft}>
                <Text style={s.bmiTitle}>BMI</Text>
                <Text style={s.bmiSubtitle}>{t('profile.bmi.sub')}</Text>
              </View>
              <View style={s.bmiArrowBtn}>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
              </View>
            </PressableScale>

            <View style={s.bmiValueRow}>
              <Text style={s.bmiValue}>{bmi.value}</Text>
              <View style={[s.bmiPill, { backgroundColor: BMI_CATEGORY_COLOR[bmi.category] }]}>
                <Text style={s.bmiPillText}>
                  {t(`profile.bmi.categories.${bmi.category.toLowerCase()}`, {
                    defaultValue: bmi.category,
                  })}
                </Text>
              </View>
            </View>

            <View style={s.bmiScale}>
              <LinearGradient
                colors={[
                  colors.bmiUnderweight,
                  colors.green,
                  colors.bmiOverweight,
                  colors.orange,
                  colors.bmiObese,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[s.bmiMarker, { left: `${bmi.position * 100}%` as DimensionValue }]} />
            </View>

            <View style={s.bmiLegend}>
              {BMI_LEGEND.map((l) => (
                <View key={l.key} style={s.bmiLegendItem}>
                  <View style={[s.bmiLegendDot, { backgroundColor: l.color }]} />
                  <Text style={s.bmiLegendTxt}>{t(`profile.bmi.categories.${l.key}`)}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInItem>

        {/* Settings — bottom group */}
        <FadeInItem index={5} style={s.settingsGroup}>
          {SETTINGS_BOTTOM.map((item, i) => (
            <SettingRow
              key={item.labelKey}
              item={item}
              last={i === SETTINGS_BOTTOM.length - 1}
              t={t}
            />
          ))}
        </FadeInItem>

        {/* Logout / Delete */}
        <FadeInItem index={6} style={s.dangerRow}>
          <PressableScale style={s.logoutBtn} scaleTo={0.97} haptic="light" onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={18} color={colors.textPrimary} />
            <Text style={s.logoutText} numberOfLines={1}>
              {t('profile.logout')}
            </Text>
          </PressableScale>
          <PressableScale
            style={s.deleteBtn}
            scaleTo={0.97}
            haptic="light"
            onPress={() => {
              haptic.light();
              setDeleteOpen(true);
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.red} />
            <Text style={s.deleteText} numberOfLines={1}>
              {t('profile.deleteAccount')}
            </Text>
          </PressableScale>
        </FadeInItem>
      </ScrollView>

      {/* Sélecteur de langue */}
      <BottomSheet visible={langOpen} onClose={() => setLangOpen(false)}>
        <Text style={s.langSheetTitle}>{t('language.title')}</Text>
        {LANGUAGES.map((l) => {
          const active = currentLang === l.code;
          return (
            <PressableScale
              key={l.code}
              haptic="light"
              style={[s.langRow, active && s.langRowActive]}
              onPress={() => selectLang(l.code)}
            >
              <Text style={s.langFlag}>{LANG_FLAGS[l.code]}</Text>
              <Text style={[s.langName, active && s.langNameActive]}>{l.label}</Text>
              {active ? (
                <MaterialCommunityIcons name="check-circle" size={22} color={colors.green} />
              ) : (
                <View style={s.langDot} />
              )}
            </PressableScale>
          );
        })}
      </BottomSheet>

      {/* Sélecteur de thème */}
      <BottomSheet visible={themeOpen} onClose={() => setThemeOpen(false)}>
        <Text style={s.langSheetTitle}>{t('theme.title')}</Text>
        {THEME_MODES.map((m) => {
          const active = mode === m.value;
          return (
            <PressableScale
              key={m.value}
              haptic="light"
              style={[s.langRow, active && s.langRowActive]}
              onPress={() => selectTheme(m.value)}
            >
              <MaterialCommunityIcons
                name={m.icon}
                size={22}
                color={active ? colors.green : colors.textSecondary}
              />
              <Text style={[s.langName, active && s.langNameActive]}>
                {t(`theme.modes.${m.value}`)}
              </Text>
              {active ? (
                <MaterialCommunityIcons name="check-circle" size={22} color={colors.green} />
              ) : (
                <View style={s.langDot} />
              )}
            </PressableScale>
          );
        })}
      </BottomSheet>

      {/* Confirmation suppression de compte */}
      <ConfirmDialog
        visible={deleteOpen}
        destructive
        icon="trash-can-outline"
        title={t('profile.deleteConfirm.title')}
        message={t('profile.deleteConfirm.message')}
        confirmLabel={
          deleting ? t('profile.deleteConfirm.deleting') : t('profile.deleteConfirm.confirm')
        }
        cancelLabel={t('common.cancel')}
        loading={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130 },

    title: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 26,
      color: colors.textPrimary,
      marginBottom: 22,
    },

    // ── Profile card ──────────────────────────────────────────────
    profileCard: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: Radii.card,
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
      color: colors.textPrimary,
      marginBottom: 8,
    },
    nameInput: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 20,
      color: colors.textPrimary,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.green,
      paddingVertical: 2,
      marginBottom: 8,
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.goldLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    premiumText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 10,
      color: colors.goldDark,
      letterSpacing: 0.4,
    },
    freeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.separatorLight,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 9,
    },
    freeBadgeText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
      color: colors.textSecondary,
    },
    editBtn: {
      ...elevation(colors, 1),
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    idBlock: {
      marginTop: 14,
    },
    idText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: colors.textSecondary,
    },
    copyHint: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    emailInput: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.textSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: colors.textSecondary,
    },
    saveBtn: {
      height: 38,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: colors.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      color: colors.white,
    },

    // ── Premium upsell card ───────────────────────────────────────
    upsellCard: {
      backgroundColor: colors.surface,
      borderRadius: Radii.cardLarge,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.goldBorder,
      padding: 24,
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 22,
      shadowColor: colors.gold,
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
      color: colors.textPrimary,
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
      color: colors.textSecondary,
      textAlign: 'center',
    },
    joinBtn: {
      alignSelf: 'stretch',
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    joinText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 15,
      color: colors.white,
    },

    // ── Premium active card ───────────────────────────────────────
    premiumActiveCard: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: Radii.card,
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
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    subSub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: colors.textSecondary,
    },
    manageBtn: {
      backgroundColor: colors.backgroundAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    manageText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      color: colors.textSecondary,
    },

    // ── Quick actions ─────────────────────────────────────────────
    quickRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
      alignSelf: 'stretch',
    },
    quickBtn: {
      ...elevation(colors, 1),
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    quickIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundAlt,
    },
    quickLabel: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      color: colors.textPrimary,
    },

    // ── Settings Group (grouped settings block) ───────────────────
    settingsGroup: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: 20,
      marginBottom: 20,
    },
    rowPressable: {
      width: '100%',
    },
    rowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    rowDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginLeft: 68,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundAlt,
    },
    settingLabel: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: colors.textPrimary,
      flex: 1,
    },

    // ── BMI card ──────────────────────────────────────────────────
    bmiCard: {
      ...elevation(colors, 1),
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radii.card,
      padding: 16,
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
      color: colors.textPrimary,
    },
    bmiSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.textMuted,
    },
    bmiArrowBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.green,
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
      fontSize: 38,
      color: colors.textPrimary,
    },
    bmiPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
    },
    bmiPillText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 14,
      color: colors.white,
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
      backgroundColor: colors.white,
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
      color: colors.textSecondary,
    },

    // ── Danger zone ───────────────────────────────────────────────
    dangerRow: {
      flexDirection: 'column',
      gap: 10,
      marginTop: 16,
      alignSelf: 'stretch',
      width: '100%',
    },
    logoutBtn: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    deleteBtn: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      borderRadius: 16,
      backgroundColor: colors.redLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.redBorder,
    },
    logoutText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: colors.textPrimary,
    },
    deleteText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: colors.red,
    },

    // ── Sélecteur de langue (bottom-sheet) ──
    langSheetTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: 16,
      marginTop: 2,
    },
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    langRowActive: {
      borderColor: colors.green,
      backgroundColor: colors.greenLight,
    },
    langFlag: { fontSize: 24 },
    langName: {
      flex: 1,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: colors.textPrimary,
    },
    langNameActive: { color: colors.green },
    langDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.separator,
    },
  });
