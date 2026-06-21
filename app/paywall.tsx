import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { haptic } from '../lib/haptics';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IoniconsName; label: string; color: string; bg: string }[] = [
  { icon: 'camera', label: 'Unlimited fridge scanning', color: Colors.green, bg: Colors.greenLight },
  { icon: 'calendar', label: 'Weekly meal plans', color: Colors.green, bg: Colors.greenLight },
  { icon: 'cart', label: 'Automatic shopping lists', color: Colors.green, bg: Colors.greenLight },
  { icon: 'options', label: 'Advanced diet filters', color: Colors.green, bg: Colors.greenLight },
  { icon: 'star', label: 'Unlimited recipes, no ads', color: Colors.gold, bg: Colors.goldLight },
];

export default function PaywallScreen() {
  const { setPremium } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSubscribe = () => {
    haptic.success();
    setPremium(true);
    router.back();
  };

  const handleRestore = () => {
    haptic.success();
    setPremium(true);
    Alert.alert('Success', 'Purchases successfully restored.');
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
      <LinearGradient colors={['#16271E', '#0F1211']} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Animated.ScrollView
          style={{ opacity: fadeAnim, flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Trophy icon */}
          <Animated.View style={[styles.trophyWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="trophy" size={46} color={Colors.gold} />
          </Animated.View>

          <Text style={styles.title}>Go Fridos{"\n"}Premium</Text>
          <Text style={styles.desc}>Cook without limits, plan your week, zero ads.</Text>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f, idx) => (
              <View key={idx} style={[styles.featureRow, idx < FEATURES.length - 1 && styles.featureRowBorder]}>
                <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={18} color={f.color} />
                </View>
                <Text style={styles.featureText}>{f.label}</Text>
                <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              </View>
            ))}
          </View>

          {/* Plans */}
          <View style={styles.plans}>
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              {selectedPlan === 'monthly' && (
                <View style={styles.selectBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                </View>
              )}
              <Text style={[styles.planLabel, selectedPlan === 'monthly' && styles.planLabelActive]}>Monthly</Text>
              <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceActive]}>$4.99</Text>
              <Text style={styles.planPeriod}>per month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
              onPress={() => setSelectedPlan('annual')}
              activeOpacity={0.8}
            >
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-40%</Text>
              </View>
              {selectedPlan === 'annual' && (
                <View style={styles.selectBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                </View>
              )}
              <Text style={[styles.planLabel, styles.planLabelGreen, selectedPlan === 'annual' && styles.planLabelActive]}>Yearly</Text>
              <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.planPriceActive]}>$2.99</Text>
              <Text style={styles.planPeriod}>per month · $35.88/yr</Text>
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.subscribeBtn} activeOpacity={0.85} onPress={handleSubscribe}>
            <Ionicons name="star" size={18} color={Colors.white} />
            <Text style={styles.subscribeBtnText}>Start free trial</Text>
          </TouchableOpacity>

          <Text style={styles.footnote}>
            {selectedPlan === 'annual'
              ? '7 days free, then $35.88/yr. Cancel anytime.'
              : '7 days free, then $4.99/mo. Cancel anytime.'}
          </Text>

          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
            <Text style={styles.restoreBtnText}>Restore purchases</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 22,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 35,
    marginBottom: 10,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  features: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    borderBottomColor: Colors.borderLight,
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
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
  },
  planCardActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenLight,
  },
  discountBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.orange,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.white,
  },
  planLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  planLabelGreen: { color: Colors.green },
  planLabelActive: { color: Colors.green },
  planPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  planPriceActive: { color: Colors.green },
  planPeriod: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  subscribeBtn: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 14,
  },
  subscribeBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
  footnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
