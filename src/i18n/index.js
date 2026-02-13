/**
 * i18n Configuration
 * Internationalization setup using i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';
import te from './te.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
};

// Get saved language or default to English
const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for simpler error handling
    },
  });

export default i18n;
