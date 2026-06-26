import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { PressableScale } from '../../components/ui/PressableScale';
import { haptic } from '../../lib/haptics';
import { useTranslation } from 'react-i18next';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const { width: SCREEN_W } = Dimensions.get('window');

const BRAID_H = 250;          // hauteur de la zone de tressage
const LANE_GAP = 28;          // écart vertical entre rubans aux bords
const BRAID_AMP = 22;         // amplitude de l'entrelacement au centre
const WAVE_K = 3;             // nombre d'oscillations sur la largeur
const SAMPLES = 42;
// Progression unifiée de l'onboarding : transfert (étape 1) + 7 étapes du questionnaire.
const PROGRESS_SEGMENTS = 8;

/** Rubans : couleur (token du thème) + icône (gauche) + voie + déphasage. */
const LINES: { color: string; icon: MCIName; lane: number; phase: number }[] = [
  { color: Colors.blue,    icon: 'cup-water',   lane: -2, phase: 0.0 },
  { color: Colors.red,     icon: 'fire',        lane: -1, phase: 1.3 },
  { color: Colors.protein, icon: 'food-steak',  lane:  0, phase: 2.6 },
  { color: Colors.orange,  icon: 'fire',        lane:  1, phase: 3.9 },
  { color: Colors.gold,    icon: 'bread-slice', lane:  2, phase: 5.2 },
];

/** Tracé d'un ruban : voies écartées aux bords, tressées (croisées) au centre. */
function buildPath(lane: number, linePhase: number, phase: number, w: number): string {
  const cy = BRAID_H / 2;
  let d = '';
  for (let j = 0; j <= SAMPLES; j++) {
    const u = j / SAMPLES;
    const x = u * w;
    const spread = 1 - Math.sin(Math.PI * u); // 1 aux bords → 0 au centre
    const braid = Math.sin(Math.PI * u);       // 0 aux bords → 1 au centre
    const y =
      cy +
      lane * LANE_GAP * spread +
      braid * BRAID_AMP * Math.sin(WAVE_K * 2 * Math.PI * u - phase + linePhase);
    d += `${j === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
}

/* ─── Bouton continue vert (aligné sur le reste de l'onboarding) ─── */
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

export default function TransferScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);

  // La phase avance → les rubans coulent vers la droite (~30 fps).
  useEffect(() => {
    let last = 0;
    const FRAME = 1000 / 30;
    const loop = (ts: number) => {
      if (ts - last >= FRAME) {
        last = ts;
        setPhase(p => p + 0.12);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const goNext = () => {
    haptic.success();
    router.push('/(onboarding)/setup');
  };

  const cy = BRAID_H / 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header — identique au questionnaire : retour + barre segmentée */}
      <View style={styles.topBar}>
        <PressableScale haptic="light" style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </PressableScale>
        <View style={styles.progressTrack}>
          {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
            <View key={i} style={[styles.progressSeg, i === 0 && styles.progressSegActive]} />
          ))}
        </View>
      </View>

      {/* Titre / sous-titre (typo de l'app) */}
      <View style={styles.head}>
        <Text style={styles.title}>{t('transfer.title')}</Text>
        <Text style={styles.subtitle}>{t('transfer.subtitle')}</Text>
      </View>

      <View style={styles.flex} />

      {/* Zone de tressage animée */}
      <View style={styles.braidArea}>
        <Svg width={SCREEN_W} height={BRAID_H}>
          {LINES.map((l, i) => (
            <Path
              key={i}
              d={buildPath(l.lane, l.phase, phase, SCREEN_W)}
              stroke={l.color}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>

        {/* Icônes à gauche, alignées sur l'origine de chaque ruban */}
        <View style={styles.leftIcons} pointerEvents="none">
          {LINES.map((l, i) => (
            <View
              key={i}
              style={[styles.iconChip, { top: cy + l.lane * LANE_GAP - 16, borderColor: l.color + '55' }]}
            >
              <MaterialCommunityIcons name={l.icon} size={18} color={l.color} />
            </View>
          ))}
        </View>

        {/* Texte central par-dessus le tressage */}
        <View style={styles.centerTextWrap} pointerEvents="none">
          <View style={styles.centerPill}>
            <Text style={styles.centerText}>{t('transfer.preparing')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.flex} />

      {/* CTA — bouton vert de l'app */}
      <View style={styles.footer}>
        <ContinueButton label={t('common.continue')} onPress={goNext} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // Header (copie du questionnaire)
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 6, marginRight: 16 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.separator },
  progressSegActive: { backgroundColor: colors.green },

  head: { paddingHorizontal: 24, paddingTop: 16 },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    lineHeight: 36,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  braidArea: {
    width: SCREEN_W,
    height: BRAID_H,
    justifyContent: 'center',
  },
  leftIcons: { ...StyleSheet.absoluteFillObject },
  iconChip: {
    position: 'absolute',
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPill: {
    backgroundColor: colors.overlayStrong,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  centerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.white,
  },

  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
});

const makeCbStyles = (colors: ThemeColors) => StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.green, height: 52, borderRadius: 16,
    shadowColor: colors.shadowGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 5,
  },
  text: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.white },
  chevs: { flexDirection: 'row', alignItems: 'center' },
});
