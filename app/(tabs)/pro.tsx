import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Radii } from '../../constants/layout';
import { PressableScale } from '../../components/ui/PressableScale';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { Card } from '../../components/ui/Card';
import { haptic } from '../../lib/haptics';
import { useApp, TRIAL_DAYS } from '../../context/AppContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTranslation } from 'react-i18next';

type IName = React.ComponentProps<typeof Ionicons>['name'];

interface Feature {
  icon: IName;
  key: string;
  color: string;
  bg: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'scan',
    key: 'scan',
    color: Colors.green,
    bg: Colors.greenLight,
  },
  {
    icon: 'calendar',
    key: 'plans',
    color: Colors.blue,
    bg: Colors.blueLight,
  },
  {
    icon: 'cart',
    key: 'lists',
    color: Colors.orange,
    bg: Colors.orangeLight,
  },
  {
    icon: 'options',
    key: 'filters',
    color: Colors.purple,
    bg: Colors.purpleLight,
  },
  {
    icon: 'restaurant',
    key: 'recipes',
    color: Colors.gold,
    bg: Colors.goldLight,
  },
];

const REVIEWS = [
  { name: 'Sarah M.', stars: 5 },
  { name: 'James K.', stars: 5 },
  { name: 'Amal R.', stars: 5 },
];

/* ── Pulse ring component ── */
function PulseRing({ delay = 0 }: { delay?: number }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
        },
      ]}
    />
  );
}

