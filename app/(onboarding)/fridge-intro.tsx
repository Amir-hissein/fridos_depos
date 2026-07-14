import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  useAnimatedProps,
  SharedValue,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles, ResolvedScheme } from '../../context/ThemeContext';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    <View
      style={[
        styles.counterBox,
        { borderColor: activeBorderColor, borderLeftColor: activeBorderColor },
      ]}
    >
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
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="rgba(255,255,255,0.6)"
          style={{ marginLeft: -11 }}
        />
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.white}
          style={{ marginLeft: -11 }}
        />
      </View>
    </PressableScale>
  );
}

const makeCbStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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

export default function FridgeOnboarding() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, scheme), [colors, scheme]);

  const progress = useSharedValue(0);
  const laserPos = useSharedValue(0);
  const doorProgress = useSharedValue(0); // 0 = closed, 0.4 = zoomed in, 1 = fully open

  // Fine-tuned scan states
  const viewfinderOpacity = useSharedValue(0);
  const viewfinderScale = useSharedValue(1.3);
  const laserOpacity = useSharedValue(0);

  // Status badges opacities
  const badgeScanningOpacity = useSharedValue(0);
  const badgeTomatoOpacity = useSharedValue(0);
  const badgeEggOpacity = useSharedValue(0);
  const badgeCheeseOpacity = useSharedValue(0);

  // Overall completion states
  const scanCompleted = useSharedValue(0); // 0 = scanning, 1 = completed

  useEffect(() => {
    // Hold on the closed fridge for a beat, then swing the doors open with a
    // heavy, cinematic spring + a soft haptic thunk.
    doorProgress.value = withDelay(
      300,
      withSpring(1, { damping: 13, stiffness: 55, mass: 1.1 }, (ok) => {
        if (ok) runOnJS(haptic.light)();
      }),
    );
    const thunk = setTimeout(() => haptic.medium(), 300);

    // Viewfinder and scanner elements fade in once the doors have swung open (550ms)
    viewfinderOpacity.value = withDelay(550, withTiming(1, { duration: 400 }));
    viewfinderScale.value = withDelay(
      550,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
      }),
    );

    // Laser appears and starts looping (delay of 700ms)
    laserOpacity.value = withDelay(700, withTiming(1, { duration: 250 }));
    laserPos.value = withDelay(
      700,
      withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true),
    );

    // Scanning status badge fades in (delay of 700ms)
    badgeScanningOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));

    // Tomato detection badge (at 1000ms delay) + haptic light tap
    badgeTomatoOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 300 }, (ok) => {
        if (ok) runOnJS(haptic.light)();
      }),
    );

    // Eggs detection badge (at 1400ms delay) + haptic light tap
    badgeEggOpacity.value = withDelay(
      1400,
      withTiming(1, { duration: 300 }, (ok) => {
        if (ok) runOnJS(haptic.light)();
      }),
    );

    // Cheese detection badge (at 1800ms delay) + haptic light tap
    badgeCheeseOpacity.value = withDelay(
      1800,
      withTiming(1, { duration: 300 }, (ok) => {
        if (ok) runOnJS(haptic.light)();
      }),
    );

    // Counters start counting up concurrently (delay of 700ms, duration of 1400ms)
    progress.value = withDelay(
      700,
      withTiming(
        1,
        {
          duration: 1400,
          easing: Easing.out(Easing.cubic),
        },
        (finishedScan) => {
          if (finishedScan) {
            // Scan completion triggers the reveal of the next button (duration 300ms)
            scanCompleted.value = withTiming(1, { duration: 300 }, (ok) => {
              if (ok) runOnJS(haptic.success)();
            });
          }
        },
      ),
    );

    return () => clearTimeout(thunk);
  }, []);

  const laserStyle = useAnimatedStyle(() => {
    const translateY = interpolate(laserPos.value, [0, 1], [-90, 90]);
    return {
      transform: [{ translateY }],
      opacity: laserOpacity.value,
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    // Lit interior rushes toward the viewer as the doors open (parallax zoom-in).
    const scale = interpolate(doorProgress.value, [0, 1], [1.0, 1.2]);
    return { transform: [{ scale }] };
  });

  const overlayStyle = useAnimatedStyle(() => {
    // Start dark (closed, unlit) and brighten as the door light comes on.
    const opacity = interpolate(doorProgress.value, [0, 1], [0.75, 0.18], Extrapolation.CLAMP);
    return { opacity };
  });

  // Warm light blooming out of the widening gap between the doors.
  const bloomStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      doorProgress.value,
      [0.05, 0.45, 0.9],
      [0, 0.9, 0],
      Extrapolation.CLAMP,
    );
    const scaleX = interpolate(doorProgress.value, [0, 1], [0.4, 2.2]);
    return { opacity, transform: [{ scaleX }] };
  });

  /* --- Fridge Door Animations --- */
  const doorsContainerStyle = useAnimatedStyle(() => {
    // Doors sit slightly forward of the interior for a subtle parallax depth.
    const scale = interpolate(doorProgress.value, [0, 1], [1.0, 1.08]);
    return { transform: [{ scale }] };
  });

  const leftDoorStyle = useAnimatedStyle(() => {
    const rotateVal = interpolate(doorProgress.value, [0, 1], [0, -95]);
    const rotateY = `${rotateVal}deg`;
    const translateX = interpolate(doorProgress.value, [0, 1], [0, -width / 8]);

    return {
      transform: [
        { perspective: 1200 },
        { translateX: -width / 4 }, // Hinge translation to the left
        { rotateY },
        { translateX: width / 4 }, // Translate back
        { translateX }, // Clear door offscreen edge
      ],
      opacity: interpolate(doorProgress.value, [0.8, 1], [1, 0], Extrapolation.CLAMP),
    };
  });

  const rightDoorStyle = useAnimatedStyle(() => {
    const rotateVal = interpolate(doorProgress.value, [0, 1], [0, 95]);
    const rotateY = `${rotateVal}deg`;
    const translateX = interpolate(doorProgress.value, [0, 1], [0, width / 8]);

    return {
      transform: [
        { perspective: 1200 },
        { translateX: width / 4 }, // Hinge translation to the right
        { rotateY },
        { translateX: -width / 4 }, // Translate back
        { translateX }, // Clear door offscreen edge
      ],
      opacity: interpolate(doorProgress.value, [0.8, 1], [1, 0], Extrapolation.CLAMP),
    };
  });

  /* --- Inside contents fade animation --- */
  const contentsFadeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(doorProgress.value, [0, 0.8], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  /* --- HUD Fade & Slide Animations --- */
  const hudLeftStyle = useAnimatedStyle(() => {
    return {
      opacity: viewfinderOpacity.value,
      transform: [{ translateX: interpolate(viewfinderOpacity.value, [0, 1], [-20, 0]) }],
    };
  });

  const hudRightStyle = useAnimatedStyle(() => {
    return {
      opacity: viewfinderOpacity.value,
      transform: [{ translateX: interpolate(viewfinderOpacity.value, [0, 1], [20, 0]) }],
    };
  });

  /* --- Viewfinder Animations --- */
  const viewfinderAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: viewfinderOpacity.value,
      transform: [{ scale: viewfinderScale.value }],
    };
  });

  const bracketStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(scanCompleted.value, [0, 1], [colors.green, '#4CAF50']),
    };
  });

  /* --- Badge Animations --- */
  const topBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: badgeScanningOpacity.value,
      borderColor: interpolateColor(scanCompleted.value, [0, 1], [colors.border, colors.green]),
      backgroundColor: interpolateColor(
        scanCompleted.value,
        [0, 1],
        [
          scheme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(20,32,30,0.75)',
          scheme === 'light' ? 'rgba(76,175,80,0.15)' : 'rgba(46,125,50,0.25)',
        ],
      ),
    };
  });

  const topBadgeDotStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(scanCompleted.value, [0, 1], [colors.green, '#4CAF50']),
    };
  });

  const scanningTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scanCompleted.value, [0, 1], [1, 0]),
      transform: [{ translateY: interpolate(scanCompleted.value, [0, 1], [0, -20]) }],
    };
  });

  const completedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scanCompleted.value, [0, 1], [0, 1]),
      transform: [{ translateY: interpolate(scanCompleted.value, [0, 1], [20, 0]) }],
      color: '#4CAF50',
    };
  });

  const tomatoBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: badgeTomatoOpacity.value,
      transform: [{ translateY: interpolate(badgeTomatoOpacity.value, [0, 1], [15, 0]) }],
    };
  });

  const eggBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: badgeEggOpacity.value,
      transform: [{ translateY: interpolate(badgeEggOpacity.value, [0, 1], [15, 0]) }],
    };
  });

  const cheeseBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: badgeCheeseOpacity.value,
      transform: [{ translateY: interpolate(badgeCheeseOpacity.value, [0, 1], [15, 0]) }],
    };
  });

  /* --- BUTTON (Fades/slides in after completion) --- */
  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: scanCompleted.value,
      pointerEvents: scanCompleted.value > 0.5 ? 'auto' : 'none',
      transform: [{ translateY: interpolate(scanCompleted.value, [0, 1], [20, 0]) }],
    };
  });

  const handleNext = () => {
    haptic.success();
    router.push('/(onboarding)/transfer');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Section: Refrigerator Scanner Widget Container */}
        <View style={styles.fridgeContainer}>
          {/* Background (Inside Fridge) */}
          <View style={StyleSheet.absoluteFill}>
            <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
              <Image
                source={require('../../assets/images/onboard_fridge.png')}
                style={styles.bgImage}
              />
            </Animated.View>
            <Animated.View style={[styles.overlay, overlayStyle]} />
          </View>

          {/* Warm light spilling out of the seam as the doors part */}
          <Animated.View style={[styles.bloom, bloomStyle]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(255,244,214,0)', 'rgba(255,247,224,0.95)', 'rgba(255,244,214,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Cinematic Closed Fridge Doors (Zoom and slide open) */}
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.doorsContainer, doorsContainerStyle]}
            pointerEvents="none"
          >
            {/* Left Door */}
            <Animated.View style={[styles.door, styles.leftDoor, leftDoorStyle]}>
              <View style={[styles.handle, styles.handleLeft]} />
            </Animated.View>

            {/* Right Door */}
            <Animated.View style={[styles.door, styles.rightDoor, rightDoorStyle]}>
              <View style={[styles.handle, styles.handleRight]} />
              <Text style={styles.doorLogo}>FRIDOS</Text>
            </Animated.View>
          </Animated.View>

          {/* Dynamic Scan Interface (Reveals as doors open) */}
          <Animated.View style={[StyleSheet.absoluteFill, contentsFadeStyle]}>
            <View style={styles.contentLayer}>
              {/* Viewfinder Target */}
              <Animated.View style={[styles.viewfinder, viewfinderAnimatedStyle]}>
                <Animated.View style={[styles.bracket, styles.bracketTL, bracketStyle]} />
                <Animated.View style={[styles.bracket, styles.bracketTR, bracketStyle]} />
                <Animated.View style={[styles.bracket, styles.bracketBL, bracketStyle]} />
                <Animated.View style={[styles.bracket, styles.bracketBR, bracketStyle]} />

                <Animated.View style={[styles.laser, laserStyle]} />
              </Animated.View>

              {/* Left HUD Counters */}
              <Animated.View style={[styles.hudLeft, hudLeftStyle]}>
                <AnimatedCounter
                  value={progress}
                  target={6}
                  suffix=""
                  label={t('onboarding.fridge.produce')}
                  delay={0.1}
                  duration={0.6}
                  color={colors.green}
                  borderColor={colors.green}
                />
                <AnimatedCounter
                  value={progress}
                  target={4}
                  suffix=""
                  label={t('onboarding.fridge.dairy')}
                  delay={0.2}
                  duration={0.5}
                  color={colors.orange}
                  borderColor={colors.orange}
                />
                <AnimatedCounter
                  value={progress}
                  target={5}
                  suffix=""
                  label={t('onboarding.fridge.pantry')}
                  delay={0.3}
                  duration={0.6}
                  color={colors.blue}
                  borderColor={colors.blue}
                />
              </Animated.View>

              {/* Right HUD Scan Status */}
              <Animated.View style={[styles.hudRight, hudRightStyle]}>
                <Animated.View style={[styles.statusBadge, topBadgeStyle]}>
                  <Animated.View style={[styles.statusDot, topBadgeDotStyle]} />
                  <View
                    style={{
                      overflow: 'hidden',
                      height: 18,
                      justifyContent: 'center',
                      minWidth: 150,
                    }}
                  >
                    <Animated.Text style={[styles.statusText, scanningTextStyle]}>
                      {t('onboarding.scanning')}
                    </Animated.Text>
                    <Animated.Text
                      style={[styles.statusText, completedTextStyle, { position: 'absolute' }]}
                    >
                      {t('onboarding.scanCompleted')}
                    </Animated.Text>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.statusBadge,
                    { marginTop: 10, borderColor: colors.green + '88' },
                    tomatoBadgeStyle,
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.green }]}>
                    {t('onboarding.fridge.tomatoes')}
                  </Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.statusBadge,
                    { marginTop: 10, borderColor: colors.orange + '88' },
                    eggBadgeStyle,
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.orange }]}>
                    {t('onboarding.fridge.eggs')}
                  </Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.statusBadge,
                    { marginTop: 10, borderColor: colors.gold + '88' },
                    cheeseBadgeStyle,
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.gold }]}>
                    {t('onboarding.fridge.cheese')}
                  </Text>
                </Animated.View>
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Half Area: Clean stack for title, subtitle, and button */}
        <View style={styles.bottomContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('onboarding.fridge.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.fridge.subtitle')}</Text>
          </View>

          {/* Final Button */}
          <Animated.View style={[styles.footer, buttonStyle]}>
            <ContinueButton label={t('onboarding.next')} onPress={handleNext} />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, scheme: ResolvedScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    fridgeContainer: {
      width: '100%',
      height: height * 0.44, // Top 44% of the screen height for scanner container widget
      position: 'relative',
      overflow: 'hidden',
      borderBottomWidth: 1.5,
      borderBottomColor: colors.border,
      backgroundColor: scheme === 'light' ? '#EDF1EF' : '#1E2D2A',
    },
    bottomContent: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 30,
      paddingBottom: 25,
    },
    bgImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: scheme === 'light' ? 'rgba(246,248,247,0.3)' : 'rgba(11,20,19,0.5)',
    },
    bloom: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: '50%',
      marginLeft: -90,
      width: 180,
      zIndex: 50,
    },
    safeArea: {
      flex: 1,
    },
    contentLayer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* --- Closed Fridge Doors styling --- */
    doorsContainer: {
      flexDirection: 'row',
      zIndex: 100,
    },
    door: {
      flex: 1,
      height: '100%',
      backgroundColor: scheme === 'light' ? '#E2E8F0' : '#1E2D2A', // Premium metallic door finish
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: scheme === 'light' ? 0.15 : 0.5,
      shadowRadius: 20,
    },
    leftDoor: {
      alignItems: 'flex-end',
      borderRightWidth: 1.5,
      borderRightColor: scheme === 'light' ? 'rgba(15,30,28,0.2)' : '#0A1211',
    },
    rightDoor: {
      alignItems: 'flex-start',
      borderLeftWidth: 1.5,
      borderLeftColor: scheme === 'light' ? 'rgba(15,30,28,0.2)' : '#0A1211',
    },
    handle: {
      width: 6,
      height: 120,
      backgroundColor: colors.gold, // Gold finish handle bars
      borderRadius: 3,
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    handleLeft: {
      marginRight: 10,
    },
    handleRight: {
      marginLeft: 10,
    },
    doorLogo: {
      position: 'absolute',
      top: '25%',
      left: 20,
      fontFamily: 'Poppins_700Bold',
      fontSize: 24,
      color: scheme === 'light' ? 'rgba(15,30,28,0.06)' : 'rgba(255,255,255,0.06)',
      letterSpacing: 3,
    },

    // HUD
    hudLeft: {
      position: 'absolute',
      left: 20,
      top: 70,
      gap: 12,
    },
    hudRight: {
      position: 'absolute',
      right: 20,
      top: 70,
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
      width: 130,
      height: 200,
      position: 'absolute',
      top: 70,
      left: (width - 130) / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bracket: {
      position: 'absolute',
      width: 20,
      height: 20,
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
      width: 130,
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
      alignItems: 'center',
      width: '100%',
    },
    title: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 24,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    footer: {
      alignItems: 'center',
      width: '100%',
    },
  });
