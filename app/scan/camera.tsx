import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PressableScale } from '../../components/ui/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { haptic } from '../../lib/haptics';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VF_WIDTH = Math.round(SCREEN_WIDTH * 0.9);
const VF_HEIGHT = Math.round(SCREEN_HEIGHT * 0.55);

export default function CameraScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { mode, slot } = useLocalSearchParams<{ mode?: string; slot?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isMeal = mode === 'meal';
  const resultPath = isMeal ? '/scan/meal-result' : '/scan/result';
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [analyzing, setAnalyzing] = useState(false);
  const [ready, setReady] = useState(false);
  const [galleryPermVisible, setGalleryPermVisible] = useState(false);
  const [galleryCanAskAgain, setGalleryCanAskAgain] = useState(true);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const shutterAnim = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: VF_HEIGHT - 4,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleCapture = async () => {
    if (analyzing || !ready) return;
    haptic.medium();

    // Effet d'obturateur (flash blanc)
    Animated.sequence([
      Animated.timing(shutterAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shutterAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();

    setAnalyzing(true);
    let uri: string | undefined;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6, skipProcessing: true });
      uri = photo?.uri;
    } catch {
      // on continue même si la capture échoue (résultats simulés)
    }

    // Laisse le temps à l'overlay « analyse » de s'afficher (effet pro)
    setTimeout(() => {
      haptic.success();
      setAnalyzing(false);
      router.push({ pathname: resultPath, params: { ...(uri ? { uri } : {}), ...(slot ? { slot } : {}) } });
    }, 1400);
  };

  const launchGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      setAnalyzing(true);
      setTimeout(() => {
        haptic.success();
        setAnalyzing(false);
        router.push({ pathname: resultPath, params: { ...(uri ? { uri } : {}), ...(slot ? { slot } : {}) } });
      }, 1400);
    }
  };

  const handlePickImage = async () => {
    if (analyzing) return;
    haptic.light();
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (perm.granted) {
      launchGallery();
      return;
    }
    if (perm.canAskAgain) {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (req.granted) {
        launchGallery();
        return;
      }
      setGalleryCanAskAgain(req.canAskAgain);
    } else {
      setGalleryCanAskAgain(false);
    }
    setGalleryPermVisible(true);
  };

  const handleGalleryAllow = async () => {
    if (galleryCanAskAgain) {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (req.granted) {
        setGalleryPermVisible(false);
        launchGallery();
        return;
      }
      setGalleryCanAskAgain(req.canAskAgain);
    } else {
      Linking.openSettings();
    }
  };

  const onCapturePressIn = () =>
    Animated.spring(captureScale, { toValue: 0.9, useNativeDriver: true, friction: 6, tension: 120 }).start();
  const onCapturePressOut = () =>
    Animated.spring(captureScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }).start();

  // ── Écran d'autorisation (réutilisé : caméra & galerie) ──
  type IconName = keyof typeof Ionicons.glyphMap;
  const renderPermission = (cfg: {
    icon: IconName;
    title: string;
    desc: string;
    features: { icon: IconName; text: string }[];
    primaryIcon: IconName;
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel: string;
    onSecondary: () => void;
  }) => (
    <View style={styles.container}>
      <View style={[styles.permClose, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <PressableScale haptic="light" style={styles.iconBtn} onPress={cfg.onSecondary} accessibilityLabel={t('a11y.close')}>
          <Ionicons name="close" size={22} color={colors.white} />
        </PressableScale>
      </View>

      <View style={styles.permBody}>
        <View style={styles.permIconWrap}>
          <Ionicons name={cfg.icon} size={44} color={colors.green} />
        </View>
        <Text style={styles.permTitle}>{cfg.title}</Text>
        <Text style={styles.permDesc}>{cfg.desc}</Text>

        <View style={styles.permFeatures}>
          {cfg.features.map((f) => (
            <View key={f.icon} style={styles.permFeatureRow}>
              <View style={styles.permFeatureIcon}>
                <Ionicons name={f.icon} size={18} color={colors.green} />
              </View>
              <Text style={styles.permFeatureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.permFooter, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <PressableScale haptic="light" style={styles.permBtn} onPress={cfg.onPrimary} activeOpacity={0.85}>
          <Ionicons name={cfg.primaryIcon} size={20} color={colors.white} />
          <Text style={styles.permBtnText}>{cfg.primaryLabel}</Text>
        </PressableScale>
        <PressableScale haptic="light" style={styles.permSecondary} onPress={cfg.onSecondary} activeOpacity={0.7}>
          <Text style={styles.permSecondaryText}>{cfg.secondaryLabel}</Text>
        </PressableScale>
      </View>
    </View>
  );

  const insightsFeature = { icon: 'sparkles-outline' as IconName, text: t('scan.camera.permission.features.insights') };
  const privacyFeature = { icon: 'lock-closed-outline' as IconName, text: t('scan.camera.permission.features.privacy') };

  // ── Autorisation en cours de chargement ──
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  // ── Autorisation refusée / pas encore accordée ──
  if (!permission.granted) {
    return renderPermission({
      icon: 'camera',
      title: t('scan.camera.permission.title'),
      desc: t('scan.camera.permission.desc'),
      features: [
        { icon: 'scan-outline', text: t('scan.camera.permission.features.scan') },
        insightsFeature,
        privacyFeature,
      ],
      primaryIcon: permission.canAskAgain ? 'checkmark-circle' : 'settings-outline',
      primaryLabel: permission.canAskAgain
        ? t('scan.camera.permission.allow')
        : t('scan.camera.permission.settings'),
      onPrimary: permission.canAskAgain ? requestPermission : () => Linking.openSettings(),
      secondaryLabel: t('scan.camera.permission.later'),
      onSecondary: () => router.back(),
    });
  }

  // ── Caméra autorisée ──
  return (
    <View style={styles.container}>
      {/* Vraie caméra */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
        onCameraReady={() => setReady(true)}
      />

      {/* Masque assombri avec fenêtre découpée (responsive) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.maskRow} />
        <View style={styles.maskMiddle}>
          <View style={styles.maskSide} />
          <View style={styles.window}>
            <View style={styles.scanClip}>
              {!analyzing && (
                <Animated.View style={[styles.scanBeam, { transform: [{ translateY: scanLineAnim }] }]}>
                  <LinearGradient
                    colors={['rgba(95,214,140,0)', 'rgba(95,214,140,0.28)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.scanGlow}
                  />
                  <View style={styles.scanCore} />
                </Animated.View>
              )}
            </View>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskRowBottom}>
          <View style={styles.hintPill}>
            <Ionicons name="scan-outline" size={15} color={colors.green} />
            <Text style={styles.hintText}>{isMeal ? t('scan.camera.hints.meal') : t('scan.camera.hints.fridge')}</Text>
          </View>
        </View>
      </View>

      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <PressableScale haptic="light" style={styles.iconBtn} onPress={() => router.back()} accessibilityLabel={t('a11y.close')}>
          <Ionicons name="close" size={22} color={colors.white} />
        </PressableScale>
        <Text style={styles.headerTitle}>{isMeal ? t('scan.camera.headers.meal') : t('scan.camera.headers.fridge')}</Text>
        <PressableScale haptic="light"
          style={[styles.iconBtn, torch && styles.iconBtnActive]}
          accessibilityLabel={t('a11y.toggleFlash')}
          onPress={() => {
            haptic.light();
            setTorch(t => !t);
          }}
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={20} color={torch ? colors.scanBg : colors.white} />
        </PressableScale>
      </View>

      {/* Controls */}
      <View style={[styles.controlsWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.controlsRow}>
          <PressableScale haptic="light" style={styles.secondaryBtn} onPress={handlePickImage} disabled={analyzing}>
            <Ionicons name="images-outline" size={22} color={colors.white} />
          </PressableScale>
          <Animated.View style={{ transform: [{ scale: captureScale }] }}>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleCapture}
              onPressIn={onCapturePressIn}
              onPressOut={onCapturePressOut}
              activeOpacity={1}
              disabled={analyzing}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.capturePhoto')}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </Animated.View>
          <PressableScale haptic="light"
            style={styles.secondaryBtn}
            onPress={() => {
              haptic.light();
              setFacing(f => (f === 'back' ? 'front' : 'back'));
            }}
            disabled={analyzing}
          >
            <Ionicons name="camera-reverse-outline" size={22} color={colors.white} />
          </PressableScale>
        </View>
      </View>

      {/* Effet d'obturateur (flash blanc) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.shutter, { opacity: shutterAnim }]}
      />

      {/* Overlay « analyse en cours » */}
      {analyzing && (
        <View style={styles.analyzeOverlay}>
          <View style={styles.analyzeCard}>
            <ActivityIndicator color={colors.green} size="large" />
            <Text style={styles.analyzeTitle}>{t('scan.camera.analyzing.title')}</Text>
            <Text style={styles.analyzeDesc}>{isMeal ? t('scan.camera.analyzing.desc.meal') : t('scan.camera.analyzing.desc.fridge')}</Text>
          </View>
        </View>
      )}

      {/* Overlay autorisation galerie */}
      {galleryPermVisible && (
        <View style={styles.permOverlay}>
          {renderPermission({
            icon: 'images',
            title: t('scan.camera.galleryPermission.title'),
            desc: t('scan.camera.galleryPermission.desc'),
            features: [
              { icon: 'image-outline', text: t('scan.camera.galleryPermission.pick') },
              insightsFeature,
              privacyFeature,
            ],
            primaryIcon: galleryCanAskAgain ? 'checkmark-circle' : 'settings-outline',
            primaryLabel: galleryCanAskAgain
              ? t('scan.camera.galleryPermission.allow')
              : t('scan.camera.permission.settings'),
            onPrimary: handleGalleryAllow,
            secondaryLabel: t('scan.camera.permission.later'),
            onSecondary: () => setGalleryPermVisible(false),
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scanBg },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  /* ── Écran d'autorisation ── */
  permOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scanBg,
    zIndex: 30,
  },
  permClose: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  permBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  permTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 25,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  permDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permFeatures: {
    alignSelf: 'stretch',
    gap: 16,
  },
  permFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  permFeatureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permFeatureText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
  },
  permFooter: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.green,
    height: 54,
    borderRadius: 16,
    alignSelf: 'stretch',
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  permBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  permSecondary: {
    paddingVertical: 14,
    marginTop: 4,
    alignItems: 'center',
  },
  permSecondaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
  },

  /* ── Masque à fenêtre découpée ── */
  maskRow: {
    flex: 1,
    backgroundColor: colors.scanOverlay,
  },
  maskMiddle: {
    height: VF_HEIGHT,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: colors.scanOverlay,
  },
  maskRowBottom: {
    flex: 1,
    backgroundColor: colors.scanOverlay,
    alignItems: 'center',
    paddingTop: 28,
  },
  window: {
    width: VF_WIDTH,
    height: VF_HEIGHT,
    borderRadius: 22,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  hintText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.white,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.gold,
  },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: colors.green },
  tl: { top: -7, left: -7, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 29 },
  tr: { top: -7, right: -7, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 29 },
  bl: { bottom: -7, left: -7, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 29 },
  br: { bottom: -7, right: -7, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 29 },
  scanClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    overflow: 'hidden',
  },
  scanBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
  },
  scanCore: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.green,
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  controlsWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingBottom: 4,
    paddingTop: 16,
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Obturateur & analyse ── */
  shutter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  analyzeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  analyzeTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: 12,
  },
  analyzeDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
