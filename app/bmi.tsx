import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { haptic } from '../lib/haptics';
import { usePlan } from '../context/PlanContext';
import { computeBMI } from '../services/plan';

const BMI_CATEGORY_COLOR: Record<string, string> = {
  Underweight: '#4A90D9',
  Healthy: Colors.green,
  Overweight: Colors.orange,
  Obese: '#E53935',
};

const BMI_CATEGORY_LABEL: Record<string, string> = {
  Underweight: 'Çok zayıf',
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
  return (
    <TouchableOpacity
      style={s.statCard}
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

export default function BMIScreen() {
  const { profile } = usePlan();
  const bmi = computeBMI(profile.weight, profile.height);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>BMI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BMI Card */}
        <View style={s.bmiCard}>
          <Text style={s.bmiCardTitle}>BMI (Vücut kitle endeksi)</Text>

          <View style={s.bmiValueRow}>
            <Text style={s.bmiValue}>{bmi.value}</Text>
            <View style={[s.bmiPill, { backgroundColor: BMI_CATEGORY_COLOR[bmi.category] }]}>
              <Text style={s.bmiPillText}>
                {(BMI_CATEGORY_LABEL[bmi.category] ?? bmi.category).toLowerCase()}
              </Text>
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

        {/* BMI Explanation Section */}
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>BMI Nedir?</Text>
          <Text style={s.paragraph}>
            Vücut Kitle İndeksi, boy ve kilonuzun oranına göre vücut ağırlığınızın sağlıklı bir aralıkta olup olmadığını gösteren bir ölçümdür. Genel sağlık durumunu değerlendirmek için yaygın olarak kullanılır.
          </Text>
        </View>

        {/* BMI Value Ranges Section */}
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>Değer Aralıkları Nasıl Gruplanır?</Text>
          
          <View style={s.rangeList}>
            <StatRow icon="information-variant" label="Çok Zayıf" value="0 – 18.4" />
            <StatRow icon="check-circle-outline" label="Sağlıklı" value="18.5 – 24.9" valueAccent />
            <StatRow icon="alert-outline" label="Hafif Kilolu" value="25.0 – 29.9" />
            <StatRow icon="alert-circle-outline" label="Obez" value="30.0+" />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

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

  // BMI Card
  bmiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginVertical: 12,
  },
  bmiCardTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
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
    fontSize: 48,
    color: Colors.textPrimary,
  },
  bmiPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bmiPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.white,
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
    color: Colors.textSecondary,
  },

  // Info sections
  infoSection: {
    marginTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  paragraph: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.green,
    fontFamily: 'Inter_600SemiBold',
  },
});
