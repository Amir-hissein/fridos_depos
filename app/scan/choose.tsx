import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PressableScale } from '../../components/ui/PressableScale';

type IName = React.ComponentProps<typeof Ionicons>['name'];

const OPTIONS: {
  mode: 'meal' | 'fridge';
  icon: IName;
  title: string;
  desc: string;
  color: string;
  bg: string;
}[] = [
  {
    mode: 'meal',
    icon: 'restaurant',
    title: 'Scan a meal',
    desc: 'Snap your plate to log its calories & macros',
    color: Colors.orange,
    bg: Colors.orangeLight,
  },
  {
    mode: 'fridge',
    icon: 'snow',
    title: 'Scan my fridge',
    desc: 'Detect ingredients and add them to your fridge',
    color: Colors.green,
    bg: Colors.greenLight,
  },
];

export default function ScanChooseScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>What do you want to scan?</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.options}>
          {OPTIONS.map(o => (
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
              <Text style={styles.cardTitle}>{o.title}</Text>
              <Text style={styles.cardDesc}>{o.desc}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardArrow: {
    position: 'absolute',
    top: 22,
    right: 22,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
