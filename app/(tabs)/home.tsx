import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { PressableScale } from '../../components/ui/PressableScale';
import { DailyDashboard } from '../../components/ui/DailyDashboard';

export default function PlanDashboardScreen() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hi there 👋</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Daily nutrition dashboard */}
        <FadeInItem index={0}>
          <DailyDashboard />
        </FadeInItem>

        {/* Weekly meal plan entry */}
        <FadeInItem index={1}>
          <PressableScale
            style={styles.weekCard}
            scaleTo={0.98}
            haptic="light"
            onPress={() => router.push('/(tabs)/plan')}
          >
            <View style={styles.weekIcon}>
              <Ionicons name="calendar" size={22} color={Colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.weekTitle}>Weekly meal plan</Text>
              <Text style={styles.weekDesc}>Plan your whole week of meals</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </PressableScale>
        </FadeInItem>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 120 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  greeting: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  weekIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  weekDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
