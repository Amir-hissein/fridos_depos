import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PressableScale } from '../../components/ui/PressableScale';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { haptic } from '../../lib/haptics';
import { useApp } from '../../context/AppContext';

type IName = React.ComponentProps<typeof Ionicons>['name'];

interface Feature {
  icon: IName;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'scan',
    label: 'Unlimited scanning',
    desc: 'Scan your fridge & meals as many times as you want',
    color: Colors.green,
    bg: Colors.greenLight,
  },
  {
    icon: 'calendar',
    label: 'Weekly meal plans',
    desc: 'Auto-generated plans based on your goals & fridge',
    color: '#6C8EFF',
    bg: 'rgba(108,142,255,0.15)',
  },
  {
    icon: 'cart',
    label: 'Smart shopping lists',
    desc: 'Missing ingredients added automatically',
    color: Colors.orange,
    bg: Colors.orangeLight,
  },
  {
    icon: 'options',
    label: 'Advanced filters',
    desc: 'Full diet & allergen filter control',
    color: '#B47FFF',
    bg: 'rgba(180,127,255,0.15)',
  },
  {
    icon: 'restaurant',
    label: 'All recipes · No ads',
    desc: 'Unlimited access to every recipe, ad-free',
    color: Colors.gold,
    bg: Colors.goldLight,
  },
];

const REVIEWS = [
  { name: 'Sarah M.', text: '"I stopped wasting food completely. Game changer!"', stars: 5 },
  { name: 'James K.', text: '"The meal planner saves me 2 hours every week."', stars: 5 },
  { name: 'Amal R.', text: '"Finally an app that respects my diet. Love it."', stars: 5 },
];

