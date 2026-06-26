import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { FridgeProvider } from '../context/FridgeContext';
import { AppProvider } from '../context/AppContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { ProfileProvider } from '../context/ProfileContext';
import { Durations } from '../constants/animations';
import { AllergenProvider } from '../context/AllergenContext';
import { PlanProvider } from '../context/PlanContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { CustomRecipesProvider } from '../context/CustomRecipesContext';
import { FeedbackProvider } from '../context/FeedbackContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../lib/i18n';

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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
      <AppProvider>
        <SubscriptionProvider>
        <ProfileProvider>
        <FridgeProvider>
          <AllergenProvider>
           <PlanProvider>
            <FavoritesProvider>
            <CustomRecipesProvider>
            <NotificationsProvider>
            <FeedbackProvider>
            <RootNav />
            </FeedbackProvider>
            </NotificationsProvider>
            </CustomRecipesProvider>
            </FavoritesProvider>
           </PlanProvider>
          </AllergenProvider>
        </FridgeProvider>
        </ProfileProvider>
        </SubscriptionProvider>
      </AppProvider>
      </AuthProvider>
      </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function RootNav() {
  const { colors, scheme } = useTheme();
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
              <Stack.Screen
                name="recipe/[id]"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="calorie-recipes"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="meal-detail"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="paywall"
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="allergens"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="weight-history"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="personal-info"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="bmi"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="fridge"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="fridge-recipes"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="notifications"
                options={{ animation: 'slide_from_right' }}
              />
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