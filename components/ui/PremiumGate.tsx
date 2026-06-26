import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from './PressableScale';
import { useTranslation } from 'react-i18next';

type IName = React.ComponentProps<typeof Ionicons>['name'];

interface PremiumGateProps {
  icon: IName;
  title: string;
  description: string;
  features: string[];
}

/**
 * Full-screen upsell shown to free users in place of a premium-only tab
 * (meal plan, shopping list…). Routes to the paywall.
 */
export function PremiumGate({ icon, title, description, features }: PremiumGateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={40} color={colors.green} />
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={13} color={colors.white} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>

        <View style={styles.features}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={19} color={colors.green} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <PressableScale
          style={styles.cta}
          onPress={() => router.push('/paywall')}
          scaleTo={0.97}
          haptic="medium"
        >
          <Ionicons name="star" size={18} color={colors.white} />
          <Text style={styles.ctaText}>{t('common.unlockPremium')}</Text>
        </PressableScale>

        <Text style={styles.price}>$5/month · cancel anytime</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
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
    gap: 14,
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.green,
    height: 52,
    borderRadius: 16,
    alignSelf: 'stretch',
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  price: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 14,
  },
});
