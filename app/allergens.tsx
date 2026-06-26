import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { ALLERGENS } from '../constants/allergens';
import { useAllergens } from '../context/AllergenContext';
import { PressableScale } from '../components/ui/PressableScale';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { haptic } from '../lib/haptics';
import { useTranslation } from 'react-i18next';

const MODES = [
  { key: 'warn' as const, icon: 'alert-outline' as const },
  { key: 'hide' as const, icon: 'eye-off-outline' as const },
];

export default function AllergensScreen() {
  const { userAllergens, toggleAllergen, mode, setMode } = useAllergens();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('profile.settings.allergens')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          {t('profile.allergensPage.intro')}
        </Text>

        {ALLERGENS.map(a => {
          const selected = userAllergens.includes(a.id);
          return (
            <PressableScale
              key={a.id}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => { haptic.select(); toggleAllergen(a.id); }}
              scaleTo={0.98}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <Ionicons name={a.icon} size={18} color={selected ? colors.white : colors.textSecondary} />
              </View>
              <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                {t(`setup.allergens.${a.id}`, { defaultValue: a.name })}
              </Text>
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
            </PressableScale>
          );
        })}

        {/* Mode : warn / hide */}
        <Text style={styles.sectionTitle}>{t('profile.allergensPage.sectionTitle')}</Text>
        <View style={styles.modeRow}>
          {MODES.map(m => {
            const active = mode === m.key;
            return (
              <PressableScale
                key={m.key}
                style={[styles.modeCard, active && styles.modeCardActive]}
                onPress={() => { haptic.select(); setMode(m.key); }}
                scaleTo={0.97}
              >
                <Ionicons name={m.icon} size={22} color={active ? colors.green : colors.textSecondary} />
                <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                  {t(`profile.allergensPage.modes.${m.key}.label`)}
                </Text>
                <Text style={styles.modeDesc}>
                  {t(`profile.allergensPage.modes.${m.key}.desc`)}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <Text style={styles.note}>
          {userAllergens.length === 0
            ? t('profile.allergensPage.noteEmpty')
            : t('profile.allergensPage.noteCount', { count: userAllergens.length })}
        </Text>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <PressableScale style={styles.doneBtn} onPress={() => router.back()} scaleTo={0.97} haptic="light">
          <Text style={styles.doneBtnText}>{t('common.done')}</Text>
        </PressableScale>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 },
  intro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowSelected: { borderColor: colors.green, backgroundColor: colors.greenLight },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.separatorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: colors.green },
  rowLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textPrimary, flex: 1 },
  rowLabelSelected: { color: colors.green },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.separator,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.green, borderColor: colors.green },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 18,
    marginBottom: 12,
  },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  modeCardActive: { borderColor: colors.green, backgroundColor: colors.greenLight },
  modeLabel: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.textPrimary, marginTop: 2 },
  modeLabelActive: { color: colors.green },
  modeDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 18,
  },
  footer: { paddingHorizontal: 22, paddingTop: 8 },
  doneBtn: {
    backgroundColor: colors.green,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.white },
});