/* ── Active (Premium) screen ── */
function ActiveScreen({ onManage }: { onManage: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <FadeInItem index={0}>
          <LinearGradient
            colors={['rgba(244,183,64,0.22)', 'rgba(244,183,64,0.06)', 'transparent']}
            style={styles.activeHero}
          >
            <View style={styles.activeBadgeWrap}>
              <PulseRing delay={0} />
              <PulseRing delay={700} />
              <View style={styles.activeBadge}>
                <LinearGradient
                  colors={[colors.gold, colors.goldGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="star" size={36} color={colors.white} />
              </View>
            </View>
            <Text style={styles.activeTitle}>{t('pro.active.title')}</Text>
            <Text style={styles.activeSubtitle}>
              {t('pro.active.subtitle')}
            </Text>
          </LinearGradient>
        </FadeInItem>

        {/* Perks unlocked */}
        <FadeInItem index={1}>
          <View style={styles.perksCard}>
            <Text style={styles.perksTitle}>{t('pro.active.perks')}</Text>
            {FEATURES.map((f, i) => (
              <View key={f.key} style={[styles.perkRow, i < FEATURES.length - 1 && styles.perkBorder]}>
                <View style={[styles.perkIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={17} color={f.color} />
                </View>
                <Text style={styles.perkLabel}>{t(`pro.features.${f.key}.label`)}</Text>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              </View>
            ))}
          </View>
        </FadeInItem>

        {/* Billing info */}
        <FadeInItem index={2}>
          <Card style={{ marginBottom: 20, gap: 12 }}>
            <View style={styles.billingRow}>
              <Text style={styles.billingKey}>{t('pro.active.plan')}</Text>
              <View style={styles.billingBadge}>
                <Text style={styles.billingBadgeText}>{t('pro.active.yearlyBill')}</Text>
              </View>
            </View>
            <View style={[styles.billingRow, { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 }]}>
              <Text style={styles.billingKey}>{t('pro.active.nextBilling')}</Text>
              <Text style={styles.billingVal}>{t('pro.active.nextBillingDate')}</Text>
            </View>
          </Card>
        </FadeInItem>

        {/* Manage subscription (native sheet in prod) */}
        <FadeInItem index={3}>
          <PressableScale
            style={styles.manageBtn}
            scaleTo={0.97}
            haptic="light"
            onPress={onManage}
          >
            <Ionicons name="settings-outline" size={17} color={colors.textSecondary} />
            <Text style={styles.manageText}>{t('pro.active.manage')}</Text>
          </PressableScale>
          <Text style={styles.manageSub}>{t('pro.active.manageTest')}</Text>
        </FadeInItem>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Main paywall screen ── */
export default function ProScreen() {
  const { isPremium, isTrialActive, trialDaysLeft, setPremium } = useApp();
  const { isConfigured, purchasePlan, restore, manageSubscriptions } = useSubscription();
  const { toast } = useFeedback();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [busy, setBusy] = useState(false);
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const subscribe = async () => {
    if (busy) return;
    // Dev / no-keys mode: unlock locally so the flow is testable.
    if (!isConfigured) {
      haptic.success();
      setPremium(true);
      return;
    }
    setBusy(true);
    try {
      const ok = await purchasePlan(plan);
      if (ok) haptic.success();
    } catch (e: any) {
      haptic.medium();
      toast(
        t(e?.message === 'subscription_unavailable' ? 'pro.paywall.unavailable' : 'pro.paywall.purchaseError'),
        { variant: 'error' },
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    if (!isConfigured) {
      setPremium(true);
      toast(t('pro.paywall.restoreSuccess'));
      return;
    }
    setBusy(true);
    try {
      const ok = await restore();
      toast(ok ? t('pro.paywall.restoreSuccess') : t('pro.paywall.restoreNone'), {
        variant: ok ? 'success' : 'info',
      });
    } catch {
      toast(t('pro.paywall.purchaseError'), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // Subscribed (or dev override outside a trial) → "active" screen.
  // During the free trial we still show the paywall so the user can convert.
  if (isPremium && !isTrialActive) {
    // Prod: open the native subscription sheet. Dev: locally downgrade for testing.
    return <ActiveScreen onManage={() => { manageSubscriptions(); setPremium(false); }} />;
  }

  const reviews = [
    { name: 'Sarah M.', text: t('pro.reviews.0.text'), stars: 5 },
    { name: 'James K.', text: t('pro.reviews.1.text'), stars: 5 },
    { name: 'Amal R.', text: t('pro.reviews.2.text'), stars: 5 },
  ];

  const price = plan === 'annual'
    ? (i18n.language === 'fr' ? '35,88 $/an' : i18n.language === 'tr' ? '$35.88/yıl' : '$35.88/yr')
    : (i18n.language === 'fr' ? '4,99 $/mois' : i18n.language === 'tr' ? '$4.99/ay' : '$4.99/mo');

  const trustLabels = [
    t('pro.trust.secure'),
    t('pro.trust.noCharge'),
    t('pro.trust.cancel'),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <FadeInItem index={0}>
          <LinearGradient
            colors={['rgba(244,183,64,0.20)', 'rgba(244,183,64,0.06)', 'transparent']}
            style={styles.hero}
          >
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={[colors.gold, colors.goldGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="trophy" size={38} color={colors.textWhite} />
            </View>
            <Text style={styles.heroTitle}>{t('pro.heroTitle')}</Text>
            <Text style={styles.heroSub}>{t('pro.heroSub')}</Text>
            {isTrialActive && (
              <View style={styles.trialPill}>
                <Ionicons name="time-outline" size={14} color={colors.gold} />
                <Text style={styles.trialPillText}>{t('pro.trialBanner', { days: trialDaysLeft })}</Text>
              </View>
            )}
          </LinearGradient>
        </FadeInItem>

        {/* ── Features ── */}
        <FadeInItem index={1}>
          <View style={styles.featuresCard}>
            {FEATURES.map((f, i) => (
              <View key={f.key} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}>
                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={18} color={f.color} />
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureLabel}>{t(`pro.features.${f.key}.label`)}</Text>
                  <Text style={styles.featureDesc}>{t(`pro.features.${f.key}.desc`)}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              </View>
            ))}
          </View>
        </FadeInItem>

        {/* ── Plan selector (full-width rows) ── */}
        <FadeInItem index={2}>
          <Text style={styles.sectionTitle}>{t('pro.choosePlan')}</Text>
          <View style={styles.planList}>
            {/* Annual — best value */}
            <PressableScale
              style={[styles.planRow, plan === 'annual' && styles.planRowActive]}
              scaleTo={0.98}
              onPress={() => { haptic.select(); setPlan('annual'); }}
            >
              <View style={[styles.radio, plan === 'annual' && styles.radioOn]}>
                {plan === 'annual' && <Ionicons name="checkmark" size={13} color={colors.white} />}
              </View>
              <View style={styles.planRowBody}>
                <View style={styles.planRowTop}>
                  <Text style={styles.planRowName}>{t('pro.yearly')}</Text>
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>{t('pro.bestValue')}</Text>
                  </View>
                </View>
                <Text style={styles.planRowSub}>{t('pro.yearlyBilled', { total: t('pro.yearlyTotal', '$35.88') })}</Text>
              </View>
              <View style={styles.planRowPrice}>
                <Text style={styles.planRowAmount}>{t('pro.yearlyPrice', '$2.99')}</Text>
                <Text style={styles.planRowPer}>{t('pro.perMonth', '/mo')}</Text>
              </View>
            </PressableScale>

            {/* Monthly */}
            <PressableScale
              style={[styles.planRow, plan === 'monthly' && styles.planRowActive]}
              scaleTo={0.98}
              onPress={() => { haptic.select(); setPlan('monthly'); }}
            >
              <View style={[styles.radio, plan === 'monthly' && styles.radioOn]}>
                {plan === 'monthly' && <Ionicons name="checkmark" size={13} color={colors.white} />}
              </View>
              <View style={styles.planRowBody}>
                <Text style={styles.planRowName}>{t('pro.monthly')}</Text>
                <Text style={styles.planRowSub}>{t('pro.monthlyBilled')}</Text>
              </View>
              <View style={styles.planRowPrice}>
                <Text style={styles.planRowAmount}>{t('pro.monthlyPrice', '$4.99')}</Text>
                <Text style={styles.planRowPer}>{t('pro.perMonth', '/mo')}</Text>
              </View>
            </PressableScale>
          </View>
        </FadeInItem>

        {/* ── Reviews ── */}
        <FadeInItem index={3}>
          <Text style={styles.sectionTitle}>{t('pro.reviewsTitle')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsRow}
          >
            {reviews.map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewStars}>
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Ionicons key={j} name="star" size={12} color={colors.gold} />
                  ))}
                </View>
                <Text style={styles.reviewText}>{r.text}</Text>
                <Text style={styles.reviewName}>— {r.name}</Text>
              </View>
            ))}
          </ScrollView>
        </FadeInItem>

        {/* ── CTA ── */}
        <FadeInItem index={4}>
          <PressableScale style={styles.cta} scaleTo={0.97} haptic="medium" onPress={subscribe}>
            <LinearGradient
              colors={[colors.green, colors.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="star" size={20} color={colors.white} />
                <Text style={styles.ctaText}>{t('pro.startTrial', { days: TRIAL_DAYS })}</Text>
              </>
            )}
          </PressableScale>
          <Text style={styles.ctaNote}>
            {t('pro.trialNote', { price })}
          </Text>

          <View style={styles.trustRow}>
            {(['shield-checkmark-outline', 'card-outline', 'refresh-circle-outline'] as IName[]).map((icon, i) => (
              <View key={i} style={styles.trustItem}>
                <Ionicons name={icon} size={14} color={colors.textMuted} />
                <Text style={styles.trustText}>
                  {trustLabels[i]}
                </Text>
              </View>
            ))}
          </View>

          {/* Restore + legal (App Store compliance) */}
          <PressableScale style={styles.restoreBtn} haptic="light" onPress={handleRestore}>
            <Text style={styles.restoreText}>{t('pro.paywall.restore')}</Text>
          </PressableScale>

          <Text style={styles.disclosure}>{t('pro.legal.disclosure')}</Text>

          <View style={styles.legalRow}>
            <Text style={styles.legalLink}>{t('pro.legal.terms')}</Text>
            <Text style={styles.legalDot}>·</Text>
            <Text style={styles.legalLink}>{t('pro.legal.privacy')}</Text>
          </View>
        </FadeInItem>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // ── Paywall ────────────────────────────────────────────────────
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  hero: {
    alignItems: 'center',
    borderRadius: Radii.cardLarge,
    paddingTop: 32,
    paddingBottom: 28,
    marginBottom: 20,
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  trialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 12,
  },
  trialPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
    color: colors.goldDark,
  },

  // ── Features ───────────────────────────────────────────────────
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  featureBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureBody: { flex: 1 },
  featureLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },

  // ── Plans ──────────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  planList: {
    gap: 12,
    marginBottom: 22,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  planRowActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  planRowBody: { flex: 1, gap: 3 },
  planRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planRowName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  bestBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
  },
  bestBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.white,
    letterSpacing: 0.3,
  },
  planRowSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: colors.textMuted,
  },
  planRowPrice: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    flexShrink: 0,
  },
  planRowAmount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  planRowPer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    paddingBottom: 3,
  },

  // ── Reviews ────────────────────────────────────────────────────
  reviewsRow: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 22,
  },
  reviewCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 10,
  },
  reviewText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  reviewName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
  },

  // ── CTA ────────────────────────────────────────────────────────
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: Radii.button,
    overflow: 'hidden',
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 14,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.textWhite,
  },
  ctaNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 14,
  },
  restoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.green,
  },
  disclosure: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10.5,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  legalLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: colors.textLight,
    fontSize: 12,
  },

  // ── Active / Premium screen ────────────────────────────────────
  activeContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  activeHero: {
    alignItems: 'center',
    borderRadius: Radii.cardLarge,
    paddingTop: 40,
    paddingBottom: 32,
    marginBottom: 20,
  },
  activeBadgeWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  activeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  activeTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  activeSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  perksCard: {
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  perksTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    paddingTop: 16,
    paddingBottom: 4,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
  },
  perkBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },

  billingCard: {
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  billingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billingKey: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  billingBadge: {
    backgroundColor: colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  billingBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.green,
  },
  billingVal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },

  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: Radii.button,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 8,
  },
  manageText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  manageSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
  },
});
