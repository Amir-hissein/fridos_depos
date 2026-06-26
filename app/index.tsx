import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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

  // Route once the auth session is known: logged in → app, otherwise → login.
  useEffect(() => {
    if (loading || navigated.current) return;
    navigated.current = true;
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace(session ? '/(tabs)/plan' : '/(auth)/login');
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../assets/fridos.png')}
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
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    tintColor: colors.white,
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
