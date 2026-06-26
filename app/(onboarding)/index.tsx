import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  useAnimatedProps,
  SharedValue,
} from 'react-native-reanimated';
import { Colors, ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles, ResolvedScheme } from '../../context/ThemeContext';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCounterProps {
  value: SharedValue<number>;
  target: number;
  suffix: string;
  label: string;
  delay?: number;
  duration?: number;
  color?: string;
  borderColor?: string;
}

function AnimatedCounter({
  value,
  target,
  suffix,
  label,
  delay = 0,
  duration = 1,
  color,
  borderColor,
}: AnimatedCounterProps) {
  const { colors, scheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, scheme), [colors, scheme]);

  const activeColor = color || colors.textPrimary;
  const activeBorderColor = borderColor || colors.green;

  const animatedProps = useAnimatedProps(() => {
    let p = (value.value - delay) / duration;
    p = Math.max(0, Math.min(1, p));
    const current = Math.floor(p * target);
    return {
      text: `${current}${suffix}`,
      value: `${current}${suffix}`,
    } as any;
  });

  return (
    <View style={[styles.counterBox, { borderColor: activeBorderColor, borderLeftColor: activeBorderColor }]}>
      <Text style={styles.counterLabel}>{label}</Text>
      <AnimatedTextInput
        editable={false}
        animatedProps={animatedProps}
        style={[styles.counterValue, { color: activeColor }]}
      />
    </View>
  );
}

/* ─── Continue Button with Triple Chevrons ─── */
function ContinueButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const cb = useThemedStyles(makeCbStyles);
  return (
    <PressableScale style={cb.btn} scaleTo={0.98} haptic="medium" onPress={onPress}>
      <Text style={cb.text}>{label}</Text>
      <View style={cb.chevs}>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.35)" />
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" style={{ marginLeft: -11 }} />
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.white} style={{ marginLeft: -11 }} />
      </View>
    </PressableScale>
  );
}

const makeCbStyles = (colors: ThemeColors) => StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.green,
    height: 58,
    borderRadius: 16,
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
    width: width - 48,
  },
  text: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.white },
  chevs: { flexDirection: 'row', alignItems: 'center' },
});

export default function CinematicOnboarding() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
  const progress = useSharedValue(0);
  const laserPos = useSharedValue(0);

  useEffect(() => {
    // Sequence duration 3 seconds for the counters
    progress.value = withTiming(1, { duration: 3000, easing: Easing.out(Easing.cubic) });
    
    // Laser loops indefinitely
    laserPos.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const laserStyle = useAnimatedStyle(() => {
    const translateY = interpolate(laserPos.value, [0, 1], [-100, 100]);
    return { transform: [{ translateY }] };
  });

  /* --- BUTTON (Fades in after 2 seconds) --- */
  const buttonStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity, pointerEvents: progress.value > 0.6 ? 'auto' : 'none' };
  });

  const handleNext = () => {
    haptic.success();
    router.push('/(onboarding)/fridge-intro');
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        {/* Background */}
        <Animated.View style={StyleSheet.absoluteFill}>
          <Image source={require('../../assets/images/onboard_scanner.png')} style={styles.bgImage} />
        </Animated.View>
        <View style={styles.overlay} />
      </View>

      {/* Dynamic Overlays */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        
        {/* AR Scanner Overlay */}
        <View style={[styles.contentLayer, { pointerEvents: 'none' }]}>
          {/* Viewfinder Target */}
          <View style={styles.viewfinder}>
            <View style={[styles.bracket, styles.bracketTL]} />
            <View style={[styles.bracket, styles.bracketTR]} />
            <View style={[styles.bracket, styles.bracketBL]} />
            <View style={[styles.bracket, styles.bracketBR]} />
            
            <Animated.View style={[styles.laser, laserStyle]} />
          </View>

          {/* Left HUD Counters */}
          <View style={styles.hudLeft}>
            <AnimatedCounter
              value={progress}
              target={480}
              suffix=" Kcal"
              label={t('onboarding.energy')}
              delay={0.1}
              duration={0.6}
              color={colors.orange}
              borderColor={colors.orange}
            />
            <AnimatedCounter
              value={progress}
              target={32}
              suffix="g"
              label={t('onboarding.protein')}
              delay={0.2}
              duration={0.5}
              color={colors.protein}
              borderColor={colors.protein}
            />
            <AnimatedCounter
              value={progress}
              target={45}
              suffix="g"
              label={t('onboarding.carbs')}
              delay={0.3}
              duration={0.6}
              color={colors.carbs}
              borderColor={colors.carbs}
            />
          </View>

          {/* Right HUD Scan Status */}
          <View style={styles.hudRight}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{t('onboarding.scanning')}</Text>
            </View>
            <View style={[styles.statusBadge, { marginTop: 10, borderColor: colors.orange + '88' }]}>
              <Text style={[styles.statusText, { color: colors.orange }]}>{t('onboarding.salmon')}</Text>
            </View>
            <View style={[styles.statusBadge, { marginTop: 10, borderColor: colors.green + '88' }]}>
              <Text style={[styles.statusText, { color: colors.green }]}>{t('onboarding.quinoa')}</Text>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
          </View>
        </View>

        {/* Final Button */}
        <Animated.View style={[styles.footer, buttonStyle]}>
          <ContinueButton label={t('onboarding.next')} onPress={handleNext} />
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, scheme: ResolvedScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: scheme === 'light' ? 'rgba(246,248,247,0.65)' : 'rgba(11,20,19,0.5)',
  },
  safeArea: {
    flex: 1,
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // HUD
  hudLeft: {
    position: 'absolute',
    left: 20,
    top: 100,
    gap: 16,
  },
  hudRight: {
    position: 'absolute',
    right: 20,
    top: 100,
    alignItems: 'flex-end',
  },
  counterBox: {
    backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(20,32,30,0.75)',
    padding: 12,
    borderRadius: 14,
    borderLeftWidth: 3.5,
    minWidth: 110,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  counterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  counterValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    padding: 0,
    margin: 0,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(20,32,30,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginRight: 8,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  // Scanner Viewfinder
  viewfinder: {
    width: 220,
    height: 220,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
  },
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.green,
  },
  bracketTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  bracketTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bracketBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bracketBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  laser: {
    position: 'absolute',
    width: 200,
    height: 2,
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  // Text
  textContainer: {
    position: 'absolute',
    bottom: 140,
    alignItems: 'center',
    width: width - 60,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
