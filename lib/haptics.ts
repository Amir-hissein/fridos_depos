// Fridos — retour haptique
// Wrapper sûr autour d'expo-haptics : ne crashe jamais si l'appareil ne supporte pas
// (web, certains Android, simulateur). Chaque appel est encapsulé dans un try/catch.

import * as Haptics from 'expo-haptics';

function safe(fn: () => Promise<unknown>) {
  try {
    fn().catch(() => {});
  } catch {
    // no-op
  }
}

export const haptic = {
  /** Tap léger — boutons, items de liste */
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Tap moyen — action importante (FAB scan) */
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Succès — cocher un ingrédient, valider */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Sélection — changement d'onglet, filtre */
  select: () => safe(() => Haptics.selectionAsync()),
};

export type HapticKind = keyof typeof haptic;
