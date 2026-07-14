import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { ThemeColors } from '../constants/colors';
import { useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../lib/api/profile';

export default function SplashScreen() {
  const styles = useThemedStyles(makeStyles);
  const { session, loading } = useAuth();
  // Mount-driven (shared value) so the splash logo always fades in, and — crucially
  // — navigation below never depends on an animation callback that could silently
  // not fire on the New Architecture (which would leave the app stuck on the splash).
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.88);
  const navigated = useRef(false);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Entrance animation (runs once).
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route once auth is known:
  //  - no session            → login
  //  - first login           → onboarding (profiles.onboarding_done = false)
  //  - returning / onboarded → app
  useEffect(() => {
    if (loading || navigated.current) return;
    navigated.current = true;
    (async () => {
      let dest = '/(auth)/login';
      if (session) {
        const profile = await getMyProfile();
        dest = profile?.onboarding_done ? '/(tabs)/plan' : '/(onboarding)';
      }
      setTimeout(() => {
        // Cosmetic fade-out; navigation is driven by the timer below so it can
        // never hang if the animation doesn't run.
        opacity.value = withTiming(0, { duration: 300 });
        setTimeout(() => router.replace(dest as never), 300);
      }, 1100);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, contentStyle]}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>FRIDOS AI</Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 200,
      height: 200,
    },
    appName: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 26,
      color: colors.white,
      marginTop: 2,
      letterSpacing: 5,
      paddingLeft: 5, // Perfect centering offset for letter spacing
      textAlign: 'center',
    },
  });