/* ── Pulse ring component ── */
function PulseRing({ delay = 0 }: { delay?: number }) {
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
function ActiveScreen({ onDowngrade }: { onDowngrade: () => void }) {
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
                  colors={[Colors.gold, '#E8A020']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="star" size={36} color="#fff" />
              </View>
            </View>
            <Text style={styles.activeTitle}>You're Premium ✨</Text>
            <Text style={styles.activeSubtitle}>
              Everything is unlocked.{'\n'}Cook without limits!
            </Text>
          </LinearGradient>
        </FadeInItem>

        {/* Perks unlocked */}
        <FadeInItem index={1}>
          <View style={styles.perksCard}>
            <Text style={styles.perksTitle}>Your perks</Text>
            {FEATURES.map((f, i) => (
              <View key={f.label} style={[styles.perkRow, i < FEATURES.length - 1 && styles.perkBorder]}>
                <View style={[styles.perkIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={17} color={f.color} />
                </View>
                <Text style={styles.perkLabel}>{f.label}</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
              </View>
            ))}
          </View>
        </FadeInItem>

        {/* Billing info */}
        <FadeInItem index={2}>
          <View style={styles.billingCard}>
            <View style={styles.billingRow}>
              <Text style={styles.billingKey}>Plan</Text>
              <View style={styles.billingBadge}>
                <Text style={styles.billingBadgeText}>Yearly · $35.88/yr</Text>
              </View>
            </View>
            <View style={[styles.billingRow, { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 }]}>
              <Text style={styles.billingKey}>Next billing</Text>
              <Text style={styles.billingVal}>June 21, 2027</Text>
            </View>
          </View>
        </FadeInItem>

        {/* Manage / Downgrade (for testing) */}
        <FadeInItem index={3}>
          <PressableScale
            style={styles.manageBtn}
            scaleTo={0.97}
            haptic="light"
            onPress={onDowngrade}
          >
            <Ionicons name="settings-outline" size={17} color={Colors.textSecondary} />
            <Text style={styles.manageText}>Manage subscription</Text>
          </PressableScale>
          <Text style={styles.manageSub}>Tap to simulate downgrade (testing)</Text>
        </FadeInItem>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Main paywall screen ── */
export default function ProScreen() {
  const { isPremium, setPremium } = useApp();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');

  const subscribe = () => {
    haptic.success();
    setPremium(true);
  };

  if (isPremium) {
    return <ActiveScreen onDowngrade={() => setPremium(false)} />;
  }

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
                colors={[Colors.gold, '#E8A020']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="trophy" size={38} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Go Fridos Premium</Text>
            <Text style={styles.heroSub}>Cook without limits, plan your week,{'\n'}zero ads — starting free.</Text>
          </LinearGradient>
        </FadeInItem>

        {/* ── Features ── */}
        <FadeInItem index={1}>
          <View style={styles.featuresCard}>
            {FEATURES.map((f, i) => (
              <View key={f.label} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}>
                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={18} color={f.color} />
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
              </View>
            ))}
          </View>
        </FadeInItem>

        {/* ── Plan selector ── */}
        <FadeInItem index={2}>
          <Text style={styles.sectionTitle}>Choose your plan</Text>
          <View style={styles.plans}>
            {/* Monthly */}
            <PressableScale
              style={[styles.planCard, plan === 'monthly' && styles.planCardActive]}
              scaleTo={0.96}
              onPress={() => { haptic.select(); setPlan('monthly'); }}
            >
              <Text style={[styles.planName, plan === 'monthly' && styles.planNameActive]}>Monthly</Text>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, plan === 'monthly' && styles.planPriceActive]}>$4.99</Text>
                <Text style={styles.planPer}>/mo</Text>
              </View>
              <Text style={styles.planNote}>Billed monthly</Text>
              {plan === 'monthly' && (
                <View style={styles.planCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                </View>
              )}
            </PressableScale>

            {/* Annual — highlighted */}
            <PressableScale
              style={[styles.planCard, styles.planCardBest, plan === 'annual' && styles.planCardActive]}
              scaleTo={0.96}
              onPress={() => { haptic.select(); setPlan('annual'); }}
            >
              <View style={styles.savingBadge}>
                <Text style={styles.savingText}>Save 40%</Text>
              </View>
              <Text style={[styles.planName, plan === 'annual' && styles.planNameActive]}>Yearly</Text>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, plan === 'annual' && styles.planPriceActive]}>$2.99</Text>
                <Text style={styles.planPer}>/mo</Text>
              </View>
              <Text style={styles.planNote}>$35.88 billed yearly</Text>
              {plan === 'annual' && (
                <View style={styles.planCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                </View>
              )}
            </PressableScale>
          </View>
        </FadeInItem>

        {/* ── Reviews ── */}
        <FadeInItem index={3}>
          <Text style={styles.sectionTitle}>What people say</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsRow}
          >
            {REVIEWS.map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewStars}>
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Ionicons key={j} name="star" size={12} color={Colors.gold} />
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
              colors={[Colors.green, Colors.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={styles.ctaText}>Start 7-day free trial</Text>
          </PressableScale>
          <Text style={styles.ctaNote}>
            Then {plan === 'annual' ? '$35.88/yr' : '$4.99/mo'} · Cancel anytime
          </Text>
          <View style={styles.trustRow}>
            {(['shield-checkmark-outline', 'card-outline', 'refresh-circle-outline'] as IName[]).map((icon, i) => (
              <View key={i} style={styles.trustItem}>
                <Ionicons name={icon} size={14} color={Colors.textMuted} />
                <Text style={styles.trustText}>
                  {['Secure', 'No charge today', 'Easy cancel'][i]}
                </Text>
              </View>
            ))}
          </View>
        </FadeInItem>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // ── Paywall ────────────────────────────────────────────────────
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  hero: {
    alignItems: 'center',
    borderRadius: 28,
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
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Features ───────────────────────────────────────────────────
  featuresCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  featureBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
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
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },

  // ── Plans ──────────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  planCardBest: {
    borderColor: 'rgba(244,183,64,0.35)',
    backgroundColor: 'rgba(244,183,64,0.06)',
  },
  planCardActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenLight,
  },
  savingBadge: {
    position: 'absolute',
    top: -13,
    backgroundColor: Colors.orange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  savingText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  planCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  planName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  planNameActive: { color: Colors.green },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
  },
  planPriceActive: { color: Colors.green },
  planPer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    paddingBottom: 4,
  },
  planNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Reviews ────────────────────────────────────────────────────
  reviewsRow: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 28,
  },
  reviewCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  reviewName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ── CTA ────────────────────────────────────────────────────────
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 14,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#fff',
  },
  ctaNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.textMuted,
  },

  // ── Active / Premium screen ────────────────────────────────────
  activeContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  activeHero: {
    alignItems: 'center',
    borderRadius: 28,
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
    borderColor: Colors.gold,
  },
  activeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  activeTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  activeSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  perksCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  perksTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    paddingTop: 16,
    paddingBottom: 4,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
  },
  perkBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
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
    color: Colors.textPrimary,
    flex: 1,
  },

  billingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textSecondary,
  },
  billingBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  billingBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.green,
  },
  billingVal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  manageText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  manageSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
