// Notification settings — master switch + per-category reminder toggles.
// Backed by NotificationsContext (persists prefs, requests OS permission,
// reschedules local reminders).

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ThemeColors } from '../constants/colors';
import { elevation } from '../constants/layout';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { FadeInItem } from '../components/ui/FadeInItem';
import { haptic } from '../lib/haptics';
import { useNotifications } from '../context/NotificationsContext';
import { NotifCategory, NOTIF_CATEGORIES } from '../services/notifications';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICON: Record<NotifCategory, IoniconName> = {
  hydration: 'water',
  meals: 'restaurant-outline',
  recap: 'moon-outline',
};

const CATEGORY_COLOR = (colors: ThemeColors): Record<NotifCategory, string> => ({
  hydration: colors.blue,
  meals: colors.green,
  recap: colors.gold,
});

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { prefs, permissionGranted, setEnabled, toggleCategory } = useNotifications();
  const catColor = CATEGORY_COLOR(colors);

  const onMasterToggle = async (on: boolean) => {
    haptic.select();
    await setEnabled(on);
  };

  const onCategoryToggle = (cat: NotifCategory) => {
    haptic.select();
    toggleCategory(cat);
  };

  const switchTrack = { false: colors.separator, true: colors.green };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t('notifications.title')} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.subtitle}>{t('notifications.subtitle')}</Text>

        {/* Master switch */}
        <FadeInItem index={0}>
          <View style={s.masterCard}>
            <View style={s.masterIcon}>
              <Ionicons name="notifications" size={22} color={colors.green} />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>{t('notifications.master')}</Text>
              {!permissionGranted && prefs.enabled === false && (
                <Text style={s.rowHint}>{t('notifications.enableHint')}</Text>
              )}
            </View>
            <Switch
              value={prefs.enabled}
              onValueChange={onMasterToggle}
              trackColor={switchTrack}
              thumbColor={colors.white}
            />
          </View>
        </FadeInItem>

        {/* Permission denied notice */}
        {prefs.enabled && !permissionGranted && (
          <FadeInItem index={1}>
            <View style={s.warnCard}>
              <Ionicons name="alert-circle" size={18} color={colors.orange} />
              <Text style={s.warnText}>{t('notifications.permissionDenied')}</Text>
            </View>
          </FadeInItem>
        )}

        {/* Category toggles */}
        <FadeInItem index={2} style={s.group}>
          {NOTIF_CATEGORIES.map((cat, i) => (
            <View key={cat} style={[s.row, i < NOTIF_CATEGORIES.length - 1 && s.rowBorder]}>
              <View style={[s.catIcon, { backgroundColor: catColor[cat] + '22' }]}>
                <Ionicons name={CATEGORY_ICON[cat]} size={20} color={catColor[cat]} />
              </View>
              <View style={s.rowBody}>
                <Text style={s.rowTitle}>{t(`notifications.categories.${cat}.title`)}</Text>
                <Text style={s.rowHint}>{t(`notifications.categories.${cat}.desc`)}</Text>
              </View>
              <Switch
                value={prefs.enabled && prefs[cat]}
                disabled={!prefs.enabled}
                onValueChange={() => onCategoryToggle(cat)}
                trackColor={switchTrack}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </FadeInItem>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },
    subtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 20,
    },
    masterCard: {
      ...elevation(colors, 1),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
    },
    masterIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.greenLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warnCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.orangeLight,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    },
    warnText: {
      flex: 1,
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: colors.orange,
      lineHeight: 18,
    },
    group: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    catIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    rowTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: colors.textPrimary,
    },
    rowHint: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12.5,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 17,
    },
  });
