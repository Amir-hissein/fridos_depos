import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  DimensionValue,
} from 'react-native';
import { PressableScale } from '../components/ui/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { Radii } from '../constants/layout';
import { FadeInItem } from '../components/ui/FadeInItem';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { haptic } from '../lib/haptics';
import { usePlan } from '../context/PlanContext';
import { computeBMI } from '../services/plan';
import { useTranslation } from 'react-i18next';

/* ─── Stat Row ───────────────────────────────────────────────── */
function StatRow({
  icon,
  label,
  value,
  valueAccent,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  valueAccent?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <PressableScale haptic="light"
      style={s.statCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={s.iconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={[s.cardValue, valueAccent && s.cardValueAccent]}>{value}</Text>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
      )}
    </PressableScale>
  );
}

export default function BMIScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { profile } = usePlan();
  const { t } = useTranslation();
  const bmi = computeBMI(profile.weight, profile.height);

  const bmiCategoryColors: Record<string, string> = {
    Underweight: colors.bmiUnderweight,
    Healthy: colors.green,
    Overweight: colors.orange,
    Obese: colors.bmiObese,
  };

  const bmiLegend = [
    { color: colors.bmiUnderweight, key: 'underweight' },
    { color: colors.green, key: 'healthy' },
    { color: colors.orange, key: 'overweight' },
    { color: colors.bmiObese, key: 'obese' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="BMI" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BMI Card */}
        <FadeInItem index={0} style={s.bmiCard}>
          <Text style={s.bmiCardTitle}>{t('profile.bmiPage.title')}</Text>

          <View style={s.bmiValueRow}>
            <Text style={s.bmiValue}>{bmi.value}</Text>
            <View style={[s.bmiPill, { backgroundColor: bmiCategoryColors[bmi.category] }]}>
              <Text style={s.bmiPillText}>
                {t(`profile.bmi.categories.${bmi.category.toLowerCase()}`, { defaultValue: bmi.category })}
              </Text>
            </View>
          </View>

          <View style={s.bmiScale}>
            <LinearGradient
              colors={[colors.bmiUnderweight, colors.green, colors.bmiOverweight, colors.orange, colors.bmiObese]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[s.bmiMarker, { left: `${bmi.position * 100}%` as DimensionValue }]} />
          </View>

          <View style={s.bmiLegend}>
            {bmiLegend.map(l => (
              <View key={l.key} style={s.bmiLegendItem}>
                <View style={[s.bmiLegendDot, { backgroundColor: l.color }]} />
                <Text style={s.bmiLegendTxt}>{t(`profile.bmi.categories.${l.key}`)}</Text>
              </View>
            ))}
          </View>
        </FadeInItem>

        {/* BMI Explanation Section */}
        <FadeInItem index={1} style={s.infoSection}>
          <Text style={s.sectionTitle}>{t('profile.bmiPage.whatIsBmi')}</Text>
          <Text style={s.paragraph}>
            {t('profile.bmiPage.description')}
          </Text>
        </FadeInItem>

        {/* BMI Value Ranges Section */}
        <FadeInItem index={2} style={s.infoSection}>
          <Text style={s.sectionTitle}>{t('profile.bmiPage.rangesTitle')}</Text>
          
          <View style={s.rangeList}>
            <StatRow icon="information-variant" label={t('profile.bmi.categories.underweight')} value="0 – 18.4" />
            <StatRow icon="check-circle-outline" label={t('profile.bmi.categories.healthy')} value="18.5 – 24.9" valueAccent />
            <StatRow icon="alert-outline" label={t('profile.bmi.categories.overweight')} value="25.0 – 29.9" />
            <StatRow icon="alert-circle-outline" label={t('profile.bmi.categories.obese')} value="30.0+" />
          </View>
        </FadeInItem>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },


  // BMI Card
  bmiCard: {
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    marginVertical: 12,
  },
  bmiCardTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  bmiValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 38,
    color: colors.textPrimary,
  },
  bmiPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bmiPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.white,
  },
  bmiScale: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  bmiMarker: {
    position: 'absolute',
    top: -2,
    width: 3,
    height: 14,
    borderRadius: 1.5,
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
    gap: 6,
  },
  bmiLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bmiLegendTxt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Info sections
  infoSection: {
    marginTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  paragraph: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  rangeList: {
    gap: 8,
    marginTop: 4,
  },
  // Stat rows
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 17,
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
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  cardValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 160,
    textAlign: 'right',
  },
  cardValueAccent: {
    color: colors.green,
    fontFamily: 'Inter_600SemiBold',
  },
});
