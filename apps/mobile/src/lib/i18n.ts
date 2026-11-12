import type { Language } from '@baitless/detector';
import { getLocales } from 'expo-localization';
import Storage from 'expo-sqlite/kv-store';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en';
import si from '@/locales/si';
import ta from '@/locales/ta';

const LANGUAGE_KEY = 'language';
export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

function initialLanguage(): Language {
  const saved = Storage.getItemSync(LANGUAGE_KEY);
  if (saved === 'en' || saved === 'si' || saved === 'ta') return saved;
  const device = getLocales()[0]?.languageCode;
  return device === 'si' || device === 'ta' ? device : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, si: { translation: si }, ta: { translation: ta } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function currentLanguage(): Language {
  const lng = i18n.language;
  return lng === 'si' || lng === 'ta' ? lng : 'en';
}

export async function setLanguage(language: Language): Promise<void> {
  Storage.setItemSync(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);
}

export default i18n;
