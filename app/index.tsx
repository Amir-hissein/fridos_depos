import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../lib/api/profile';

export default function SplashScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { session, loading } = useAuth();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const navigated = useRef(false);

  // Entrance animation (runs once).
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
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
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => router.replace(dest as never));
      }, 1100);
    })();
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>FRIDOS AI</Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
