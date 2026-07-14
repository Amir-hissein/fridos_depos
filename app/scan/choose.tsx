import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { elevation } from '../../constants/layout';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from '../../components/ui/PressableScale';
import { useTranslation } from 'react-i18next';

type IName = React.ComponentProps<typeof Ionicons>['name'];

export default function ScanChooseScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const OPTIONS: { mode: 'meal' | 'fridge'; icon: IName; color: string; bg: string }[] = [
    { mode: 'meal', icon: 'restaurant', color: colors.orange, bg: colors.orangeLight },
    { mode: 'fridge', icon: 'snow', color: colors.green, bg: colors.greenLight },
  ];
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('scan.choose.title')}</Text>
          <PressableScale
            haptic="light"
            style={styles.closeBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </PressableScale>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <PressableScale
              key={o.mode}
              style={styles.card}
              scaleTo={0.97}
              haptic="medium"
              onPress={() => router.replace({ pathname: '/scan/camera', params: { mode: o.mode } })}
            >
              <View style={[styles.iconWrap, { backgroundColor: o.bg }]}>
                <Ionicons name={o.icon} size={30} color={o.color} />
              </View>
              <Text style={styles.cardTitle}>{t(`scan.choose.options.${o.mode}.title`)}</Text>
              <Text style={styles.cardDesc}>{t(`scan.choose.options.${o.mode}.desc`)}</Text>
              <View style={styles.cardArrow}>
                <Ionicons name="arrow-forward" size={18} color={o.color} />
              </View>
            </PressableScale>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 8,
    },
    title: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 22,
      color: colors.textPrimary,
      flex: 1,
      paddingRight: 12,
    },
    closeBtn: {
      ...elevation(colors, 1),
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    options: {
      flex: 1,
      justifyContent: 'center',
      gap: 16,
      paddingHorizontal: 22,
      paddingBottom: 40,
    },
    card: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 22,
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 19,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    cardDesc: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    cardArrow: {
      position: 'absolute',
      top: 22,
      right: 22,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
