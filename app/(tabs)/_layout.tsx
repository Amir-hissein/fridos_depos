import React, { useEffect, useRef } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Animated, Platform, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { haptic } from '../../lib/haptics';
import { useTranslation } from 'react-i18next';

type IName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { active: IName; inactive: IName; label: string }> = {
  plan: { active: 'calendar', inactive: 'calendar-outline', label: 'Plan' },
  recipes: { active: 'restaurant', inactive: 'restaurant-outline', label: 'Recipes' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
  pro: { active: 'diamond', inactive: 'diamond-outline', label: 'Pro' },
};

const FAB_WIDTH = 56;
const FAB_HEIGHT = 58;
const FAB_RADIUS = 18;
const FAB_BORDER = 2; // thickness of the gradient border
const BAR_HEIGHT = 64;

/* Aliments qui défilent derrière l'icône de scan */
const FOOD_ICONS: IName[] = ['nutrition', 'pizza', 'fish', 'egg', 'ice-cream', 'cafe'];
const FOOD_LOOP: IName[] = [...FOOD_ICONS, ...FOOD_ICONS];
const FOOD_SLOT = 30;

/* ── Animated tab item ── */
function TabItem({
  routeName,
  focused,
  onPress,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const cfg = TAB_CONFIG[routeName];
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
  }, [focused]);

  // Icon lifts slightly when active
  const iconStyle = {
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [1, -1] }) }],
  };

  return (
    <Pressable style={styles.tabItem} onPress={onPress} hitSlop={8}>
      <View style={styles.iconBox}>
        <Animated.View style={iconStyle}>
          <Ionicons
            name={focused ? cfg.active : cfg.inactive}
            size={23}
            color={focused ? colors.green : colors.textMuted}
          />
        </Animated.View>
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{t(`tabs.${routeName}`)}</Text>
    </Pressable>
  );
}

