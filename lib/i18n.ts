// i18n — internationalisation de l'app (Türkçe / English / Français).
// Détecte la langue de l'appareil, mémorise le choix de l'utilisateur (AsyncStorage),
// et expose `setAppLanguage` pour le sélecteur « Dil Tercihi ».

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import tr from '../locales/tr.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

export const LANGUAGES = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'app.language';
const FALLBACK_LANG: LanguageCode = 'tr';
const SUPPORTED: string[] = LANGUAGES.map((l) => l.code);

/**
 * Langue de l'appareil : on parcourt TOUTES les langues préférées du téléphone
 * (l'utilisateur peut en avoir plusieurs, ex. [es, en]) et on retient la première
 * que l'app supporte. Sinon on retombe sur le turc.
 */
function detectDeviceLanguage(): string {
  for (const locale of Localization.getLocales()) {
    const code = locale.languageCode?.toLowerCase();
    if (code && SUPPORTED.includes(code)) return code;
  }
  return FALLBACK_LANG;
}

/** Langue de départ = langue de l'appareil si supportée, sinon turc. */
const initialLang = detectDeviceLanguage();

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: initialLang,
  fallbackLng: FALLBACK_LANG,
  interpolation: { escapeValue: false },
});

// Applique la langue mémorisée (chargement asynchrone).
AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (saved && SUPPORTED.includes(saved) && saved !== i18n.language) {
    i18n.changeLanguage(saved);
  }
});

/** Change la langue de l'app et la mémorise. */
export async function setAppLanguage(code: LanguageCode) {
  await AsyncStorage.setItem(STORAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export default i18n;
