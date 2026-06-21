import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ALLERGENS } from '../constants/allergens';
import { useAllergens } from '../context/AllergenContext';
import { PressableScale } from '../components/ui/PressableScale';
import { haptic } from '../lib/haptics';

export default function AllergensScreen() {
  const { userAllergens, toggleAllergen } = useAllergens();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My allergens</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          We'll flag recipes that contain any of these so you stay safe.
        </Text>

        {ALLERGENS.map(a => {
          const selected = userAllergens.includes(a.id);
          return (
            <PressableScale
              key={a.id}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => {
                haptic.select();
                toggleAllergen(a.id);
              }}
              scaleTo={0.98}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <Ionicons name={a.icon} size={18} color={selected ? Colors.white : Colors.textSecondary} />
              </View>
              <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>{a.name}</Text>
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
            </PressableScale>
          );
        })}

        <Text style={styles.note}>
          {userAllergens.length === 0
            ? 'No allergens selected.'
            : `${userAllergens.length} allergen${userAllergens.length > 1 ? 's' : ''} selected.`}
        </Text>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <PressableScale style={styles.doneBtn} onPress={() => router.back()} scaleTo={0.97} haptic="light">
          <Text style={styles.doneBtnText}>Done</Text>
        </PressableScale>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },
  intro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  rowSelected: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenLight,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.separatorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: Colors.green,
  },
  rowLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowLabelSelected: {
    color: Colors.green,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  doneBtn: {
    backgroundColor: Colors.green,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
  },
  doneBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
});