/* ── Center Scan FAB (floating) ── */
function ScanFab() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const scale = useRef(new Animated.Value(1)).current;
  const foodAnim = useRef(new Animated.Value(0)).current;
  const beamAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Défilement continu des aliments
    Animated.loop(
      Animated.timing(foodAnim, {
        toValue: 1,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    // Faisceau de scan : monte du bas vers le haut, puis redescend directement
    Animated.loop(
      Animated.sequence([
        Animated.timing(beamAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(beamAnim, {
          toValue: 0,
          duration: 550,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const foodTranslate = foodAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(FOOD_ICONS.length * FOOD_SLOT)],
  });
  const beamTranslate = beamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_HEIGHT - 10, 0],
  });

  const press = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();

  return (
    <Pressable
      style={styles.fabPressable}
      hitSlop={12}
      onPressIn={() => {
        press(0.9);
        haptic.medium();
      }}
      onPressOut={() => press(1)}
      onPress={() => router.push('/scan/choose')}
    >
      <Animated.View style={[styles.fab, { transform: [{ scale }] }]}>
        {/* Bordure en dégradé (orange → gold → green → blue) — même dégradé que
            l'anneau / la barre de remplissage des calories. */}
        <LinearGradient
          colors={[colors.orange, colors.gold, colors.green, colors.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Contenu du bouton, inséré pour laisser apparaître la bordure dégradée */}
        <View style={styles.fabInner}>
          <LinearGradient
            colors={[colors.green, colors.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Aliments qui passent derrière */}
          <Animated.View
            style={[styles.foodStrip, { transform: [{ translateY: foodTranslate }] }]}
            pointerEvents="none"
          >
            {FOOD_LOOP.map((name, i) => (
              <View key={`${name}-${i}`} style={styles.foodSlot}>
                <Ionicons name={name} size={18} color="rgba(255,255,255,0.26)" />
              </View>
            ))}
          </Animated.View>

          {/* Faisceau de scan vert clair */}
          <Animated.View
            style={[styles.fabBeam, { transform: [{ translateY: beamTranslate }] }]}
            pointerEvents="none"
          />

          {/* Cadre de scan rectangulaire (suit la forme du bouton) */}
          <View style={styles.scanFrame} pointerEvents="none">
            <View style={[styles.scanFrameCorner, styles.sfTl]} />
            <View style={[styles.scanFrameCorner, styles.sfTr]} />
            <View style={[styles.scanFrameCorner, styles.sfBl]} />
            <View style={[styles.scanFrameCorner, styles.sfBr]} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10);

  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name ?? '';
  const activeDescriptor = descriptors[activeRoute.key];

  // Support hiding tab bar dynamically
  const tabBarStyle = activeDescriptor?.options?.tabBarStyle as any;
  if (tabBarStyle?.display === 'none') {
    return null;
  }

  const handlePress = (name: string, key: string) => {
    if (activeRouteName !== name) haptic.select();
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const renderTab = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route || !TAB_CONFIG[routeName]) return null;
    return (
      <TabItem
        key={route.key}
        routeName={routeName}
        focused={activeRouteName === routeName}
        onPress={() => handlePress(route.name, route.key)}
      />
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPad }]}>
      <ScanFab />
      <View style={styles.bar}>
        <View style={styles.tabGroup}>
          {renderTab('plan')}
          {renderTab('recipes')}
        </View>
        <View style={styles.fabGap} />
        <View style={styles.tabGroup}>
          {renderTab('profile')}
          {renderTab('pro')}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Smooth cross-fade when switching tabs instead of an instant swap.
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="plan" options={{ headerShown: false }} />
      <Tabs.Screen name="recipes" options={{ headerShown: false }} />
      <Tabs.Screen name="scan-tab" options={{ headerShown: false }} />
      <Tabs.Screen name="profile" options={{ headerShown: false }} />
      <Tabs.Screen name="pro" options={{ headerShown: false }} />
      <Tabs.Screen name="shopping" options={{ headerShown: false }} />
    </Tabs>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      shadowColor: colors.shadowBlack,
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 18,
    },
    bar: {
      height: BAR_HEIGHT,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    tabGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },

    /* ── Tab item ── */
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 9,
      gap: 4,
    },
    iconBox: {
      width: 42,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.2,
    },
    labelActive: {
      fontFamily: 'Inter_600SemiBold',
      color: colors.green,
    },

    /* ── Center column (reserves space for the FAB) ── */
    fabGap: {
      width: FAB_WIDTH + 28,
    },

    /* ── Floating Scan FAB ── */
    fabPressable: {
      position: 'absolute',
      top: -(FAB_HEIGHT / 2 - 6),
      alignSelf: 'center',
      zIndex: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      width: FAB_WIDTH,
      height: FAB_HEIGHT,
      borderRadius: FAB_RADIUS,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      shadowColor: colors.shadowGreen,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 18,
      elevation: 12,
    },
    // Inner content, inset by the border width so the gradient shows as an outline.
    fabInner: {
      position: 'absolute',
      top: FAB_BORDER,
      left: FAB_BORDER,
      right: FAB_BORDER,
      bottom: FAB_BORDER,
      borderRadius: FAB_RADIUS - FAB_BORDER,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    foodStrip: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    foodSlot: {
      height: FOOD_SLOT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabBeam: {
      position: 'absolute',
      top: 0,
      left: 9,
      right: 9,
      height: 1.5,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.9)',
      shadowColor: colors.white,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
    },
    scanFrame: {
      width: 24,
      height: 34,
    },
    scanFrameCorner: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderColor: colors.white,
    },
    sfTl: { top: 0, left: 0, borderTopWidth: 1.75, borderLeftWidth: 1.75, borderTopLeftRadius: 3 },
    sfTr: {
      top: 0,
      right: 0,
      borderTopWidth: 1.75,
      borderRightWidth: 1.75,
      borderTopRightRadius: 3,
    },
    sfBl: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 1.75,
      borderLeftWidth: 1.75,
      borderBottomLeftRadius: 3,
    },
    sfBr: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 1.75,
      borderRightWidth: 1.75,
      borderBottomRightRadius: 3,
    },
    fabLock: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.white,
    },
  });
