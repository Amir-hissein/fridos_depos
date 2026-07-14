import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Durations } from '../../constants/animations';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Cross-fade between steps: each onboarding screen plays its own
        // cinematic entrance (doors opening, scanner, counters), so a soft
        // dissolve lets that choreography carry the transition instead of a
        // mechanical horizontal slide competing with it.
        animation: 'fade',
        animationDuration: Durations.slow,
        gestureEnabled: false,
        // Opaque themed background so the fade never reveals a white/black flash.
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
