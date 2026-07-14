import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AppProviders } from '../context/AppProviders';
import { Durations } from '../constants/animations';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../lib/i18n';
import { initSentry } from '../lib/sentry';

// Initialise crash reporting as early as possible (no-op without a DSN).
initSentry();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Keep the native (dark) splash up until fonts are ready. The splash is only
  // hidden once the theme is hydrated too (see RootNav), so we never flash the
  // wrong colour scheme on cold start.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <AppProviders>
          <RootNav />
        </AppProviders>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function RootNav() {
  const { colors, scheme, hydrated } = useTheme();

  // Reveal the app (hide the native splash) only once the saved theme has been
  // read, so a returning light-mode user never sees the dark default flash.
  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: Durations.base,
          gestureEnabled: true,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scan/choose"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="scan/camera"
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="scan/result"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="scan/meal-result"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="recipe/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="calorie-recipes" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="meal-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="paywall"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="allergens" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="weight-history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="personal-info" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="bmi" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="fridge" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="fridge-recipes" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
