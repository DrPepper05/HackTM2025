import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import translationEN from './locales/en.json'
import translationRO from './locales/ro.json'
import translationHU from './locales/hu.json'
import translationSR from './locales/sr.json'

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  ro: {
    translation: translationRO
  },
  hu: {
    translation: translationHU
  },
  sr: {
    translation: translationSR
  }
}

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'ro', // Default to Romanian
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n