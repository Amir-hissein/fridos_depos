import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PressableScale } from '../components/ui/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { Radii } from '../constants/layout';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { haptic } from '../lib/haptics';
import { useTranslation } from 'react-i18next';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IoniconsName; key: string; color: string; bg: string }[] = [
  { icon: 'camera', key: 'scan', color: Colors.green, bg: Colors.greenLight },
  { icon: 'calendar', key: 'plans', color: Colors.green, bg: Colors.greenLight },
  { icon: 'cart', key: 'lists', color: Colors.green, bg: Colors.greenLight },
  { icon: 'options', key: 'filters', color: Colors.green, bg: Colors.greenLight },
  { icon: 'star', key: 'recipes', color: Colors.gold, bg: Colors.goldLight },
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { setPremium } = useApp();
  const { toast } = useFeedback();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSubscribe = () => {
    haptic.success();
    setPremium(true);
    router.back();
  };

  const handleRestore = () => {
    setPremium(true);
    toast(t('pro.paywall.restoreSuccess'));
    router.back();
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.surfaceGreen, colors.background]} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Close */}
        <PressableScale haptic="light" style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </PressableScale>

        <Animated.ScrollView
          style={{ opacity: fadeAnim, flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Trophy icon */}
          <Animated.View style={[styles.trophyWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="trophy" size={46} color={colors.gold} />
          </Animated.View>

          <Text style={styles.title}>{t('pro.paywall.title')}</Text>
          <Text style={styles.desc}>{t('pro.paywall.subtitle')}</Text>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f, idx) => (
              <View key={idx} style={[styles.featureRow, idx < FEATURES.length - 1 && styles.featureRowBorder]}>
                <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={18} color={f.color} />
                </View>
                <Text style={styles.featureText}>{t(`pro.features.${f.key}.label`)}</Text>
                <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              </View>
            ))}
          </View>

          {/* Plans */}
          <View style={styles.plans}>
            <PressableScale haptic="light"
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              {selectedPlan === 'monthly' && (
                <View style={styles.selectBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                </View>
              )}
              <Text style={[styles.planLabel, selectedPlan === 'monthly' && styles.planLabelActive]}>{t('pro.monthly')}</Text>
              <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceActive]}>{t('pro.monthlyPrice', '$4.99')}</Text>
              <Text style={styles.planPeriod}>{t('pro.paywall.perMonth')}</Text>
            </PressableScale>

            <PressableScale haptic="light"
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
              onPress={() => setSelectedPlan('annual')}
              activeOpacity={0.8}
            >
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{t('pro.discountBadge', '-40%')}</Text>
              </View>
              {selectedPlan === 'annual' && (
                <View style={styles.selectBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                </View>
              )}
              <Text style={[styles.planLabel, styles.planLabelGreen, selectedPlan === 'annual' && styles.planLabelActive]}>{t('pro.yearly')}</Text>
              <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.planPriceActive]}>{t('pro.yearlyPrice', '$2.99')}</Text>
              <Text style={styles.planPeriod}>{t('pro.paywall.perMonthYearly')}</Text>
            </PressableScale>
          </View>

          {/* CTA */}
          <Button
            variant="primary"
            icon={<Ionicons name="star" size={18} color={colors.white} />}
            label={t('pro.paywall.cta')}
            onPress={handleSubscribe}
            style={styles.subscribeBtnSpacing}
          />

          <Text style={styles.footnote}>
            {selectedPlan === 'annual'
              ? t('pro.paywall.trialAnnual')
              : t('pro.paywall.trialMonthly')}
          </Text>

          <PressableScale haptic="light" style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
            <Text style={styles.restoreBtnText}>{t('pro.paywall.restore')}</Text>
          </PressableScale>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.separatorLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
  },
  trophyWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 22,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 35,
    marginBottom: 10,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  features: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
  },
  planCardActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  discountBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: colors.orange,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.white,
  },
  planLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  planLabelGreen: { color: colors.green },
  planLabelActive: { color: colors.green },
  planPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  planPriceActive: { color: colors.green },
  planPeriod: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  subscribeBtnSpacing: {
    alignSelf: 'stretch',
    marginBottom: 14,
  },
  footnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  selectBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  restoreBtn: {
    marginTop: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
