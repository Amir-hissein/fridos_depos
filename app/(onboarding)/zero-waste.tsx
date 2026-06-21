import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function ZeroWasteScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.illustration, { opacity: fadeAnim }]}>
        <View style={[styles.illustrationBg, { backgroundColor: Colors.goldLight }]}>
          <Animated.Text style={[styles.mainEmoji, { transform: [{ scale: pulseAnim }] }]}>
            ♻️
          </Animated.Text>
          <Text style={[styles.float, styles.float1]}>💚</Text>
          <Text style={[styles.float, styles.float2]}>🌿</Text>
          <Text style={[styles.float, styles.float3]}>🥦</Text>
        </View>
      </Animated.View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Text style={styles.title}>Zero waste,{"\n"}zero hassle</Text>
        <Text style={styles.desc}>
          Cook smart, toss less, eat better.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(onboarding)/setup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace('/(tabs)/plan')}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>I already have an account</Text>
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
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainEmoji: {
    fontSize: 72,
  },
  float: {
    position: 'absolute',
    fontSize: 26,
  },
  float1: {
    top: 20,
    left: 20,
  },
  float2: {
    bottom: 30,
    right: 20,
  },
  float3: {
    top: 40,
    right: 15,
  },
  bottom: {
    alignItems: 'center',
    width: '100%',
  },
  dots: {
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