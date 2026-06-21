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
import { AllergenProvider } from '../context/AllergenContext';
import { PlanProvider } from '../context/PlanContext';

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
      <AppProvider>
        <FridgeProvider>
          <AllergenProvider>
           <PlanProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="scan/choose"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
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
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
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
            </Stack>
            <StatusBar style="light" />
           </PlanProvider>
          </AllergenProvider>
        </FridgeProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});