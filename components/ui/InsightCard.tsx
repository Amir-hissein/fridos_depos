// InsightCard — a contextual, severity-styled alert surfaced on the Plan screen
// ("hydration is behind", "calorie goal exceeded", …). Driven by the pure
// `services/insights` engine; this component only renders one Insight.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/colors';
import { elevation } from '../../constants/layout';
import { Insight, InsightSeverity } from '../../services/insights';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Maps a severity to a theme color pair (accent + translucent tint). */
function severityColors(severity: InsightSeverity, colors: ThemeColors) {
  switch (severity) {
    case 'success':
      return { color: colors.green, tint: colors.greenLight };
    case 'warning':
      return { color: colors.orange, tint: colors.orangeLight };
    case 'tip':
      return { color: colors.gold, tint: colors.goldLight };
    case 'info':
    default:
      return { color: colors.blue, tint: colors.blueLight };
  }
}

export function InsightCard({ insight }: { insight: Insight }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { color, tint } = severityColors(insight.severity, colors);

  return (
    <View style={s.card}>
      <View style={[s.iconBox, { backgroundColor: tint }]}>
        <Ionicons name={insight.icon as IoniconName} size={20} color={color} />
      </View>
      <View style={s.body}>
        <Text style={s.title}>{t(insight.titleKey)}</Text>
        <Text style={s.message}>{t(insight.messageKey, insight.params)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      ...elevation(colors, 1),
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    body: { flex: 1 },
    title: {
      fontFamily: 'Inter_700Bold',
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    message: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12.5,
      color: colors.textSecondary,
      lineHeight: 17,
    },
  });
