import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    const makeFloat = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    };
    makeFloat(floatAnim1, 0);
    makeFloat(floatAnim2, 600);
    makeFloat(floatAnim3, 1200);
  }, []);

  const translateY1 = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const translateY2 = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const translateY3 = floatAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.illustration, { opacity: fadeAnim }]}>
        <View style={styles.illustrationBg}>
          {/* Main fridge icon */}
          <View style={styles.fridgeIcon}>
            <Image
              source={require('../../assets/image1.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          {/* Floating emojis */}
          <Animated.Text style={[styles.float, styles.float1, { transform: [{ translateY: translateY1 }] }]}>🥕</Animated.Text>
          <Animated.Text style={[styles.float, styles.float2, { transform: [{ translateY: translateY2 }] }]}>🥚</Animated.Text>
          <Animated.Text style={[styles.float, styles.float3, { transform: [{ translateY: translateY3 }] }]}>🧄</Animated.Text>
        </View>
      </Animated.View>

      <View style={styles.bottomCard}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>Tell us what you have</Text>
        <Text style={styles.desc}>Add the ingredients in your fridge — we'll handle the rest.</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(onboarding)/recipes-intro')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace('/(tabs)/plan')}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  illustrationBg: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fridgeIcon: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  float: {
    position: 'absolute',
    fontSize: 28,
  },
  float1: {
    top: 20,
    left: 20,
  },
  float2: {
    bottom: 30,
    left: 10,
  },
  float3: {
    top: 40,
    right: 15,
  },
  bottomCard: {
    alignItems: 'center',
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.green,
    width: 20,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  primaryBtn: {
    backgroundColor: Colors.green,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textWhite,
  },
  skipBtn: {
    paddingVertical: 16,
    marginTop: 8,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
});